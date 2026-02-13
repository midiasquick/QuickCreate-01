import React, { SelectHTMLAttributes } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ label, error, children, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-bold text-gray-500 uppercase mb-1 tracking-wide">
          {label}
        </label>
      )}
      <select
        className={`
            w-full bg-white border border-gray-300 text-gray-800 text-sm rounded-lg 
            focus:ring-2 focus-ring-primary focus-border-primary block p-2.5 
            outline-none transition-all cursor-pointer
            ${error ? 'border-red-500 focus:ring-red-200 focus:border-red-500' : ''}
            ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};