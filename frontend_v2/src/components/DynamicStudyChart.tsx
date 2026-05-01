import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, Target } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function DynamicStudyChart({ profile }: { profile: any }) {
  const [goalHours, setGoalHours] = useState(4); // Default 4 hours
  const goalMinutes = goalHours * 60;

  // Thai Daily Colors: Mon(Yellow), Tue(Pink), Wed(Green), Thu(Orange), Fri(Blue), Sat(Purple), Sun(Red)
  const barColors = [
    'rgba(234, 179, 8, 0.9)',   // Monday - Yellow
    'rgba(236, 72, 153, 0.9)',  // Tuesday - Pink
    'rgba(34, 197, 94, 0.9)',   // Wednesday - Green
    'rgba(249, 115, 22, 0.9)',  // Thursday - Orange
    'rgba(59, 130, 246, 0.9)',  // Friday - Blue
    'rgba(168, 85, 247, 0.9)',  // Saturday - Purple
    'rgba(239, 68, 68, 0.9)',   // Sunday - Red
  ];

  // Mock data or real data mapping
  // Using some mock logic based on total minutes to make it look alive
  const baseMinutes = profile?.total_minutes ? profile.total_minutes / 7 : 60;
  const dataMinutes = [
    baseMinutes * 0.8,
    baseMinutes * 1.2,
    baseMinutes * 0.5,
    baseMinutes * 1.5,
    baseMinutes * 0.9,
    baseMinutes * 2.0,
    baseMinutes * 0.4,
  ].map(m => Math.min(Math.round(m), 600)); // Cap at 10 hours for display safety

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-bgCard/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl flex flex-col md:flex-row gap-8"
    >
      {/* Left: Overall Info & Slider */}
      <div className="w-full md:w-1/3 flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            <Clock className="text-brand-400" /> Study Time
          </h3>
          <p className="text-gray-400 text-sm mb-6">Track your weekly learning momentum</p>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Overall Time</span>
            <div className="text-4xl font-black bg-gradient-to-r from-blue-400 to-brand-400 bg-clip-text text-transparent truncate">
              {profile?.total_minutes || 0}
              <span className="text-lg text-gray-500 ml-2 font-medium">mins</span>
            </div>
          </div>
        </div>

        <div className="bg-brand-900/10 border border-brand-500/20 rounded-2xl p-5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Target size={48} className="text-brand-500" /></div>
          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wider block mb-3 relative z-10">Daily Goal</span>
          <div className="flex items-end gap-2 mb-4 relative z-10">
            <span className="text-3xl font-bold text-white">{goalHours}</span>
            <span className="text-sm font-medium text-gray-400 mb-1">hrs / day</span>
          </div>
          <input 
            type="range" 
            min="1" max="10" step="1"
            value={goalHours}
            onChange={(e) => setGoalHours(Number(e.target.value))}
            className="w-full accent-brand-500 relative z-10 h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-gray-500 mt-2 relative z-10">
            <span>1h</span>
            <span>10h</span>
          </div>
        </div>
      </div>

      {/* Right: Bar Chart */}
      <div className="w-full md:w-2/3 h-[300px] md:h-auto min-h-[300px]">
        {/* We use Goal Line dataset to make it dynamic */}
        <Bar 
          data={{
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
              {
                label: 'Study Minutes',
                data: dataMinutes,
                backgroundColor: barColors,
                borderRadius: 8,
                barPercentage: 0.7,
                categoryPercentage: 0.9,
              },
              {
                label: 'Goal line',
                data: [goalMinutes, goalMinutes, goalMinutes, goalMinutes, goalMinutes, goalMinutes, goalMinutes],
                type: 'line',
                borderColor: '#10b981', // Emerald green
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                tension: 0
              }
            ]
          }} 
          options={{
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                grid: { color: 'rgba(255,255,255,0.05)' },
                ticks: { color: '#9ca3af' }
              },
              x: {
                grid: { display: false },
                ticks: { color: '#9ca3af', font: { weight: 'bold' } }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#fff',
                bodyColor: '#e5e7eb',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                padding: 12,
                displayColors: false,
                callbacks: {
                  label: (context) => {
                    if (context.dataset.type === 'line') return `Goal: ${context.raw} mins`;
                    return `${context.raw} mins read`;
                  }
                }
              }
            }
          }} 
        />
      </div>
    </motion.div>
  );
}
