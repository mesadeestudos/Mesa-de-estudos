interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
}

export default function EmptyState({ icon, title }: EmptyStateProps) {
  return (
    <div className="flex h-[60vh] flex-col items-center justify-center gap-3 rounded-[32px] border border-white/70 bg-white/75 text-center shadow-xl shadow-slate-200/60 backdrop-blur-xl">
      <div className="text-sky-500">{icon}</div>
      <p className="text-sm font-black text-slate-500">{title}</p>
    </div>
  );
}
