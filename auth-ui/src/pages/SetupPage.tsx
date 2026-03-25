import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { PasswordStrength } from '../components/PasswordStrength';
import { api } from '../lib/api';
import { getConfig } from '../lib/config';

export function SetupPage() {
  const { appName } = getConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await api('/api/auth/setup', {
        method: 'POST',
        body: { username, password },
      });

      if (res.ok) {
        setDone(true);
        setTimeout(() => { window.location.href = '/'; }, 1500);
      } else {
        setError(res.data.error || 'Setup failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="text-center">
          <div className="py-8 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-brand-500 mb-2">Setup Complete!</h2>
            <p className="text-surface-300">Redirecting to dashboard...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-lg">
        <Logo appName={appName} subtitle="Create your admin account to get started" />
        <Alert variant="error" visible={!!error}>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <FormField
            id="username"
            label="Admin Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            minLength={3}
            placeholder="Choose a username"
            hint="At least 3 characters — letters, numbers, _, ., -"
          />
          <div className="mb-4">
            <FormField
              id="password"
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              placeholder="Create a strong password"
              hint="At least 8 characters"
            />
            <PasswordStrength password={password} />
          </div>
          <FormField
            id="confirm"
            label="Confirm Password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
            placeholder="Re-enter your password"
            error={confirm && password !== confirm ? 'Passwords do not match' : undefined}
          />
          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Admin Account
          </Button>
        </form>
      </Card>
    </div>
  );
}
