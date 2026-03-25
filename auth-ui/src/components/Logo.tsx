interface LogoProps {
  appName: string;
  subtitle?: string;
}

export function Logo({ appName, subtitle }: LogoProps) {
  return (
    <div className="flex flex-col items-center mb-8 animate-fade-in">
      <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-brand-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-brand-500">{appName}</h1>
      {subtitle && <p className="mt-1 text-sm text-surface-300">{subtitle}</p>}
    </div>
  );
}
