'use client';

import React from 'react';

type BreadcrumbsProps = {
  items: { label: string; onClick?: () => void }[];
};

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-3">
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          {item.onClick ? (
            <button onClick={item.onClick} className="underline">{item.label}</button>
          ) : (
            <span>{item.label}</span>
          )}
          {idx < items.length - 1 && <span>/</span>}
        </React.Fragment>
      ))}
    </div>
  );
}
