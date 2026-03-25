import { useState, useEffect, useCallback } from 'react';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField } from '../components/FormField';
import { Alert } from '../components/Alert';
import { api } from '../lib/api';
import { getConfig } from '../lib/config';

interface User {
  id: string;
  username: string;
  role: 'admin' | 'editor' | 'viewer';
  is_active: number;
  last_login: string | null;
  created_at: string;
}

interface UserFormData {
  username: string;
  password: string;
  role: 'admin' | 'editor' | 'viewer';
}

export function AdminPage() {
  const { appName } = getConfig();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState<UserFormData>({ username: '', password: '', role: 'viewer' });
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const loadUsers = useCallback(async () => {
    try {
      const res = await api<{ users: User[] }>('/api/admin/users');
      if (res.status === 401) { window.location.href = '/login'; return; }
      if (res.status === 403) { setError('Admin access required'); return; }
      if (res.ok) setUsers(res.data.users);
    } catch {
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  function openAddModal() {
    setEditingUser(null);
    setForm({ username: '', password: '', role: 'viewer' });
    setFormError('');
    setModalOpen(true);
  }

  function openEditModal(user: User) {
    setEditingUser(user);
    setForm({ username: user.username, password: '', role: user.role });
    setFormError('');
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError('');
    setSaving(true);

    try {
      if (editingUser) {
        const body: Record<string, unknown> = { username: form.username, role: form.role };
        if (form.password) body.password = form.password;
        const res = await api(`/api/admin/users/${editingUser.id}`, { method: 'PUT', body });
        if (!res.ok) { setFormError(res.data.error); return; }
      } else {
        const res = await api('/api/admin/users', { method: 'POST', body: form });
        if (!res.ok) { setFormError(res.data.error); return; }
      }
      setModalOpen(false);
      loadUsers();
    } catch {
      setFormError('Request failed');
    } finally {
      setSaving(false);
    }
  }

  async function toggleUser(user: User) {
    const action = user.is_active ? 'disable' : 'enable';
    if (!confirm(`${action.charAt(0).toUpperCase() + action.slice(1)} ${user.username}?`)) return;
    await api(`/api/admin/users/${user.id}`, { method: 'PUT', body: { is_active: !user.is_active } });
    loadUsers();
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-brand-500">Admin Panel</h1>
            <p className="text-sm text-surface-400 mt-1">{appName} user management</p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="inline-block">
              <Button variant="secondary" size="sm">Back to Compass</Button>
            </a>
            <Button size="sm" onClick={openAddModal}>Add User</Button>
          </div>
        </div>

        <Alert variant="error" visible={!!error}>{error}</Alert>

        {/* Users Table */}
        <div className="bg-surface-700 rounded-2xl overflow-hidden shadow-xl">
          {loading ? (
            <div className="p-12 text-center text-surface-400">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-surface-400">No users found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-600">
                    <th className="text-left px-6 py-4 text-xs font-medium text-surface-400 uppercase tracking-wider">User</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Role</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-surface-400 uppercase tracking-wider hidden sm:table-cell">Status</th>
                    <th className="text-left px-6 py-4 text-xs font-medium text-surface-400 uppercase tracking-wider hidden md:table-cell">Last Login</th>
                    <th className="text-right px-6 py-4 text-xs font-medium text-surface-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-600/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-surface-600/30 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-surface-100">{user.username}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={user.role}>{user.role}</Badge>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <Badge variant={user.is_active ? 'active' : 'inactive'}>
                          {user.is_active ? 'Active' : 'Disabled'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-surface-400 hidden md:table-cell">
                        {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="secondary" size="sm" onClick={() => openEditModal(user)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => toggleUser(user)}>
                            {user.is_active ? 'Disable' : 'Enable'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* User Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? 'Edit User' : 'Add User'}>
        <form onSubmit={handleSubmit}>
          <Alert variant="error" visible={!!formError}>{formError}</Alert>
          <FormField
            id="newUsername"
            label="Username"
            type="text"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
            minLength={3}
            autoFocus
          />
          <FormField
            id="newPassword"
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required={!editingUser}
            minLength={8}
            hint={editingUser ? 'Leave empty to keep current password' : 'Minimum 8 characters'}
          />
          <div className="mb-4">
            <label htmlFor="newRole" className="block text-sm font-medium text-surface-300 mb-1.5">Role</label>
            <select
              id="newRole"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as UserFormData['role'] })}
              className="w-full px-4 py-3 bg-surface-900 border border-surface-600 rounded-xl text-surface-100 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"
            >
              <option value="viewer">Viewer — Read only</option>
              <option value="editor">Editor — Read &amp; Write</option>
              <option value="admin">Admin — Full access</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" loading={saving} className="flex-1">
              {editingUser ? 'Save Changes' : 'Create User'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
