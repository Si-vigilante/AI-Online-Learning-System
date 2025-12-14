import React from 'react';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-[#ADB5BD]" />}
          <span
            className={`${
              index === items.length - 1
                ? 'text-[#212529]'
                : 'text-[#ADB5BD] hover:text-[#4C6EF5] cursor-pointer'
            } transition-colors`}
            onClick={item.onClick}
          >
            {item.label}
          </span>
        </React.Fragment>
      ))}
    </div>
  );
}
