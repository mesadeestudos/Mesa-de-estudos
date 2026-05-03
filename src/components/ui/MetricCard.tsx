interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: 'sky' | 'amber' | 'emerald' | 'slate';
  className?: string;
}

export default function MetricCard({ icon, label, value, tone = 'sky', className = '' }: MetricCardProps) {
  const colors = {
    sky: 'text-sky-500',
    amber: 'text-amber-500',
    emerald: 'text-emerald-500',
    slate: 'text-slate-500',
  }[tone];

  return (
    <div className={`rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-xl shadow-slate-200/60 backdrop-blur-xl ${className}`}>
      <div className={colors}>{icon}</div>
      <p className="mt-3 text-2xl font-black text-slate-800">{value}</p>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
