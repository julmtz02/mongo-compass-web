interface PasswordStrengthProps {
  password: string;
}

function calcStrength(pw: string): number {
  let s = 0;
  if (pw.length >= 8) s += 25;
  if (pw.length >= 12) s += 15;
  if (/[A-Z]/.test(pw)) s += 20;
  if (/[0-9]/.test(pw)) s += 20;
  if (/[^A-Za-z0-9]/.test(pw)) s += 20;
  return Math.min(100, s);
}

function getColor(strength: number): string {
  if (strength < 40) return 'bg-red-500';
  if (strength < 70) return 'bg-amber-500';
  return 'bg-brand-500';
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const strength = calcStrength(password);
  if (!password) return null;

  return (
    <div className="mt-2 h-1 bg-surface-600 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${getColor(strength)}`}
        style={{ width: `${strength}%` }}
      />
    </div>
  );
}
