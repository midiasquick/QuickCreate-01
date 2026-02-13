import React from 'react';

export const Designs: React.FC = () => {
    return (
        <div className="w-full h-full min-h-[500px] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
            {/* Placeholder for External App Integration */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                <p>Carregando aplicação externa...</p>
            </div>
        </div>
    );
};