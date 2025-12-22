const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fsp = require('fs/promises');
const os = require('os');
const { Worker } = require('worker_threads');
const { vodOpenapi, edit } = require('@volcengine/openapi');
const { uploadToTos } = require('./tosUpload');

const pdfRenderWorkerPath = path.join(__dirname, 'pdfRendererWorker.js');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const pptVideoTasks = new Map(); // taskId -> task data
const vodService = vodOpenapi.defaultService;
const editService = edit.defaultService;

const parseResolution = (value = '1280x720') => {
  const match = `${value}`.match(/(\d+)\s*x\s*(\d+)/);
  if (!match) return { width: 1280, height: 720, raw: '1280x720' };
  const width = Math.max(320, Math.min(3840, parseInt(match[1], 10) || 1280));
  const height = Math.max(240, Math.min(2160, parseInt(match[2], 10) || 720));
  return { width, height, raw: `${width}x${height}` };
};

const ensureVolcClient = () => {
  const accessKeyId = process.env.VOLC_ACCESS_KEY_ID || process.env.VOLC_ACCESSKEY;
  const secretKey = process.env.VOLC_SECRET_ACCESS_KEY || process.env.VOLC_SECRETKEY;
  const spaceName = process.env.VOLC_VOD_SPACE;
  if (!accessKeyId || !secretKey || !spaceName) {
    throw new Error('缺少火山引擎凭证：请配置 VOLC_ACCESS_KEY_ID、VOLC_SECRET_ACCESS_KEY、VOLC_VOD_SPACE');
  }
  vodService.setAccessKeyId(accessKeyId);
  vodService.setSecretKey(secretKey);
  editService.setAccessKeyId(accessKeyId);
  editService.setSecretKey(secretKey);
  return { spaceName };
};

const setTask = (taskId, patch) => {
  const prev = pptVideoTasks.get(taskId);
  if (!prev) return;
  const next = {
    ...prev,
    ...patch,
    updatedAt: Date.now()
  };
  if (patch.log) {
    next.logs = [...(prev.logs || []), patch.log];
  }
  pptVideoTasks.set(taskId, next);
};

const failTask = (taskId, step, err) => {
  const detail = err?.stack || err?.message || String(err);
  const message = err?.message || '任务失败';
  console.error(`[ppt-to-video][${taskId}] ${step} failed`, detail);
  setTask(taskId, {
    status: 'failed',
    progress: 100,
    message,
    error: { step, message, detail }
  });
};

const toUint8 = (data) => {
  if (!data) return new Uint8Array();
  if (data instanceof Uint8Array && !Buffer.isBuffer(data)) return data;
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }
  return new Uint8Array(data);
};

const toArrayBuffer = (data) => {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  if (Buffer.isBuffer(data)) {
    return data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  }
  throw new Error('Unsupported buffer type for transfer');
};

const runPdfWorker = (payload) =>
  new Promise((resolve, reject) => {
    const worker = new Worker(pdfRenderWorkerPath);
    const transferList = [];
    if (payload.buffer instanceof ArrayBuffer) {
      transferList.push(payload.buffer);
    }
    const timer = setTimeout(() => {
      worker.terminate();
      reject(new Error('PDF 解析超时，请重试'));
    }, 120000);
    const finalize = (err, data) => {
      clearTimeout(timer);
      try {
        worker.terminate();
      } catch (e) {
        // ignore terminate errors
      }
      if (err) return reject(err);
      return resolve(data);
    };
    worker.on('message', (msg) => {
      if (!msg || typeof msg !== 'object') return;
      if (msg.type === 'ERROR') {
        finalize(new Error(`PDF 解析失败：${msg.message || 'worker error'}`));
        return;
      }
      finalize(null, msg);
    });
    worker.on('error', (err) => finalize(err));
    worker.postMessage(payload, transferList);
  });

const renderPdfToImages = async ({ buffer, resolution, tempDir, taskId }) => {
  const { width: targetWidth, height: targetHeight } = resolution;
  const pdfBuffer = toArrayBuffer(buffer);
  const result = await runPdfWorker({
    type: 'PARSE_PDF',
    buffer: pdfBuffer,
    width: targetWidth,
    height: targetHeight
  });
  const pages = Array.isArray(result?.pages) ? result.pages : [];
  if (!pages.length) {
    throw new Error('PDF 解析失败：未获取到任何页面');
  }
  const images = [];
  const total = result.pageCount || pages.length;
  for (let idx = 0; idx < pages.length; idx++) {
    const page = pages[idx];
    const fileName = `page-${String(page.index || idx + 1).padStart(3, '0')}.png`;
    const filePath = path.join(tempDir, fileName);
    const pngBuffer = Buffer.from(page.pngBuffer);
    await fsp.writeFile(filePath, pngBuffer);
    images.push({ fileName, filePath, buffer: pngBuffer, width: targetWidth, height: targetHeight });
    setTask(taskId, {
      status: 'processing',
      progress: Math.round(((idx + 1) / total) * 40),
      message: `正在解析 PDF 第 ${idx + 1}/${total} 页`
    });
  }
  return images;
};

const getPdfPageCount = async (buffer) => {
  const pdfBuffer = toArrayBuffer(buffer);
  const result = await runPdfWorker({ type: 'PAGE_COUNT', buffer: pdfBuffer });
  if (typeof result?.pageCount === 'number') return result.pageCount;
  throw new Error('未获取到 PDF 页数');
};

const sanitizeUploadName = (fileName, idx, taskId) => {
  const safe = (fileName || `page-${idx + 1}.png`).replace(/[\\/:*?"<>|]+/g, '_').trim();
  const parts = safe.split('.');
  let base = parts[0] || `page-${idx + 1}`;
  let ext = parts.length > 1 ? parts.pop() : 'png';
  ext = (ext || 'png').toLowerCase().replace(/^\.+/, '') || 'png';
  base = base.replace(/\.+$/, '');
  return `ppt-video/${taskId}/${base}.${ext}`;
};

const uploadImagesToTos = async ({ images, taskId }) => {
  const uploaded = [];
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      const finalName = sanitizeUploadName(img.fileName, i, taskId);
      const { url } = await uploadToTos({
        key: finalName,
        body: img.buffer,
        contentType: 'image/png',
        taskId
      });
      uploaded.push({
        url,
        key: finalName,
        fileName: img.fileName
      });
      setTask(taskId, {
        status: 'uploading',
        progress: 40 + Math.round(((i + 1) / images.length) * 25),
        message: `正在上传素材 ${i + 1}/${images.length}`
      });
    } catch (err) {
      console.error(`[ppt-to-video][${taskId}] upload image failed`, err);
      const detail = err?.message || err;
      throw new Error(`上传 ${img.fileName} 失败：${detail}`);
    }
  }
  return uploaded;
};

const submitDirectEdit = async ({ uploadedImages, resolution, durationPerSlide, transition, taskId }) => {
  const { spaceName } = ensureVolcClient();
  const durationMs = Math.min(10, Math.max(2, durationPerSlide || 3)) * 1000;
  const transitionTime = transition === 'fade' ? Math.min(800, Math.floor(durationMs / 2)) : undefined;

  const segments = uploadedImages.map((img) => ({
    Duration: durationMs,
    Transition: transition === 'fade' ? 'fade' : undefined,
    TransitionTime: transitionTime,
    Elements: [
      {
        Type: 'image',
        Source: img.url,
        Duration: durationMs,
        StartTime: 0
      }
    ]
  }));

  const datePart = new Date();
  const videoName = `AI教学视频_${datePart.getMonth() + 1}${String(datePart.getDate()).padStart(2, '0')}`;

  const submitRes = await editService.SubmitDirectEditTaskAsync({
    Uploader: 'ai-online-learning',
    Application: spaceName,
    VideoName: videoName,
    EditParam: {
      Upload: { Uploader: 'ai-online-learning', VideoName: videoName },
      Output: {
        Width: resolution.width,
        Height: resolution.height,
        Format: 'mp4',
        Fps: 30,
        Quality: 'medium'
      },
      Segments: segments
    }
  });

  const error = submitRes?.ResponseMetadata?.Error;
  if (error && error.Code) {
    throw new Error(`提交合成任务失败：${error.Code} ${error.Message}`);
  }
  const reqId = submitRes?.Result?.ReqId || submitRes?.ReqId;
  if (!reqId) {
    throw new Error('未获取到合成任务 ID');
  }
  setTask(taskId, {
    status: 'rendering',
    progress: 70,
    message: '云端合成中...',
    reqId
  });
  return { reqId, videoName };
};

const pollEditResult = async ({ reqId, taskId, maxRetry = 60 }) => {
  let attempt = 0;
  while (attempt < maxRetry) {
    attempt += 1;
    const res = await editService.GetDirectEditResult({ ReqIds: [reqId] });
    const error = res?.ResponseMetadata?.Error;
    if (error && error.Code) {
      throw new Error(`查询合成状态失败：${error.Code} ${error.Message}`);
    }
    const resultList = res?.Result || [];
    const record = Array.isArray(resultList) ? resultList[0] : resultList;
    const status = (record?.Status || '').toLowerCase();
    const message = record?.Message || '云端合成中...';
    setTask(taskId, {
      status: status === 'success' ? 'rendering' : status === 'failed' ? 'failed' : 'rendering',
      progress: Math.min(95, 70 + Math.round((attempt / maxRetry) * 25)),
      message
    });

    if (status === 'success' || status === 'succeed') {
      return record?.OutputVid || record?.SubVid?.[0];
    }
    if (status === 'failed' || status === 'fail') {
      throw new Error(message || '云端合成失败');
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  throw new Error('合成超时，请稍后重试');
};

const fetchPlayInfo = async (vid) => {
  const res = await vodService.GetPlayInfo({ Vid: vid, FileType: 'mp4', Ssl: '1' });
  const error = res?.ResponseMetadata?.Error;
  if (error && error.Code) {
    throw new Error(`获取播放地址失败：${error.Code} ${error.Message}`);
  }
  const result = res?.Result || {};
  const playInfo = Array.isArray(result.PlayInfoList) ? result.PlayInfoList[0] : null;
  const videoUrl = playInfo?.MainPlayUrl || playInfo?.BackupPlayUrl || '';
  const downloadUrl = result?.AdaptiveInfo?.MainPlayUrl || videoUrl;
  return { videoUrl, downloadUrl };
};

const processTask = async (taskId) => {
  const task = pptVideoTasks.get(taskId);
  if (!task || task.status === 'failed') return;
  try {
    setTask(taskId, { status: 'processing', message: '开始解析 PDF', progress: 5 });
    const images = await renderPdfToImages({
      buffer: task.buffer,
      resolution: task.resolution,
      tempDir: task.tempDir,
      taskId
    });
    setTask(taskId, { buffer: null });
    setTask(taskId, { status: 'uploading', message: '开始上传图片素材', progress: 45 });
    const uploaded = await uploadImagesToTos({ images, taskId });
    const { reqId } = await submitDirectEdit({
      uploadedImages: uploaded,
      resolution: task.resolution,
      durationPerSlide: task.durationPerSlide,
      transition: task.transition,
      taskId
    });
    const vid = await pollEditResult({ reqId, taskId });
    const { videoUrl, downloadUrl } = await fetchPlayInfo(vid);
    setTask(taskId, {
      status: 'success',
      progress: 100,
      message: '生成完成，可预览/下载',
      videoUrl,
      downloadUrl,
      vid
    });
  } catch (err) {
    failTask(taskId, 'process', err);
  } finally {
    setTimeout(() => {
      try {
        fs.rm(task.tempDir, { recursive: true, force: true }, () => {});
      } catch (e) {
        // ignore
      }
    }, 10 * 60 * 1000);
  }
};

const createTask = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ error: '缺少上传的 PDF 文件' });
    }
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (ext !== '.pdf') {
      return res.status(400).json({ error: '仅支持 PDF，请先在本地将 PPT 导出为 PDF' });
    }
    const durationPerSlide = Math.min(10, Math.max(2, Number(req.body.durationPerSlide) || 3));
    const transition = req.body.transition === 'none' ? 'none' : 'fade';
    const resolution = parseResolution(req.body.resolution);
    const taskId = Math.random().toString(36).slice(2, 10);
    const tempDir = path.join(os.tmpdir(), 'ppt-to-video', taskId);
    await fsp.mkdir(tempDir, { recursive: true });
    const pdfBytes = toUint8(file.buffer);
    const pdfPath = path.join(tempDir, 'upload.pdf');
    await fsp.writeFile(pdfPath, pdfBytes);
    let pageCount = null;
    let pageCountError = '';
    try {
      pageCount = await getPdfPageCount(pdfBytes);
    } catch (err) {
      pageCountError = err?.message || String(err);
      console.warn(`[ppt-to-video][${taskId}] parse page count failed`, pageCountError);
    }
    const task = {
      id: taskId,
      status: 'queued',
      progress: 0,
      message: '任务已创建，等待处理',
      videoUrl: '',
      downloadUrl: '',
      transition,
      durationPerSlide,
      resolution,
      buffer: pdfBytes,
      tempDir,
      pageCount,
      createdAt: Date.now(),
      logs: [{ ts: Date.now(), message: '任务创建成功' }]
    };
    pptVideoTasks.set(taskId, task);
    processTask(taskId);
    const fileSizeMB = Number((pdfBytes.length / 1024 / 1024).toFixed(1));
    return res.json({ taskId, status: 'queued', fileName: file.originalname, fileSizeMB, pageCount, pageCountError });
  } catch (err) {
    console.error('create ppt-to-video task failed', err);
    return res.status(500).json({ error: err?.message || '创建任务失败', detail: err?.stack || err });
  }
};

const getTaskStatus = (req, res) => {
  const { taskId } = req.query || {};
  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }
  const task = pptVideoTasks.get(taskId);
  if (!task) {
    return res.status(404).json({ error: 'task not found' });
  }
  const payload = {
    status: task.status,
    progress: task.progress,
    message: task.message,
    videoUrl: task.videoUrl,
    downloadUrl: task.downloadUrl,
    error: task.error
  };
  return res.json(payload);
};

const registerPptToVideoRoutes = (app) => {
  const router = express.Router();
  router.post('/create', upload.single('file'), createTask);
  router.get('/status', getTaskStatus);
  app.use('/api/ppt-to-video', router);
};

module.exports = {
  registerPptToVideoRoutes
};
