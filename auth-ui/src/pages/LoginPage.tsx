import { useState, type FormEvent } from 'react';
import { Logo } from '../components/Logo';
import { Card } from '../components/Card';
import { FormField } from '../components/FormField';
import { Button } from '../components/Button';
import { Alert } from '../components/Alert';
import { api } from '../lib/api';
import { getConfig } from '../lib/config';

export function LoginPage() {
  const { appName } = getConfig();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { username, password },
      });

      if (res.ok) {
        window.location.href = '/';
      } else {
        setError(res.data.error || 'Login failed');
      }
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card>
        <Logo appName={appName} subtitle="Sign in to continue" />
        <Alert variant="error" visible={!!error}>{error}</Alert>
        <form onSubmit={handleSubmit}>
          <FormField
            id="username"
            label="Username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
            required
            placeholder="Enter your username"
          />
          <FormField
            id="password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            placeholder="Enter your password"
          />
          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>
      </Card>
    </div>
  );
}
