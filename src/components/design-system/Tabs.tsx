import React from 'react';

interface Tab {
  key: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (key: string) => void;
}

export function Tabs({ tabs, activeTab, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-[#E9ECEF]">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          className={`flex items-center gap-2 px-4 py-3 transition-all duration-200 border-b-2 ${
            activeTab === tab.key
              ? 'border-[#4C6EF5] text-[#4C6EF5]'
              : 'border-transparent text-[#ADB5BD] hover:text-[#212529]'
          }`}
          onClick={() => onChange(tab.key)}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}
