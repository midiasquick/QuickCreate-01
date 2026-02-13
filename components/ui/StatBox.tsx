import React from 'react';

interface StatBoxProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  color?: string;
}

export const StatBox: React.FC<StatBoxProps> = ({ icon: Icon, label, value, color = "text-slate-600" }) => {
  return (
    <div className="flex items-center space-x-3 p-2">
      <div className={`p-3 rounded-full bg-gray-100 ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
};
