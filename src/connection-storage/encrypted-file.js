'use strict';

const path = require('path');
const { Low } = require('lowdb');
const { JSONFileWithEncryption } = require('../encryption');

const DB_FILENAME = 'connections.json';

class EncryptedFileStorage {
  #db;
  #masterPassword;

  constructor(masterPassword) {
    this.#masterPassword = masterPassword;
    this.#db = null;
  }

  async #getDb() {
    if (!this.#db) {
      const storePath = path.resolve(__dirname, '..', '..', DB_FILENAME);
      this.#db = new Low(
        new JSONFileWithEncryption(storePath, this.#masterPassword),
        { connections: [] }
      );
      await this.#db.read();
    }
    return this.#db;
  }

  async list() {
    const db = await this.#getDb();
    return db.data.connections;
  }

  async get(id) {
    const db = await this.#getDb();
    return db.data.connections.find(c => c.id === id) || null;
  }

  async save(connectionInfo) {
    const db = await this.#getDb();
    await db.update(({ connections }) => {
      const idx = connections.findIndex(c => c.id === connectionInfo.id);
      if (idx === -1) {
        connections.push(connectionInfo);
      } else {
        connections[idx] = connectionInfo;
      }
    });
  }

  async delete(id) {
    const db = await this.#getDb();
    db.data.connections = db.data.connections.filter(c => c.id !== id);
    await db.write();
  }
}

module.exports = { EncryptedFileStorage };
