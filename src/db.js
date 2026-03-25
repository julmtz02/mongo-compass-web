'use strict';

const { AUTH_PBKDF2_ITERATIONS, AUTH_PBKDF2_KEY_LENGTH, AUTH_PBKDF2_DIGEST, USERNAME_PATTERN, SESSION_DURATION_HOURS } = require('./constants');

const Database = require('better-sqlite3');
const crypto = require('crypto');
const path = require('path');

const DB_PATH = process.env.CW_DB_PATH || path.resolve(__dirname, '..', 'data', 'compass-web.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!dir.includes(':memory:') && !fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'viewer' CHECK(role IN ('admin', 'editor', 'viewer')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_login TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS connection_permissions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      connection_id TEXT NOT NULL,
      permission TEXT NOT NULL DEFAULT 'read' CHECK(permission IN ('read', 'write', 'admin')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE(user_id, connection_id)
    );

    CREATE TABLE IF NOT EXISTS setup_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_permissions_user ON connection_permissions(user_id);
    CREATE INDEX IF NOT EXISTS idx_permissions_conn ON connection_permissions(connection_id);
  `);
}

// ─── Password Hashing ───
function hashPassword(password, salt) {
  if (!salt) salt = crypto.randomBytes(32).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, AUTH_PBKDF2_ITERATIONS, AUTH_PBKDF2_KEY_LENGTH, AUTH_PBKDF2_DIGEST).toString('hex');
  return { hash, salt };
}

function verifyPassword(password, storedHash, storedSalt) {
  const { hash } = hashPassword(password, storedSalt);
  // Timing-safe comparison
  const a = Buffer.from(hash, 'hex');
  const b = Buffer.from(storedHash, 'hex');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// ─── Setup State ───
function isFirstRun() {
  const d = getDb();
  const row = d.prepare('SELECT value FROM setup_state WHERE key = ?').get('setup_complete');
  return !row || row.value !== 'true';
}

function markSetupComplete() {
  const d = getDb();
  d.prepare('INSERT OR REPLACE INTO setup_state (key, value) VALUES (?, ?)').run('setup_complete', 'true');
}

// ─── User CRUD ───
function createUser(username, password, role = 'viewer') {
  if (!USERNAME_PATTERN.test(username)) {
    throw new Error('Username must be 3-50 characters: letters, numbers, _, ., -');
  }
  const d = getDb();
  const id = crypto.randomUUID();
  const { hash, salt } = hashPassword(password);
  d.prepare(
    'INSERT INTO users (id, username, password_hash, salt, role) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, hash, salt, role);
  return { id, username, role };
}

function authenticateUser(username, password) {
  const d = getDb();
  const user = d.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1').get(username);
  if (!user) return null;
  if (!verifyPassword(password, user.password_hash, user.salt)) return null;
  d.prepare('UPDATE users SET last_login = datetime(\'now\') WHERE id = ?').run(user.id);
  return { id: user.id, username: user.username, role: user.role };
}

function getAllUsers() {
  const d = getDb();
  return d.prepare('SELECT id, username, role, created_at, last_login, is_active FROM users ORDER BY created_at').all();
}

function getUserById(id) {
  const d = getDb();
  return d.prepare('SELECT id, username, role, created_at, last_login, is_active FROM users WHERE id = ?').get(id);
}

function updateUser(id, updates) {
  const d = getDb();
  const fields = [];
  const values = [];
  if (updates.username) { fields.push('username = ?'); values.push(updates.username); }
  if (updates.role) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.is_active !== undefined) { fields.push('is_active = ?'); values.push(updates.is_active ? 1 : 0); }
  if (updates.password) {
    const { hash, salt } = hashPassword(updates.password);
    fields.push('password_hash = ?', 'salt = ?');
    values.push(hash, salt);
  }
  if (fields.length === 0) return;
  fields.push("updated_at = datetime('now')");
  values.push(id);
  d.prepare(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`).run(...values);
}

function deleteUser(id) {
  const d = getDb();
  d.prepare('DELETE FROM users WHERE id = ?').run(id);
}

// ─── Sessions ───
function createSession(userId, durationHours = SESSION_DURATION_HOURS) {
  const d = getDb();
  const id = crypto.randomUUID();
  const expires = new Date(Date.now() + durationHours * 3600 * 1000).toISOString();
  d.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(id, userId, expires);
  return { id, expires };
}

function validateSession(sessionId) {
  const d = getDb();
  const row = d.prepare(`
    SELECT s.id as session_id, s.expires_at, u.id as user_id, u.username, u.role, u.is_active
    FROM sessions s JOIN users u ON s.user_id = u.id
    WHERE s.id = ? AND u.is_active = 1
  `).get(sessionId);
  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    d.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return null;
  }
  return { id: row.user_id, username: row.username, role: row.role };
}

function deleteSession(sessionId) {
  const d = getDb();
  d.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
}

function deleteUserSessions(userId) {
  const d = getDb();
  d.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
}

function cleanExpiredSessions() {
  const d = getDb();
  d.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

// ─── Connection Permissions ───
function setConnectionPermission(userId, connectionId, permission) {
  const d = getDb();
  d.prepare(`
    INSERT INTO connection_permissions (id, user_id, connection_id, permission)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, connection_id) DO UPDATE SET permission = ?
  `).run(crypto.randomUUID(), userId, connectionId, permission, permission);
}

function getUserPermissions(userId) {
  const d = getDb();
  return d.prepare('SELECT connection_id, permission FROM connection_permissions WHERE user_id = ?').all(userId);
}

function closeDb() {
  if (db) {
    db.close();
    db = null;
  }
}

// ─── App Settings ───
function getSetting(key) {
  const d = getDb();
  const row = d.prepare('SELECT value FROM app_settings WHERE key = ?').get(key);
  if (!row) return undefined;
  try { return JSON.parse(row.value); } catch (_) { return row.value; }
}

function setSetting(key, value) {
  const d = getDb();
  d.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
}

function getAllSettings() {
  const d = getDb();
  const rows = d.prepare('SELECT key, value FROM app_settings').all();
  const result = {};
  for (const row of rows) {
    try { result[row.key] = JSON.parse(row.value); } catch (_) { result[row.key] = row.value; }
  }
  return result;
}

module.exports = {
  getDb,
  isFirstRun,
  markSetupComplete,
  createUser,
  authenticateUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  createSession,
  validateSession,
  deleteSession,
  deleteUserSessions,
  cleanExpiredSessions,
  setConnectionPermission,
  getUserPermissions,
  getSetting,
  setSetting,
  getAllSettings,
  closeDb,
};
