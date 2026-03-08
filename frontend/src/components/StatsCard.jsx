import React from 'react';

const StatsCard = ({ title, value, icon, color, trend }) => {
    const iconColor = color ? color.replace('bg-', 'text-') : '';
    const trendClass = trend !== undefined
        ? (trend > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600')
        : '';

    return (
        <div className="bg-white p-8 rounded-[2rem] border border-primary-light/5 shadow-xl shadow-primary/5 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] group overflow-hidden relative">
            <div className="flex items-center justify-between mb-6">
                <div className={`p-4 rounded-2xl ${color} bg-opacity-10 backdrop-blur-sm border border-${color.split('-')[1] || 'primary'}-500/10`}>
                    {icon && React.cloneElement(icon, { className: iconColor })}
                </div>
                {trend !== undefined && (
                    <span className={`text-xs font-mono font-bold tracking-widest px-3 py-1 rounded-full ${trendClass}`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div className="relative z-10">
                <p className="text-primary-light/60 text-xs font-mono uppercase tracking-widest mb-2">{title}</p>
                <h3 className="text-4xl font-sans font-bold text-primary tracking-tight">{value}</h3>
            </div>

            {/* Decorativo de fundo Magnético */}
            <div className={`absolute -right-8 -bottom-8 w-32 h-32 rounded-full opacity-[0.02] group-hover:scale-[2.5] group-hover:opacity-[0.05] transition-all duration-1000 ease-out ${color} blur-2xl`}></div>
        </div>
    );
};

export default StatsCard;
