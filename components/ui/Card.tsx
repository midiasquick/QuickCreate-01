import React, { ReactNode } from 'react';

interface CardProps {
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const Card: React.FC<CardProps> = ({ title, children, actions, className = '' }) => {
  return (
    <div className={`bg-white rounded-lg shadow-sm overflow-hidden flex flex-col ${className}`}>
      <div className="bg-slate-800 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="text-sm font-bold uppercase tracking-wide">{title}</h3>
        {actions && <div>{actions}</div>}
      </div>
      <div className="p-4 flex-grow">
        {children}
      </div>
    </div>
  );
};
