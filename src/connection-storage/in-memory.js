'use strict';

class InMemoryStorage {
  #connections;

  constructor() {
    this.#connections = new Map();
  }

  list() {
    return [...this.#connections.values()];
  }

  get(id) {
    return this.#connections.get(id) || null;
  }

  save(connectionInfo) {
    this.#connections.set(connectionInfo.id, connectionInfo);
  }

  delete(id) {
    this.#connections.delete(id);
  }
}

module.exports = { InMemoryStorage };
