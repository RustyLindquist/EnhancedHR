import React from 'react';

interface ROIChartProps {
    data: { label: string; value: number }[];
    color?: string;
}

const ROIChart: React.FC<ROIChartProps> = ({ data, color = 'bg-brand-blue-light' }) => {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
        <div className="w-full h-full flex items-end justify-between gap-2 pt-8">
            {data.map((item, index) => {
                const heightPercentage = (item.value / maxValue) * 100;
                return (
                    <div key={index} className="flex flex-col items-center gap-2 group w-full">
                        <div className="relative w-full flex justify-center h-48 items-end">
                            <div
                                className={`w-full max-w-[40px] rounded-t-lg opacity-80 group-hover:opacity-100 transition-all duration-500 ${color}`}
                                style={{ height: `${heightPercentage}%` }}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-white text-black text-xs font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                    {item.value} hrs
                                </div>
                            </div>
                        </div>
                        <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
};

export default ROIChart;
