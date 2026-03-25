'use strict';

const crypto = require('crypto');
const { MongoClient } = require('mongodb');
const { ConnectionString } = require('mongodb-connection-string-url');
const { createClientSafeConnectionString } = require('./utils/srv-resolver');

function buildConnectionMetadata(uri, args) {
  return {
    orgId: args.orgId,
    projectId: args.projectId,
    clusterUniqueId: args.clusterId,
    clusterName: uri.searchParams?.get('name') ?? (uri.hosts?.[0] || uri.hostname || 'unknown'),
    clusterType: 'REPLICASET',
    clusterState: 'IDLE',
    metricsId: 'metricsid',
    metricsType: 'replicaSet',
    supports: { globalWrites: false, rollingIndexes: false },
  };
}

class ConnectionManager {
  #storage;
  #clients;
  #editable;
  #presetConnectionIds;

  constructor(storage, args) {
    this.#storage = storage;
    this.#clients = new Map();
    this.#editable = args.enableEditConnections;
    this.#presetConnectionIds = new Set();

    for (const uri of args.mongoURIs) {
      const id = crypto.randomBytes(8).toString('hex');
      const connectionInfo = {
        id,
        connectionOptions: { connectionString: uri.href },
        atlasMetadata: buildConnectionMetadata(uri, args),
      };
      this.#presetConnectionIds.add(id);

      this.#storage.save(connectionInfo);
      this.#clients.set(id, new MongoClient(uri.href));
    }
  }

  async getAllConnections(resolveSrv = true) {
    const rawConnections = await this.#storage.list();

    if (!resolveSrv) return rawConnections;

    const resolved = [];
    for (const conn of rawConnections) {
      try {
        const clientCs = await createClientSafeConnectionString(
          new ConnectionString(conn.connectionOptions.connectionString)
        );
        resolved.push({
          ...conn,
          connectionOptions: { ...conn.connectionOptions, connectionString: clientCs },
        });
      } catch (_) {
        resolved.push(conn);
      }
    }
    return resolved;
  }

  async getMongoClientById(id) {
    let client = this.#clients.get(id);
    if (client) return client;

    const allConns = await this.#storage.list();
    const conn = allConns.find(c => c.id === id);
    if (!conn) return null;

    client = new MongoClient(conn.connectionOptions.connectionString);
    this.#clients.set(id, client);
    return client;
  }

  async saveConnectionInfo(connectionInfo) {
    if (!this.#editable) throw new Error('Editing connections is disabled');

    const oldClient = this.#clients.get(connectionInfo.id);
    if (oldClient) await oldClient.close().catch(() => {});

    await this.#storage.save(connectionInfo);
    this.#clients.set(
      connectionInfo.id,
      new MongoClient(connectionInfo.connectionOptions.connectionString)
    );
  }

  async deleteConnectionInfo(id) {
    if (!this.#editable) throw new Error('Editing connections is disabled');
    if (this.#presetConnectionIds.has(id)) throw new Error('Cannot delete preset connection');

    const client = this.#clients.get(id);
    if (client) await client.close().catch(() => {});
    this.#clients.delete(id);

    await this.#storage.delete(id);
  }

  async close() {
    const closePromises = [];
    for (const client of this.#clients.values()) {
      closePromises.push(client.close().catch(() => {}));
    }
    await Promise.all(closePromises);
  }
}

module.exports = { ConnectionManager, buildConnectionMetadata };
