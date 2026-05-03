'use client';

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

export default function MenuItem({ icon, label, active = false, onClick }: MenuItemProps) {
  return (
    <button
      onClick={onClick}
      className={`group flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-all ${
        active
          ? 'bg-white/16 font-bold text-white ring-1 ring-white/15'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`}
    >
      <span className={active ? 'rounded-xl bg-sky-400 p-1.5 text-white' : 'text-slate-400 group-hover:text-sky-200'}>
        {icon}
      </span>
      <span className="truncate text-[13px]">{label}</span>
    </button>
  );
}
