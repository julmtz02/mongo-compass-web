type BadgeVariant = 'admin' | 'editor' | 'viewer' | 'active' | 'inactive';

interface BadgeProps {
  variant: BadgeVariant;
  children: string;
}

const styles: Record<BadgeVariant, string> = {
  admin: 'bg-brand-500/15 text-brand-400',
  editor: 'bg-blue-500/15 text-blue-400',
  viewer: 'bg-amber-500/15 text-amber-400',
  active: 'bg-brand-500/15 text-brand-400',
  inactive: 'bg-red-500/15 text-red-400',
};

export function Badge({ variant, children }: BadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold uppercase ${styles[variant]}`}>
      {children}
    </span>
  );
}
