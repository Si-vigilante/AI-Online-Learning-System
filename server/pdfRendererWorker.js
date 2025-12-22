const { parentPort } = require('worker_threads');
const fs = require('fs');
const { createCanvas } = require('@napi-rs/canvas');
const workerFilePath = require.resolve('pdfjs-dist/legacy/build/pdf.worker.mjs');

let pdfjsLibPromise = null;

const loadPdfJs = async () => {
  if (!pdfjsLibPromise) {
    pdfjsLibPromise = import('pdfjs-dist/legacy/build/pdf.mjs');
  }
  const lib = await pdfjsLibPromise;
  // Force single-threaded parsing inside this worker to avoid nested workers and invalid transfers.
  if (!lib.GlobalWorkerOptions.workerSrc) {
    try {
      const workerCode = fs.readFileSync(workerFilePath, 'utf8');
      const workerDataUrl = `data:application/javascript;base64,${Buffer.from(workerCode, 'utf8').toString('base64')}`;
      lib.GlobalWorkerOptions.workerSrc = workerDataUrl;
    } catch (err) {
      lib.GlobalWorkerOptions.workerSrc = '';
    }
  }
  lib.GlobalWorkerOptions.workerPort = null;
  return lib;
};

const toUint8 = (data) => {
  if (!data) return new Uint8Array();
  if (data instanceof ArrayBuffer) return new Uint8Array(data);
  if (ArrayBuffer.isView(data)) {
    return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  }
  throw new Error('Unsupported buffer type');
};

const renderPdf = async ({ buffer, width, height }) => {
  const pdfjsLib = await loadPdfJs();
  const pdfData = toUint8(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: false,
    disableWorker: true,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    isOffscreenCanvasSupported: false,
    disableCreateObjectURL: true
  });
  const pdf = await loadingTask.promise;
  const pages = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const unscaledViewport = page.getViewport({ scale: 1 });
    const scale = Math.max(width / unscaledViewport.width, height / unscaledViewport.height);
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    context.fillStyle = '#FFFFFF';
    context.fillRect(0, 0, width, height);

    const offsetX = Math.max(0, (width - viewport.width) / 2);
    const offsetY = Math.max(0, (height - viewport.height) / 2);

    await page
      .render({
        canvasContext: context,
        viewport,
        transform: [1, 0, 0, 1, offsetX, offsetY]
      })
      .promise;

    const pngBuffer = canvas.toBuffer('image/png');
    const pngArrayBuffer = pngBuffer.buffer.slice(
      pngBuffer.byteOffset,
      pngBuffer.byteOffset + pngBuffer.byteLength
    );
    pages.push({ index: i, pngBuffer: pngArrayBuffer, width, height });
  }
  return { pages, pageCount: pdf.numPages || pages.length };
};

const getPageCount = async (buffer) => {
  const pdfjsLib = await loadPdfJs();
  const pdfData = toUint8(buffer);
  const loadingTask = pdfjsLib.getDocument({
    data: pdfData,
    useSystemFonts: true,
    isEvalSupported: false,
    disableFontFace: false,
    disableWorker: true,
    disableRange: true,
    disableStream: true,
    disableAutoFetch: true,
    isOffscreenCanvasSupported: false,
    disableCreateObjectURL: true
  });
  const pdf = await loadingTask.promise;
  return pdf.numPages || 0;
};

parentPort.on('message', async (msg) => {
  if (!msg || typeof msg !== 'object') return;
  try {
    if (msg.type === 'PARSE_PDF') {
      const { buffer, width, height } = msg;
      const { pages, pageCount } = await renderPdf({ buffer, width, height });
      const transferList = pages.map((p) => p.pngBuffer);
      parentPort.postMessage({ type: 'PARSED', pages, pageCount }, transferList);
      return;
    }
    if (msg.type === 'PAGE_COUNT') {
      const total = await getPageCount(msg.buffer);
      parentPort.postMessage({ type: 'PAGE_COUNT', pageCount: total });
    }
  } catch (err) {
    parentPort.postMessage({ type: 'ERROR', message: err?.message || String(err) });
  }
});
