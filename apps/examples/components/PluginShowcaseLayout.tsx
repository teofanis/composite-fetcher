// components/PluginShowcaseLayout.tsx
import React from 'react';

interface PluginShowcaseProps {
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const PluginShowcaseLayout: React.FC<PluginShowcaseProps> = ({
  title,
  children,
  footer,
}) => {
  return (
    <div className="flex flex-col items-center w-1/3 mb-6 shadow-lg p-4 rounded-md bg-gray-700  ">
      <h3 className="text-lg font-bold mb-3">{title}</h3>
      <div className="w-full">{children}</div>
      {footer && <div className="mt-4">{footer}</div>}
    </div>
  );
};

export default PluginShowcaseLayout;
