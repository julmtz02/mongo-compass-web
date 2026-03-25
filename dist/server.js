#!/usr/bin/env node
'use strict';

var require$$3 = require('path');
var require$$1$9 = require('eta');
var require$$2$3 = require('node-cache');
var require$$0$2 = require('crypto');
var require$$1$1 = require('mongodb');
var require$$2 = require('mongodb-connection-string-url');
var require$$0$1 = require('mongodb/lib/connection_string');
var require$$0$4 = require('yargs');
var require$$1$3 = require('yargs/helpers');
var require$$0$3 = require('openai');
var require$$1$2 = require('zod');
var require$$2$1 = require('openai/helpers/zod');
var require$$1$4 = require('better-sqlite3');
var require$$4 = require('fs');
var require$$8$1 = require('fastify');
var require$$9 = require('@fastify/view');
var require$$10 = require('@fastify/static');
var require$$11 = require('@fastify/websocket');
var require$$12 = require('@fastify/cookie');
var require$$13 = require('@fastify/formbody');
var require$$14 = require('@fastify/helmet');
var require$$15 = require('@fastify/rate-limit');
var require$$16 = require('@fastify/csrf-protection');
var require$$17 = require('@fastify/multipart');
var require$$0$5 = require('net');
var require$$1$5 = require('tls');
var require$$0$7 = require('stream');
var require$$0$6 = require('mongodb/lib/utils');
var require$$1$6 = require('stream/promises');
var require$$5 = require('stream-json/Parser');
var require$$6 = require('stream-json/streamers/StreamValues');
var require$$8 = require('os');
var require$$0$8 = require('lodash');
var require$$1$7 = require('assert');
var require$$2$2 = require('mongodb-schema');
var require$$3$1 = require('stream-json/streamers/StreamArray');
var require$$1$8 = require('util');
var require$$6$1 = require('strip-bom-stream');
var require$$0$9 = require('papaparse');
var require$$3$2 = require('stream-json');

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, '__esModule')) return n;
  var f = n.default;
	if (typeof f == "function") {
		var a = function a () {
			var isInstance = false;
      try {
        isInstance = this instanceof a;
      } catch {}
			if (isInstance) {
        return Reflect.construct(f, arguments, this.constructor);
			}
			return f.apply(this, arguments);
		};
		a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, '__esModule', {value: true});
	Object.keys(n).forEach(function (k) {
		var d = Object.getOwnPropertyDescriptor(n, k);
		Object.defineProperty(a, k, d.get ? d : {
			enumerable: true,
			get: function () {
				return n[k];
			}
		});
	});
	return a;
}

var server$1 = {};

var constants;
var hasRequiredConstants;

function requireConstants () {
	if (hasRequiredConstants) return constants;
	hasRequiredConstants = 1;

	// ─── Authentication ───
	const SESSION_DURATION_HOURS = 72;
	const COOKIE_NAME = 'cw_session';
	const MAX_LOGIN_ATTEMPTS = 5;
	const LOCKOUT_MINUTES = 15;
	const USERNAME_PATTERN = /^[a-zA-Z0-9_.-]{3,50}$/;

	// ─── Password Hashing (db.js) ───
	const AUTH_PBKDF2_ITERATIONS = 100000;
	const AUTH_PBKDF2_KEY_LENGTH = 64;
	const AUTH_PBKDF2_DIGEST = 'sha512';

	// ─── Connection Encryption (encryption.js) ───
	const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
	const ENCRYPTION_KEY_LENGTH = 32;
	const ENCRYPTION_IV_LENGTH = 16;
	const ENCRYPTION_SALT_LENGTH = 64;
	const ENCRYPTION_PBKDF2_ITERATIONS = 100000;
	const ENCRYPTION_PBKDF2_DIGEST = 'sha256';

	// ─── Server ───
	const EXPORT_CACHE_TTL = 3600;
	const SHUTDOWN_TIMEOUT_MS = 10000;

	// ─── WebSocket / Sockets ───
	const SOCKET_KEEPALIVE_MS = 300000;
	const SOCKET_TIMEOUT_MS = 30000;
	const SOCKET_ERROR_EVENTS = ['error', 'close', 'timeout', 'parseError'];

	constants = {
	  SESSION_DURATION_HOURS,
	  COOKIE_NAME,
	  MAX_LOGIN_ATTEMPTS,
	  LOCKOUT_MINUTES,
	  USERNAME_PATTERN,
	  AUTH_PBKDF2_ITERATIONS,
	  AUTH_PBKDF2_KEY_LENGTH,
	  AUTH_PBKDF2_DIGEST,
	  ENCRYPTION_ALGORITHM,
	  ENCRYPTION_KEY_LENGTH,
	  ENCRYPTION_IV_LENGTH,
	  ENCRYPTION_SALT_LENGTH,
	  ENCRYPTION_PBKDF2_ITERATIONS,
	  ENCRYPTION_PBKDF2_DIGEST,
	  EXPORT_CACHE_TTL,
	  SHUTDOWN_TIMEOUT_MS,
	  SOCKET_KEEPALIVE_MS,
	  SOCKET_TIMEOUT_MS,
	  SOCKET_ERROR_EVENTS,
	};
	return constants;
}

var srvResolver;
var hasRequiredSrvResolver;

function requireSrvResolver () {
	if (hasRequiredSrvResolver) return srvResolver;
	hasRequiredSrvResolver = 1;

	const { resolveSRVRecord, parseOptions } = require$$0$1;
	const { ConnectionString } = require$$2;

	async function createClientSafeConnectionString(cs) {
	  try {
	    if (!cs.isSRV) return cs.href;

	    const res = await resolveSRVRecord(parseOptions(cs.href));
	    const csCopy = cs.clone();
	    csCopy.protocol = 'mongodb';
	    csCopy.hosts = res.map((address) => address.toString());
	    return csCopy.toString();
	  } catch (err) {
	    console.error(
	      `Failed to create client safe connection string: ${cs.redact().href}`,
	      err
	    );
	    return cs.href;
	  }
	}

	srvResolver = { createClientSafeConnectionString };
	return srvResolver;
}

var connectionManager;
var hasRequiredConnectionManager;

function requireConnectionManager () {
	if (hasRequiredConnectionManager) return connectionManager;
	hasRequiredConnectionManager = 1;

	const crypto = require$$0$2;
	const { MongoClient } = require$$1$1;
	const { ConnectionString } = require$$2;
	const { createClientSafeConnectionString } = requireSrvResolver();

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

	connectionManager = { ConnectionManager, buildConnectionMetadata };
	return connectionManager;
}

var inMemory;
var hasRequiredInMemory;

function requireInMemory () {
	if (hasRequiredInMemory) return inMemory;
	hasRequiredInMemory = 1;

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

	inMemory = { InMemoryStorage };
	return inMemory;
}

var version = "0.4.0-beta.1";
var require$$1 = {
	version: version};

var genAi = {exports: {}};

var hasRequiredGenAi;

function requireGenAi () {
	if (hasRequiredGenAi) return genAi.exports;
	hasRequiredGenAi = 1;
	(function (module) {

		const { OpenAI } = require$$0$3;
		const { z } = require$$1$2;
		const { zodResponseFormat } = require$$2$1;

		const QUERY_SYSTEM_PROMPT = `
You are an expert in MongoDB query language (MQL). You will be given user's request, collection name and schema from sampled documents.
You need to generate a syntactically correct query based on the them. The query will be used to execute the code \`db.collection.find(filter, options)\`.

Follow these rules when generating the query:
- Respond with error if user's request is not related to querying the MongoDB, or the request is about modifying the database (e.g., insert, update, delete).
- Respond with error if user's request is unclear, ambiguous, or cannot be answered using the provided schema.
- The error message should be displayed to the user as is, so make sure it is clear and concise without any format.
- Only set optional parameters (limit, project, skip, sort) if necessary.
`.trim();

		const AGGREGATION_SYSTEM_PROMPT = `
You are an expert in MongoDB query language (MQL). You will be given user's request, collection name and schema from sampled documents.
You need to generate a syntactically correct aggregation pipeline based on the them. The query will be used to execute the code \`db.collection.aggregate(pipeline)\`.

Follow these rules when generating the pipeline:
- Respond with error if user's request is not related to querying the MongoDB, or the request is about modifying the database (e.g., insert, update, delete).
- Respond with error if user's request is unclear, ambiguous, or cannot be answered using the provided schema.
- The error message should be displayed to the user as is, so make sure it is clear and concise without any format.
`.trim();

		const MongoQuery = z.object({
		  filter: z.string({
		    description: 'Valid MongoDB query filter, e.g. { age: { $gt: 25 } }.',
		  }),
		  limit: z
		    .number({
		      description: 'Limit of documents returned.',
		    })
		    .nullable(),
		  project: z
		    .string({
		      description: 'Projection fields, e.g. { name: 1, age: 1 }.',
		    })
		    .nullable(),
		  skip: z
		    .number({
		      description: 'Number of documents to skip.',
		    })
		    .nullable(),
		  sort: z
		    .string({
		      description: 'Sort order, e.g. { age: -1 }.',
		    })
		    .nullable(),
		  error: z
		    .string({
		      description: 'Error message if the query cannot be generated.',
		    })
		    .nullable(),
		});

		const MongoAggregation = z.object({
		  pipeline: z.string({
		    description:
		      'Valid MongoDB aggregation pipeline consisting of stages, e.g. [{ $match: { age: { $gt: 25 } } }].',
		  }),

		  error: z
		    .string({
		      description:
		        'Error message if the aggregation pipeline cannot be generated.',
		    })
		    .nullable(),
		});

		async function generateQuery(
		  apiKey,
		  { userInput, collectionName, databaseName, schema, sampleDocuments },
		  { openaiModel, querySystemPrompt, enableGenAiSampleDocuments }
		) {
		  if (!userInput) {
		    throw new Error('User input is required to generate a query.');
		  }

		  if (!collectionName) {
		    throw new Error('Collection name is required to generate a query.');
		  }

		  if (!schema) {
		    throw new Error('Schema is required to generate a query.');
		  }

		  const openai = new OpenAI({ apiKey });

		  let samples = '';

		  if (enableGenAiSampleDocuments && Array.isArray(sampleDocuments)) {
		    samples = `- Sample documents:
${sampleDocuments.map((doc) => JSON.stringify(doc, null, 2)).join('\n')}
`;
		  }

		  const userPrompt = `
- Collection name:
${collectionName}
- Schema:
${JSON.stringify(schema, null, 2)}
${samples}- Request:
${userInput.trim()}
`;
		  const response = await openai.chat.completions.parse({
		    model: openaiModel,
		    messages: [
		      { role: 'system', content: querySystemPrompt },
		      {
		        role: 'user',
		        content: userPrompt.trim(),
		      },
		    ],
		    response_format: zodResponseFormat(MongoQuery, 'query'),
		  });

		  const message = response.choices[0].message;

		  if (message.refusal) {
		    throw new Error(message.refusal);
		  }

		  // Post-process the response
		  const content = message.parsed;

		  if (content.error?.trim()) {
		    throw new Error(content.error?.trim());
		  }

		  if (content.limit === 0) {
		    content.limit = null;
		  }

		  if (content.skip === 0) {
		    content.skip = null;
		  }

		  if (!content.project || content.project.trim() === '{}') {
		    content.project = null;
		  }

		  if (!content.sort || content.sort.trim() === '{}') {
		    content.sort = null;
		  }

		  return content;
		}

		async function generateAggregation(
		  apiKey,
		  { userInput, collectionName, databaseName, schema, sampleDocuments },
		  { openaiModel, aggregationSystemPrompt, enableGenAiSampleDocuments }
		) {
		  if (!userInput) {
		    throw new Error(
		      'User input is required to generate an aggregation pipeline.'
		    );
		  }

		  if (!collectionName) {
		    throw new Error(
		      'Collection name is required to generate an aggregation pipeline'
		    );
		  }

		  if (!schema) {
		    throw new Error('Schema is required to generate an aggregation pipeline.');
		  }

		  const openai = new OpenAI({ apiKey });

		  let samples = '';

		  if (enableGenAiSampleDocuments && Array.isArray(sampleDocuments)) {
		    samples = `- Sample documents:
${sampleDocuments.map((doc) => JSON.stringify(doc, null, 2)).join('\n')}
`;
		  }

		  const userPrompt = `
- Collection name:
${collectionName}
- Schema:
${JSON.stringify(schema, null, 2)}
${samples}- Request:
${userInput.trim()}
`;

		  const response = await openai.chat.completions.parse({
		    model: openaiModel,
		    messages: [
		      { role: 'system', content: aggregationSystemPrompt },
		      {
		        role: 'user',
		        content: userPrompt.trim(),
		      },
		    ],
		    response_format: zodResponseFormat(MongoAggregation, 'aggregation'),
		  });

		  const message = response.choices[0].message;

		  if (message.refusal) {
		    throw new Error(message.refusal);
		  }

		  // Post-process the response
		  const content = message.parsed;

		  if (content.error?.trim()) {
		    throw new Error(content.error?.trim());
		  }

		  return content;
		}

		if (require.main === module) {
		  process.loadEnvFile();

		  Promise.allSettled([
		    generateQuery(
		      process.env.OPENAI_API_KEY,
		      {
		        schema: {
		          _id: { types: [{ bsonType: 'ObjectId' }] },
		          score: { types: [{ bsonType: 'Int32' }] },
		        },
		        userInput: 'Delete all documents where score is greater than 50.',
		        databaseName: 'testDB',
		        collectionName: 'testCollection',
		      },
		      {
		        openaiModel: 'gpt-5-mini',
		        querySystemPrompt: QUERY_SYSTEM_PROMPT,
		      }
		    ),
		    generateAggregation(
		      process.env.OPENAI_API_KEY,
		      {
		        schema: {
		          _id: { types: [{ bsonType: 'ObjectId' }] },
		          score: { types: [{ bsonType: 'Int32' }] },
		        },
		        userInput: 'Find all documents where score is greater than 50.',
		        databaseName: 'testDB',
		        collectionName: 'testCollection',
		      },
		      {
		        openaiModel: 'gpt-5-mini',
		        aggregationSystemPrompt: AGGREGATION_SYSTEM_PROMPT,
		      }
		    ),
		  ]).then(([queryResult, pipelineResult]) => {
		    if (queryResult.status === 'rejected') {
		      console.error('Query Generation Error:', queryResult.reason);
		    } else {
		      console.log('Generated Query Result:', queryResult.value);
		    }

		    if (pipelineResult.status === 'rejected') {
		      console.error('Pipeline Generation Error:', pipelineResult.reason);
		    } else {
		      console.log('Generated Pipeline Result:', pipelineResult.value);
		    }
		  });
		}

		module.exports = {
		  generateQuery,
		  generateAggregation,
		  QUERY_SYSTEM_PROMPT,
		  AGGREGATION_SYSTEM_PROMPT,
		}; 
	} (genAi));
	return genAi.exports;
}

var cli;
var hasRequiredCli;

function requireCli () {
	if (hasRequiredCli) return cli;
	hasRequiredCli = 1;

	const yargs = require$$0$4;
	const { hideBin } = require$$1$3;
	const { ConnectionString } = require$$2;
	const pkgJson = require$$1;
	const { AGGREGATION_SYSTEM_PROMPT, QUERY_SYSTEM_PROMPT } = requireGenAi();

	function readCliArgs() {
	  const args = yargs(hideBin(process.argv))
	    .env('CW')
	    .options('mongo-uri', {
	      type: 'string',
	      description:
	        'MongoDB connection string, e.g. mongodb://localhost:27017. Multiple connections can be specified by separating them with whitespaces.',
	    })
	    .version(pkgJson.version)
	    .options('port', {
	      type: 'number',
	      description: 'Port to run the server on',
	      default: 8080,
	    })
	    .options('host', {
	      type: 'string',
	      description: 'Host to run the server on',
	      default: '0.0.0.0',
	    })
	    .options('org-id', {
	      type: 'string',
	      description: 'Organization ID for the connection',
	      default: 'default-org-id',
	    })
	    .options('project-id', {
	      type: 'string',
	      description: 'Project ID for the connection',
	      default: 'default-project-id',
	    })
	    .options('cluster-id', {
	      type: 'string',
	      description: 'Cluster ID for the connection',
	      default: 'default-cluster-id',
	    })
	    .option('app-name', {
	      type: 'string',
	      description: 'Name of the application',
	      default: 'Compass Web',
	    })
	    .option('openai-api-key', {
	      type: 'string',
	      description: 'OpenAI API key for GenAI services',
	    })
	    .option('query-system-prompt', {
	      type: 'string',
	      description:
	        'System prompt for query generation. If not set, a default prompt will be used.',
	      default: QUERY_SYSTEM_PROMPT,
	    })
	    .option('aggregation-system-prompt', {
	      type: 'string',
	      description:
	        'System prompt for aggregation generation. If not set, a default prompt will be used.',
	      default: AGGREGATION_SYSTEM_PROMPT,
	    })
	    .option('openai-model', {
	      type: 'string',
	      description: 'OpenAI model used in GenAI service.',
	      default: 'gpt-5-mini',
	    })
	    .option('enable-gen-ai-features', {
	      type: 'boolean',
	      description: 'Enable GenAI features',
	      default: false,
	    })
	    .option('enable-gen-ai-sample-documents', {
	      type: 'boolean',
	      description: 'Enable upload sample documents to GenAI service.',
	      default: false,
	    })
	    .options('enable-edit-connections', {
	      type: 'boolean',
	      description: 'Allow user to add/edit/remove connections from the UI',
	      default: true,
	    })
	    .options('master-password', {
	      type: 'string',
	      description: 'Master password for encryption. WARNING: CLI args visible in process list; prefer CW_MASTER_PASSWORD env var',
	    })
	    .parse();

	  if (args.enableEditConnections && !args.masterPassword) {
	    const crypto = require$$0$2;
	    args.masterPassword = crypto.randomBytes(32).toString('hex');
	    console.warn('No master password set. Generated a random one for this session.');
	    console.warn('To persist encrypted connections across restarts, set CW_MASTER_PASSWORD env var.');
	  }

	  /**
	   * @type {ConnectionString[]}
	   */
	  const mongoURIs = [];

	  if (args.mongoUri) {
	    let mongoURIStrings = args.mongoUri.trim().split(/\s+/);

	    // Validate MongoDB connection strings
	    let errMessage = '';
	    mongoURIStrings.forEach((uri, index) => {
	      try {
	        const mongoUri = new ConnectionString(uri);

	        mongoUri.searchParams.set('appName', args.appName);

	        mongoURIs.push(mongoUri);
	      } catch (err) {
	        errMessage += `Connection string no.${index + 1} is invalid: ${
	          err.message
	        }\n`;
	      }
	    });

	    if (errMessage) {
	      throw new Error(errMessage);
	    }
	  }

	  if (mongoURIs.length === 0 && !args.enableEditConnections) {
	    console.warn('No MongoDB URIs specified and connection editing is disabled. Users won\'t be able to connect to any database.');
	  }

	  return { ...args, mongoURIs };
	}

	cli = { readCliArgs };
	return cli;
}

var db_1;
var hasRequiredDb;

function requireDb () {
	if (hasRequiredDb) return db_1;
	hasRequiredDb = 1;

	const { AUTH_PBKDF2_ITERATIONS, AUTH_PBKDF2_KEY_LENGTH, AUTH_PBKDF2_DIGEST, USERNAME_PATTERN, SESSION_DURATION_HOURS } = requireConstants();

	const Database = require$$1$4;
	const crypto = require$$0$2;
	const path = require$$3;

	const DB_PATH = process.env.CW_DB_PATH || path.resolve(__dirname, '..', 'data', 'compass-web.db');

	let db;

	function getDb() {
	  if (!db) {
	    const fs = require$$4;
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

	db_1 = {
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
	  closeDb,
	};
	return db_1;
}

var auth$1;
var hasRequiredAuth$1;

function requireAuth$1 () {
	if (hasRequiredAuth$1) return auth$1;
	hasRequiredAuth$1 = 1;

	const { COOKIE_NAME } = requireConstants();
	const { isFirstRun, validateSession, cleanExpiredSessions } = requireDb();

	const COOKIE_OPTIONS = {
	  httpOnly: true,
	  sameSite: 'lax',
	  path: '/',
	  secure: process.env.NODE_ENV === 'production',
	};

	const PUBLIC_PATHS = [
	  '/login',
	  '/api/auth/login',
	  '/api/auth/setup',
	  '/api/auth/status',
	  '/setup',
	  '/version',
	  '/favicon.svg',
	];

	function isApiOrWsRequest(urlPath) {
	  return urlPath.startsWith('/api/') ||
	    urlPath.startsWith('/ws') ||
	    urlPath.startsWith('/clusterConnection') ||
	    urlPath.startsWith('/explorer/') ||
	    urlPath.startsWith('/settings') ||
	    urlPath.startsWith('/cloud-mongodb-com/') ||
	    urlPath.startsWith('/projectId') ||
	    urlPath.startsWith('/export') ||
	    urlPath.startsWith('/import') ||
	    urlPath.startsWith('/gather-fields') ||
	    urlPath.startsWith('/guess-filetype') ||
	    urlPath.startsWith('/upload-') ||
	    urlPath.startsWith('/list-csv') ||
	    urlPath.startsWith('/analyze-csv') ||
	    urlPath.startsWith('/ai/');
	}

	function registerAuth(instance) {
	  const cleanupInterval = setInterval(() => {
	    try { cleanExpiredSessions(); } catch (_) {}
	  }, 3600 * 1000);

	  instance.addHook('onClose', () => clearInterval(cleanupInterval));

	  instance.addHook('onRequest', async (request, reply) => {
	    const urlPath = request.url.split('?')[0];

	    if (PUBLIC_PATHS.some(p => urlPath === p || urlPath.startsWith(p + '/'))) return;
	    if (urlPath.match(/\.(js|css|svg|png|ico|woff2?)$/)) return;

	    if (isFirstRun()) {
	      if (isApiOrWsRequest(urlPath)) {
	        return reply.code(401).send({ error: 'Setup required', setupRequired: true });
	      }
	      return reply.redirect('/setup');
	    }

	    const sessionId = request.cookies?.[COOKIE_NAME];
	    if (!sessionId) {
	      if (isApiOrWsRequest(urlPath)) {
	        return reply.code(401).send({ error: 'Authentication required' });
	      }
	      return reply.redirect('/login');
	    }

	    const user = validateSession(sessionId);
	    if (!user) {
	      reply.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
	      if (isApiOrWsRequest(urlPath)) {
	        return reply.code(401).send({ error: 'Session expired' });
	      }
	      return reply.redirect('/login');
	    }

	    request.user = user;
	  });
	}

	auth$1 = { registerAuth, COOKIE_OPTIONS };
	return auth$1;
}

var requireRole_1;
var hasRequiredRequireRole;

function requireRequireRole () {
	if (hasRequiredRequireRole) return requireRole_1;
	hasRequiredRequireRole = 1;

	function requireRole(...roles) {
	  return async (request, reply) => {
	    if (!request.user) {
	      return reply.code(401).send({ error: 'Authentication required' });
	    }
	    if (!roles.includes(request.user.role)) {
	      return reply.code(403).send({ error: 'Insufficient permissions' });
	    }
	  };
	}

	requireRole_1 = { requireRole };
	return requireRole_1;
}

var errorHandler;
var hasRequiredErrorHandler;

function requireErrorHandler () {
	if (hasRequiredErrorHandler) return errorHandler;
	hasRequiredErrorHandler = 1;

	function sendError(reply, status, message) {
	  return reply.status(status).send({ error: message });
	}

	function wrapHandler(handler, errorStatus = 502) {
	  return async (request, reply) => {
	    try {
	      return await handler(request, reply);
	    } catch (err) {
	      request.log.error(err);
	      return sendError(reply, errorStatus, err.message ?? 'Unknown error');
	    }
	  };
	}

	errorHandler = { sendError, wrapHandler };
	return errorHandler;
}

var auth;
var hasRequiredAuth;

function requireAuth () {
	if (hasRequiredAuth) return auth;
	hasRequiredAuth = 1;

	const { COOKIE_NAME, MAX_LOGIN_ATTEMPTS, LOCKOUT_MINUTES } = requireConstants();
	const { COOKIE_OPTIONS } = requireAuth$1();
	const { requireRole } = requireRequireRole();
	const { sendError } = requireErrorHandler();
	const {
	  isFirstRun,
	  authenticateUser,
	  createUser,
	  createSession,
	  deleteSession,
	  deleteUserSessions,
	  markSetupComplete,
	  getAllUsers,
	  updateUser,
	  deleteUser,
	  getUserPermissions,
	  setConnectionPermission,
	} = requireDb();

	auth = function authRoutes(fastify, opts, done) {

	  const loginAttempts = new Map();

	  // Clean up expired lockouts every 15 minutes
	  const lockoutCleanupInterval = setInterval(() => {
	    const now = Date.now();
	    for (const [key, val] of loginAttempts) {
	      if (val.lockedUntil && val.lockedUntil <= now) {
	        loginAttempts.delete(key);
	      }
	    }
	  }, 15 * 60 * 1000);
	  fastify.addHook('onClose', () => clearInterval(lockoutCleanupInterval));

	  fastify.get('/api/auth/status', async () => {
	    return { setupRequired: isFirstRun() };
	  });

	  fastify.post('/api/auth/setup', async (request, reply) => {
	    if (!isFirstRun()) {
	      return sendError(reply, 400, 'Setup already completed');
	    }
	    const { username, password } = request.body || {};
	    if (!username || !password) {
	      return sendError(reply, 400, 'Username and password required');
	    }
	    if (password.length < 8) {
	      return sendError(reply, 400, 'Password must be at least 8 characters');
	    }
	    if (username.length < 3) {
	      return sendError(reply, 400, 'Username must be at least 3 characters');
	    }
	    try {
	      const user = createUser(username, password, 'admin');
	      markSetupComplete();
	      const session = createSession(user.id);
	      reply.setCookie(COOKIE_NAME, session.id, {
	        ...COOKIE_OPTIONS,
	        expires: new Date(session.expires),
	      });
	      return { ok: true, user: { username: user.username, role: user.role } };
	    } catch (err) {
	      return sendError(reply, 400, err.message);
	    }
	  });

	  fastify.post('/api/auth/login', async (request, reply) => {
	    const { username, password } = request.body || {};
	    if (!username || !password) {
	      return sendError(reply, 400, 'Username and password required');
	    }

	    const key = username?.toLowerCase();
	    const attempts = loginAttempts.get(key);
	    if (attempts && attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
	      return sendError(reply, 429, 'Account temporarily locked. Try again later.');
	    }

	    const user = authenticateUser(username, password);
	    if (!user) {
	      await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
	      const current = loginAttempts.get(key) || { count: 0 };
	      current.count++;
	      if (current.count >= MAX_LOGIN_ATTEMPTS) {
	        current.lockedUntil = Date.now() + LOCKOUT_MINUTES * 60 * 1000;
	      }
	      loginAttempts.set(key, current);
	      return sendError(reply, 401, 'Invalid credentials');
	    }

	    loginAttempts.delete(key);
	    // Session rotation: delete previous sessions
	    deleteUserSessions(user.id);
	    const session = createSession(user.id);
	    reply.setCookie(COOKIE_NAME, session.id, {
	      ...COOKIE_OPTIONS,
	      expires: new Date(session.expires),
	    });
	    return { ok: true, user: { username: user.username, role: user.role } };
	  });

	  fastify.post('/api/auth/logout', {
	    preHandler: [fastify.csrfProtection],
	  }, async (request, reply) => {
	    const sessionId = request.cookies?.[COOKIE_NAME];
	    if (sessionId) {
	      deleteSession(sessionId);
	      reply.clearCookie(COOKIE_NAME, COOKIE_OPTIONS);
	    }
	    return { ok: true };
	  });

	  fastify.get('/api/auth/me', async (request, reply) => {
	    if (!request.user) {
	      return reply.code(401).send({ error: 'Not authenticated' });
	    }
	    const permissions = getUserPermissions(request.user.id);
	    return { user: request.user, permissions };
	  });

	  // ── Admin routes ──
	  fastify.get('/api/admin/users', {
	    preHandler: requireRole('admin'),
	  }, async () => {
	    return { users: getAllUsers() };
	  });

	  fastify.post('/api/admin/users', {
	    preHandler: [fastify.csrfProtection, requireRole('admin')],
	  }, async (request, reply) => {
	    const { username, password, role } = request.body || {};
	    if (!username || !password) {
	      return sendError(reply, 400, 'Username and password required');
	    }
	    if (password.length < 8) {
	      return sendError(reply, 400, 'Password must be at least 8 characters');
	    }
	    try {
	      const user = createUser(username, password, role || 'viewer');
	      return { ok: true, user };
	    } catch (err) {
	      return sendError(reply, 400, err.message);
	    }
	  });

	  fastify.put('/api/admin/users/:userId', {
	    preHandler: [fastify.csrfProtection, requireRole('admin')],
	  }, async (request, reply) => {
	    const { userId } = request.params;
	    const body = request.body || {};
	    const updates = {};
	    if (typeof body.username === 'string' && body.username.length >= 3) updates.username = body.username;
	    if (['admin', 'editor', 'viewer'].includes(body.role)) updates.role = body.role;
	    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
	    if (typeof body.password === 'string' && body.password.length >= 8) updates.password = body.password;
	    try {
	      updateUser(userId, updates);
	      if (updates.is_active === false || updates.password) {
	        deleteUserSessions(userId);
	      }
	      return { ok: true };
	    } catch (err) {
	      return sendError(reply, 400, err.message);
	    }
	  });

	  fastify.delete('/api/admin/users/:userId', {
	    preHandler: [fastify.csrfProtection, requireRole('admin')],
	  }, async (request, reply) => {
	    if (request.params.userId === request.user.id) {
	      return sendError(reply, 400, 'Cannot delete yourself');
	    }
	    deleteUserSessions(request.params.userId);
	    deleteUser(request.params.userId);
	    return { ok: true };
	  });

	  fastify.post('/api/admin/permissions', {
	    preHandler: [fastify.csrfProtection, requireRole('admin')],
	  }, async (request, reply) => {
	    const { userId, connectionId, permission } = request.body || {};
	    if (!userId || !connectionId || !permission) {
	      return sendError(reply, 400, 'userId, connectionId, and permission required');
	    }
	    try {
	      setConnectionPermission(userId, connectionId, permission);
	      return { ok: true };
	    } catch (err) {
	      return sendError(reply, 400, err.message);
	    }
	  });

	  fastify.get('/api/admin/permissions/:userId', {
	    preHandler: requireRole('admin'),
	  }, async (request) => {
	    return { permissions: getUserPermissions(request.params.userId) };
	  });

	  done();
	};
	return auth;
}

var ssrfGuard;
var hasRequiredSsrfGuard;

function requireSsrfGuard () {
	if (hasRequiredSsrfGuard) return ssrfGuard;
	hasRequiredSsrfGuard = 1;

	const { ConnectionString } = require$$2;

	// Block private/internal IPs to prevent SSRF to internal services
	const BLOCKED_PATTERNS = [
	  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
	  /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[0-2]\d)\./,
	  /^localhost$/i, /^metadata\.google\.internal$/i,
	];

	function isBlockedHost(host) {
	  return BLOCKED_PATTERNS.some(p => p.test(host));
	}

	function extractHostname(hostString) {
	  return hostString.split(':')[0];
	}

	async function buildAllowedHosts(mongoURIs, connectionManager) {
	  const hosts = new Set();

	  // Add preset hosts from CLI/env
	  for (const { uri } of mongoURIs) {
	    try {
	      for (const host of (uri.hosts || [])) {
	        hosts.add(extractHostname(host));
	      }
	    } catch (_) {}
	  }

	  // Add hosts from user-saved connections
	  if (connectionManager) {
	    try {
	      const connections = await connectionManager.getAllConnections(false);
	      for (const conn of connections) {
	        try {
	          const cs = new ConnectionString(conn.connectionOptions.connectionString);
	          for (const host of (cs.hosts || [])) {
	            const hostname = extractHostname(host);
	            if (!isBlockedHost(hostname)) {
	              hosts.add(hostname);
	            }
	          }
	        } catch (_) {}
	      }
	    } catch (_) {}
	  }

	  return hosts;
	}

	function validateHost(host, allowedHosts) {
	  if (isBlockedHost(host)) return false;
	  return allowedHosts.has(host);
	}

	ssrfGuard = { buildAllowedHosts, validateHost };
	return ssrfGuard;
}

var createMongoSocket_1;
var hasRequiredCreateMongoSocket;

function requireCreateMongoSocket () {
	if (hasRequiredCreateMongoSocket) return createMongoSocket_1;
	hasRequiredCreateMongoSocket = 1;

	const net = require$$0$5;
	const tls = require$$1$5;
	const { SOCKET_KEEPALIVE_MS, SOCKET_TIMEOUT_MS } = requireConstants();

	function isTrue(v) {
	  return v === true || v === 'true' || v === 1 || v === '1';
	}


	function shouldDisableTLSVerification(connectOptions, mongoURIs) {
	  const fromServerConfig = mongoURIs.some(({ uri }) => {
	    try {
	      const hostMatches = (uri.hosts || []).some(
	        (h) => h.split(':')[0] === connectOptions.host
	      );
	      if (!hostMatches) return false;
	      const params = uri.searchParams;
	      return (
	        params.get('tlsInsecure') === 'true' ||
	        params.get('tlsAllowInvalidCertificates') === 'true'
	      );
	    } catch (_) {
	      return false;
	    }
	  });

	  const globalInsecure = mongoURIs.some(({ uri }) => {
	    try {
	      const params = uri.searchParams;
	      return (
	        params.get('tlsInsecure') === 'true' ||
	        params.get('tlsAllowInvalidCertificates') === 'true'
	      );
	    } catch (_) {
	      return false;
	    }
	  });

	  return fromServerConfig || globalInsecure;
	}

	function createMongoSocket(connectOptions, useSecureConnection, mongoURIs) {
	  let socket;

	  if (useSecureConnection) {
	    const tlsOptions = {
	      servername: connectOptions.host,
	      minVersion: 'TLSv1.2',
	      ...connectOptions,
	    };

	    const wantInsecure = shouldDisableTLSVerification(connectOptions, mongoURIs);

	    if (wantInsecure) {
	      tlsOptions.rejectUnauthorized = false;
	    }

	    if (wantInsecure || isTrue(connectOptions.tlsAllowInvalidHostnames)) {
	      tlsOptions.checkServerIdentity = () => undefined;
	    }

	    if (!tlsOptions.servername) {
	      tlsOptions.servername = connectOptions.host;
	    }

	    socket = tls.connect(tlsOptions);
	  } else {
	    socket = net.createConnection(connectOptions);
	  }

	  socket.setKeepAlive(true, SOCKET_KEEPALIVE_MS);
	  socket.setTimeout(SOCKET_TIMEOUT_MS);
	  socket.setNoDelay(true);

	  return socket;
	}

	createMongoSocket_1 = { createMongoSocket };
	return createMongoSocket_1;
}

var ws;
var hasRequiredWs;

function requireWs () {
	if (hasRequiredWs) return ws;
	hasRequiredWs = 1;

	const { COOKIE_NAME, SOCKET_ERROR_EVENTS } = requireConstants();
	const { validateSession } = requireDb();
	const { buildAllowedHosts, validateHost } = requireSsrfGuard();
	const { createMongoSocket } = requireCreateMongoSocket();

	// ─── WebSocket message encoding ───

	function encodeMessage(data, type) {
	  const encoded = new Uint8Array(data.length + 1);
	  encoded[0] = type;
	  encoded.set(data, 1);
	  return encoded;
	}

	function encodeString(message) {
	  return encodeMessage(new TextEncoder().encode(message), 0x01);
	}

	function encodeBinary(message) {
	  return encodeMessage(message, 0x02);
	}

	function decodeMessage(message) {
	  const type = message[0];
	  const payload = message.subarray(1);
	  if (type === 0x01) {
	    return JSON.parse(new TextDecoder('utf-8').decode(payload));
	  }
	  return payload;
	}

	// ─── WebSocket connection handler ───

	async function handleConnection(fastify, socket, req) {
	  const mongoURIs = fastify.args.mongoURIs;

	  req.log.info('New WebSocket connection (total %d)', fastify.websocketServer.clients.size);

	  let mongoSocket;

	  socket.on('message', async (message) => {
	    if (mongoSocket) {
	      mongoSocket.write(decodeMessage(message), 'binary');
	      return;
	    }

	    // First message contains connection options
	    const { tls: useSecureConnection, ...connectOptions } = decodeMessage(message);

	    // SSRF protection
	    const allowedHosts = await buildAllowedHosts(mongoURIs, fastify.connectionManager);
	    if (!validateHost(connectOptions.host, allowedHosts)) {
	      req.log.error('SSRF blocked: %s', connectOptions.host);
	      socket.close(1008, 'Host not allowed');
	      return;
	    }

	    req.log.info('Connecting to %s:%s (tls=%s)', connectOptions.host, connectOptions.port, !!useSecureConnection);

	    mongoSocket = createMongoSocket(connectOptions, useSecureConnection, mongoURIs);

	    const connectEvent = useSecureConnection ? 'secureConnect' : 'connect';

	    SOCKET_ERROR_EVENTS.forEach((evt) => {
	      mongoSocket.on(evt, (err) => {
	        req.log.error('Socket event (%s): %s', evt, err);
	        socket.close(evt === 'close' ? 1001 : 1011);
	      });
	    });

	    mongoSocket.on(connectEvent, () => {
	      req.log.info('Connected to %s:%s', connectOptions.host, connectOptions.port);
	      mongoSocket.setTimeout(0);
	      socket.send(encodeString(JSON.stringify({ preMessageOk: 1 })));
	    });

	    mongoSocket.on('data', (data) => {
	      socket.send(encodeBinary(data));
	    });
	  });

	  socket.on('close', () => {
	    mongoSocket?.removeAllListeners();
	    mongoSocket?.end();
	  });
	}

	// ─── Authentication helper for WebSocket upgrade ───

	function authenticateWs(req, socket) {
	  const sessionId = req.cookies?.[COOKIE_NAME];
	  const user = sessionId ? validateSession(sessionId) : null;
	  if (!user) {
	    socket.close(1008, 'Authentication required');
	    return false;
	  }
	  req.user = user;
	  return true;
	}

	// ─── Plugin registration ───

	ws = function wsPlugin(fastify, opts, done) {
	  const args = fastify.args;

	  fastify.get('/clusterConnection/:projectId', { websocket: true }, (socket, req) => {
	    if (!authenticateWs(req, socket)) return;
	    if (req.params.projectId !== args.projectId) {
	      socket.close(1008, 'Invalid project');
	      return;
	    }
	    handleConnection(fastify, socket, req);
	  });

	  fastify.get('/ws-proxy', { websocket: true }, (socket, req) => {
	    if (!authenticateWs(req, socket)) return;
	    handleConnection(fastify, socket, req);
	  });

	  done();
	};
	return ws;
}

var settings;
var hasRequiredSettings;

function requireSettings () {
	if (hasRequiredSettings) return settings;
	hasRequiredSettings = 1;

	const { requireRole } = requireRequireRole();
	const pkgJson = require$$1;

	settings = function settingsRoutes(fastify, opts, done) {
	  const args = fastify.args;

	  const settings = {
	    enableGenAIFeatures: args.enableGenAiFeatures,
	    enableGenAISampleDocumentPassing: args.enableGenAiSampleDocuments,
	  };

	  if (args.enableEditConnections) {
	    settings.enableCreatingNewConnections = true;
	  }

	  fastify.get('/version', (request, reply) => {
	    reply.send({
	      version: pkgJson.version,
	      source: `https://github.com/julmtz02/mongo-compass-web/tree/v${pkgJson.version}`,
	    });
	  });

	  fastify.get('/projectId', (request, reply) => {
	    reply.type('text/plain').send(args.projectId);
	  });

	  fastify.get('/cloud-mongodb-com/v2/:projectId/params', (request, reply) => {
	    if (request.params.projectId !== args.projectId) {
	      return reply.status(404).send({ message: 'Project not found' });
	    }

	    reply.send({
	      orgId: args.orgId,
	      projectId: args.projectId,
	      appName: args.appName,
	      preferences: {
	        ...settings,
	        enableGenAIFeaturesAtlasOrg: settings.enableGenAIFeatures,
	        enableGenAIFeaturesAtlasProject: settings.enableGenAIFeatures,
	        enableGenAISampleDocumentPassing: settings.enableGenAISampleDocumentPassing,
	        enableGenAISampleDocumentPassingOnAtlasProject: settings.enableGenAISampleDocumentPassing,
	        optInDataExplorerGenAIFeatures: settings.optInDataExplorerGenAIFeatures ?? false,
	        cloudFeatureRolloutAccess: {
	          GEN_AI_COMPASS: settings.enableGenAIFeatures,
	        },
	      },
	    });
	  });

	  fastify.get('/settings', (request, reply) => {
	    reply.send(settings);
	  });

	  fastify.post(
	    '/settings/optInDataExplorerGenAIFeatures',
	    { preHandler: requireRole('admin') },
	    (request, reply) => {
	      const { value } = request.body || {};
	      if (typeof value !== 'boolean') {
	        return reply.status(400).send({ error: 'value must be a boolean' });
	      }
	      settings.optInDataExplorerGenAIFeatures = value;
	      reply.send({ ok: true });
	    }
	  );

	  done();
	};
	return settings;
}

var connections;
var hasRequiredConnections;

function requireConnections () {
	if (hasRequiredConnections) return connections;
	hasRequiredConnections = 1;

	const { requireRole } = requireRequireRole();
	const { sendError } = requireErrorHandler();

	connections = function connectionRoutes(fastify, opts, done) {
	  const connectionManager = fastify.connectionManager;

	  fastify.get(
	    '/explorer/v1/groups/:projectId/clusters/connectionInfo',
	    async (request, reply) => {
	      const connections = await connectionManager.getAllConnections();
	      reply.send(connections);
	    }
	  );

	  fastify.post(
	    '/explorer/v1/groups/:projectId/clusters/connectionInfo',
	    { preHandler: requireRole('admin', 'editor') },
	    async (request, reply) => {
	      const connectionInfo = request.body;
	      if (!connectionInfo) {
	        return sendError(reply, 400, 'connectionInfo is required');
	      }
	      try {
	        await connectionManager.saveConnectionInfo(connectionInfo);
	        reply.send({ ok: true });
	      } catch (err) {
	        return sendError(reply, 400, err.message);
	      }
	    }
	  );

	  fastify.delete(
	    '/explorer/v1/groups/:projectId/clusters/connectionInfo/:connectionId',
	    { preHandler: requireRole('admin') },
	    async (request, reply) => {
	      const { connectionId } = request.params;
	      if (!connectionId) {
	        return sendError(reply, 400, 'connectionId is required');
	      }
	      try {
	        await connectionManager.deleteConnectionInfo(connectionId);
	        reply.send({ ok: true });
	      } catch (err) {
	        return sendError(reply, 400, err.message);
	      }
	    }
	  );

	  done();
	};
	return connections;
}

var dataService;
var hasRequiredDataService;

function requireDataService () {
	if (hasRequiredDataService) return dataService;
	hasRequiredDataService = 1;

	const { MongoDBCollectionNamespace } = require$$0$6;

	class DataService {
	  /** @type {import('mongodb').MongoClient} */
	  mongoClient;

	  constructor(mongoClient) {
	    this.mongoClient = mongoClient;
	  }

	  /**
	   * Performs multiple write operations with controls for order of execution.
	   * @param {string} ns Namespace
	   * @param {import('mongodb').AnyBulkWriteOperation} operations An array of `bulkWrite()` write operations.
	   * @param {import('mongodb').BulkWriteOptions} options `bulkWrite()` options
	   */
	  bulkWrite(ns, operations, options) {
	    const namespace = MongoDBCollectionNamespace.fromString(ns);

	    return this.mongoClient
	      .db(namespace.db)
	      .collection(namespace.collection)
	      .bulkWrite(operations, options);
	  }

	  /**
	   * Insert a single document into the database.
	   *
	   * @param {string} ns - The namespace.
	   * @param {import('mongodb').Document} doc - The document to insert.
	   * @param {import('mongodb').InsertOneOptions} options - The options.
	   */
	  insertOne(ns, doc, options) {
	    const namespace = MongoDBCollectionNamespace.fromString(ns);
	    return this.mongoClient
	      .db(namespace.db)
	      .collection(namespace.collection)
	      .insertOne(doc, options);
	  }

	  /**
	   * Returns an aggregation cursor on the collection.
	   *
	   * @param {string} ns - The namespace to search on.
	   * @param {Array<import('mongodb').Document>} pipeline - The aggregation pipeline.
	   * @param {import('mongodb').AggregateOptions & import('mongodb').Abortable} options - The aggregation options.
	   */
	  aggregateCursor(ns, pipeline, options) {
	    const namespace = MongoDBCollectionNamespace.fromString(ns);
	    return this.mongoClient
	      .db(namespace.db)
	      .collection(namespace.collection)
	      .aggregate(pipeline, options);
	  }

	  /**
	   * Returns a find cursor on the collection.
	   *
	   * @param {string} ns - The namespace to search on.
	   * @param {import('mongodb').Filter} filter - The query filter.
	   * @param {import('mongodb').FindOptions} options - The query options.
	   */
	  findCursor(ns, filter, options) {
	    const namespace = MongoDBCollectionNamespace.fromString(ns);
	    return this.mongoClient
	      .db(namespace.db)
	      .collection(namespace.collection)
	      .find(filter, options);
	  }
	}

	dataService = DataService;
	return dataService;
}

var sanitize;
var hasRequiredSanitize;

function requireSanitize () {
	if (hasRequiredSanitize) return sanitize;
	hasRequiredSanitize = 1;

	function sanitizeFilename(name) {
	  return String(name).replace(/[^a-zA-Z0-9._-]/g, '_');
	}

	sanitize = { sanitizeFilename };
	return sanitize;
}

var validateConnection;
var hasRequiredValidateConnection;

function requireValidateConnection () {
	if (hasRequiredValidateConnection) return validateConnection;
	hasRequiredValidateConnection = 1;

	const { sendError } = requireErrorHandler();

	async function resolveMongoClient(connectionManager, connectionId, reply) {
	  if (!connectionId) {
	    sendError(reply, 400, 'connectionId is required');
	    return null;
	  }
	  const client = await connectionManager.getMongoClientById(connectionId);
	  if (!client) {
	    sendError(reply, 400, 'Connection not found');
	    return null;
	  }
	  return client;
	}

	validateConnection = { resolveMongoClient };
	return validateConnection;
}

var exportJson = {};

const {
  EJSON,
  Double,
  Int32,
  Long,
  Binary,
  BSONRegExp,
  ObjectId,
  Timestamp,
  Decimal128,
  UUID,
  MinKey,
  MaxKey,
  serialize,
  deserialize,
} = require$$1$1.BSON;

var bson = /*#__PURE__*/Object.freeze({
	__proto__: null,
	BSONRegExp: BSONRegExp,
	Binary: Binary,
	Decimal128: Decimal128,
	Double: Double,
	EJSON: EJSON,
	Int32: Int32,
	Long: Long,
	MaxKey: MaxKey,
	MinKey: MinKey,
	ObjectId: ObjectId,
	Timestamp: Timestamp,
	UUID: UUID,
	default: require$$1$1.BSON,
	deserialize: deserialize,
	serialize: serialize
});

var require$$0 = /*@__PURE__*/getAugmentedNamespace(bson);

var mongodbNs;
var hasRequiredMongodbNs;

function requireMongodbNs () {
	if (hasRequiredMongodbNs) return mongodbNs;
	hasRequiredMongodbNs = 1;
	const { MongoDBCollectionNamespace } = require$$0$6;

	mongodbNs = function (ns) {
	  return MongoDBCollectionNamespace.fromString(ns);
	};
	return mongodbNs;
}

var hadronDocument;
var hasRequiredHadronDocument;

function requireHadronDocument () {
	if (hasRequiredHadronDocument) return hadronDocument;
	hasRequiredHadronDocument = 1;
	const { EJSON } = require$$0;

	const maxFourYearDate = new Date('9999-12-31T23:59:59.999Z').valueOf();

	/**
	 * Turn a BSON value into what we consider idiomatic extended JSON.
	 *
	 * This differs from both the relaxed and strict mode of the 'bson'
	 * package's EJSON class: We preserve the type information for longs
	 * via $numberLong, but redact it for $numberInt and $numberDouble.
	 *
	 * This may seem inconsistent, but considering that the latter two
	 * types are exactly representable in JS and $numberLong is not,
	 * in addition to the fact that this has been historic behavior
	 * in Compass for a long time, this seems like a reasonable choice.
	 *
	 * Also turns $date.$numberLong into a date so that it will be
	 * displayed as an iso date string since this is what Compass did
	 * historically. Unless it is outside of the safe range.
	 *
	 * @param {*} value Any BSON value.
	 * @returns {import('../../compass/packages/hadron-document/src/utils').HadronEJSONOptions} A serialized, human-readable and human-editable string.
	 */
	function objectToIdiomaticEJSON(value, options = {}) {
	  const serialized = EJSON.serialize(value, {
	    relaxed: false,
	  });

	  makeEJSONIdiomatic(serialized);

	  return JSON.stringify(
	    serialized,
	    null,
	    'indent' in options ? options.indent : 2
	  );
	}

	function makeEJSONIdiomatic(value) {
	  if (!value || typeof value !== 'object') return;

	  for (const key of Object.keys(value)) {
	    const entry = value[key];
	    // We are only interested in object-like values, skip everything else
	    if (typeof entry !== 'object' || entry === null) {
	      continue;
	    }
	    if (entry.$numberInt) {
	      value[key] = +entry.$numberInt;
	      continue;
	    }
	    if (entry.$numberDouble) {
	      if (
	        Number.isFinite(+entry.$numberDouble) &&
	        !Object.is(+entry.$numberDouble, -0)
	      ) {
	        // EJSON can represent +/-Infinity or NaN values but JSON can't
	        // (and -0 can be parsed from JSON but not serialized by JSON.stringify).
	        value[key] = +entry.$numberDouble;
	      }
	      continue;
	    }
	    if (entry.$date && entry.$date.$numberLong) {
	      const number = entry.$date.$numberLong;
	      if (number >= 0 && number <= maxFourYearDate) {
	        entry.$date = new Date(+number).toISOString();
	      }
	    }
	    makeEJSONIdiomatic(entry);
	  }
	}

	function isInternalFieldPath(path) {
	  return typeof path === 'string' && /^__safeContent__($|\.)/.test(path);
	}

	hadronDocument = { objectToIdiomaticEJSON, isInternalFieldPath };
	return hadronDocument;
}

var logger = {};

var debug_1;
var hasRequiredDebug;

function requireDebug () {
	if (hasRequiredDebug) return debug_1;
	hasRequiredDebug = 1;
	function debug(prefix) {
	  return (...args) => {};
	}

	debug_1 = debug;
	return debug_1;
}

var hasRequiredLogger;

function requireLogger () {
	if (hasRequiredLogger) return logger;
	hasRequiredLogger = 1;
	var __importDefault = (logger && logger.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(logger, "__esModule", { value: true });
	logger.createDebug = void 0;
	const debug_1 = __importDefault(requireDebug());
	const PREFIX = 'mongodb-compass-import-export';
	const _LOGGERS = {};
	const createDebug = function (name) {
	    if (!_LOGGERS[name]) {
	        _LOGGERS[name] = (0, debug_1.default)(`${PREFIX}:${name}`);
	    }
	    return _LOGGERS[name];
	};
	logger.createDebug = createDebug;
	
	return logger;
}

var exportCursor = {};

var compassPreferencesModelProvider;
var hasRequiredCompassPreferencesModelProvider;

function requireCompassPreferencesModelProvider () {
	if (hasRequiredCompassPreferencesModelProvider) return compassPreferencesModelProvider;
	hasRequiredCompassPreferencesModelProvider = 1;
	function capMaxTimeMSAtPreferenceLimit(preferences, value) {
	  const preferenceMaxTimeMS = preferences.getPreferences().maxTimeMS;
	  if (typeof value === 'number' && typeof preferenceMaxTimeMS === 'number') {
	    return Math.min(value, preferenceMaxTimeMS);
	  } else if (typeof preferenceMaxTimeMS === 'number') {
	    return preferenceMaxTimeMS;
	  }
	  return value;
	}

	compassPreferencesModelProvider = { capMaxTimeMSAtPreferenceLimit };
	return compassPreferencesModelProvider;
}

var hasRequiredExportCursor;

function requireExportCursor () {
	if (hasRequiredExportCursor) return exportCursor;
	hasRequiredExportCursor = 1;
	Object.defineProperty(exportCursor, "__esModule", { value: true });
	exportCursor.createAggregationCursor = createAggregationCursor;
	exportCursor.createFindCursor = createFindCursor;
	const provider_1 = requireCompassPreferencesModelProvider();
	function createAggregationCursor({ ns, aggregation, dataService, preferences, }) {
	    const { stages, options: aggregationOptions = {} } = aggregation;
	    aggregationOptions.maxTimeMS = (0, provider_1.capMaxTimeMSAtPreferenceLimit)(preferences, aggregationOptions.maxTimeMS);
	    aggregationOptions.promoteValues = false;
	    aggregationOptions.bsonRegExp = true;
	    return dataService.aggregateCursor(ns, stages, aggregationOptions);
	}
	function createFindCursor({ ns, query, dataService, }) {
	    return dataService.findCursor(ns, query.filter ?? {}, {
	        projection: query.projection,
	        sort: query.sort,
	        limit: query.limit,
	        skip: query.skip,
	        collation: query.collation,
	        promoteValues: false,
	        bsonRegExp: true,
	    });
	}
	
	return exportCursor;
}

var hasRequiredExportJson;

function requireExportJson () {
	if (hasRequiredExportJson) return exportJson;
	hasRequiredExportJson = 1;
	var __importDefault = (exportJson && exportJson.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exportJson, "__esModule", { value: true });
	exportJson.exportJSON = exportJSON;
	exportJson.exportJSONFromAggregation = exportJSONFromAggregation;
	exportJson.exportJSONFromQuery = exportJSONFromQuery;
	const stream_1 = require$$0$7;
	const promises_1 = require$$1$6;
	const bson_1 = require$$0;
	const mongodb_ns_1 = __importDefault(requireMongodbNs());
	const hadron_document_1 = requireHadronDocument();
	const logger_1 = requireLogger();
	const export_cursor_1 = requireExportCursor();
	const debug = (0, logger_1.createDebug)('export-json');
	function getEJSONOptionsForVariant(variant) {
	    if (variant === 'relaxed') {
	        return {
	            relaxed: true,
	        };
	    }
	    return variant === 'canonical'
	        ? {
	            relaxed: false, // canonical
	        }
	        : undefined; // default
	}
	async function exportJSON({ output, abortSignal, input, progressCallback, variant, }) {
	    let docsWritten = 0;
	    const ejsonOptions = getEJSONOptionsForVariant(variant);
	    if (abortSignal?.aborted) {
	        return {
	            docsWritten,
	            aborted: true,
	        };
	    }
	    output.write('[');
	    const docStream = new stream_1.Transform({
	        objectMode: true,
	        transform: function (chunk, encoding, callback) {
	            // NOTE: This count is used as the final documents written count,
	            // however it does not, at this point, represent the count of documents
	            // written to the file as this is an earlier point in the pipeline.
	            ++docsWritten;
	            progressCallback?.(docsWritten);
	            try {
	                const doc = variant === 'default'
	                    ? (0, hadron_document_1.objectToIdiomaticEJSON)(chunk, { indent: 2 })
	                    : bson_1.EJSON.stringify(chunk, undefined, 2, ejsonOptions);
	                const line = `${docsWritten > 1 ? ',\n' : ''}${doc}`;
	                callback(null, line);
	            }
	            catch (err) {
	                callback(err);
	            }
	        },
	        final: function (callback) {
	            this.push(']');
	            callback(null);
	        },
	    });
	    try {
	        const inputStream = input.stream();
	        await (0, promises_1.pipeline)([inputStream, docStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
	    }
	    catch (err) {
	        if (err.code === 'ABORT_ERR') {
	            return {
	                docsWritten,
	                aborted: true,
	            };
	        }
	        throw err;
	    }
	    finally {
	        // Finish the array output
	        output.write(']\n');
	        void input.close();
	    }
	    return {
	        docsWritten,
	        aborted: !!abortSignal?.aborted,
	    };
	}
	async function exportJSONFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }) {
	    debug('exportJSONFromAggregation()', { ns: (0, mongodb_ns_1.default)(ns), aggregation });
	    const aggregationCursor = (0, export_cursor_1.createAggregationCursor)({
	        ns,
	        aggregation,
	        dataService,
	        preferences,
	    });
	    return await exportJSON({
	        ...exportOptions,
	        input: aggregationCursor,
	    });
	}
	async function exportJSONFromQuery({ ns, query = { filter: {} }, dataService, ...exportOptions }) {
	    debug('exportJSONFromQuery()', { ns: (0, mongodb_ns_1.default)(ns), query });
	    const findCursor = (0, export_cursor_1.createFindCursor)({
	        ns,
	        query,
	        dataService,
	    });
	    return await exportJSON({
	        ...exportOptions,
	        input: findCursor,
	    });
	}
	
	return exportJson;
}

var exportCsv = {};

var exportUtils = {};

var csvUtils = {};

var hasRequiredCsvUtils;

function requireCsvUtils () {
	if (hasRequiredCsvUtils) return csvUtils;
	hasRequiredCsvUtils = 1;
	var __importDefault = (csvUtils && csvUtils.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(csvUtils, "__esModule", { value: true });
	csvUtils.formatCSVValue = formatCSVValue;
	csvUtils.formatCSVLine = formatCSVLine;
	csvUtils.stringifyCSVValue = stringifyCSVValue;
	csvUtils.csvHeaderNameToFieldName = csvHeaderNameToFieldName;
	csvUtils.detectCSVFieldType = detectCSVFieldType;
	csvUtils.placeValue = placeValue;
	csvUtils.overrideDetectedFieldType = overrideDetectedFieldType;
	csvUtils.makeDocFromCSV = makeDocFromCSV;
	csvUtils.parseCSVValue = parseCSVValue;
	csvUtils.parseCSVHeaderName = parseCSVHeaderName;
	csvUtils.formatCSVHeaderName = formatCSVHeaderName;
	csvUtils.isCompatibleCSVFieldType = isCompatibleCSVFieldType;
	csvUtils.findBrokenCSVTypeExample = findBrokenCSVTypeExample;
	const lodash_1 = __importDefault(require$$0$8);
	const assert_1 = __importDefault(require$$1$7);
	const bson_1 = require$$0;
	function formatCSVValue(value, { delimiter, escapeLinebreaks = false, }) {
	    value = value.replace(/"/g, '""');
	    if (escapeLinebreaks) {
	        // This should only really be necessary for values that started out as
	        // arbitrary strings. Usually our conversion to a string takes care of this.
	        // ie. numbers are never going to have line breaks in them and
	        // EJSON.stringify() takes care of it.
	        // (Yes CSV has no standard way of escaping line breaks or anything other
	        //  than double quotes.)
	        value = value.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
	    }
	    if (value.indexOf(delimiter) !== -1 || value.indexOf('"') !== -1) {
	        // Put quotes around a value if it contains the delimiter or an escaped
	        // quote. This will also affect EJSON objects and arrays
	        value = `"${value}"`;
	    }
	    return value;
	}
	function formatCSVLine(values, { delimiter, linebreak, }) {
	    return `${values.join(delimiter)}${linebreak}`;
	}
	function stringifyCSVValue(value, { delimiter, }) {
	    if ([null, undefined].includes(value)) {
	        return '';
	    }
	    const bsonType = value._bsontype;
	    if (!bsonType) {
	        // Even when parsing with relaxed: false string values remain strings
	        if (typeof value === 'string') {
	            return formatCSVValue(value, {
	                delimiter,
	                escapeLinebreaks: true,
	            });
	        }
	        if (Object.prototype.toString.call(value) === '[object Date]') {
	            try {
	                return value.toISOString();
	            }
	            catch {
	                return String(value);
	            }
	        }
	        // When parsing with relaxed: false we won't see numbers here, but it is
	        // good to keep it here so that this function works in both scenarios.
	        if (['number', 'boolean'].includes(typeof value)) {
	            return formatCSVValue(value.toString(), {
	                delimiter,
	            });
	        }
	        // Arrays and plain objects that somehow made it here plus unforeseen things
	        // that don't have a _bsontype.
	        return formatCSVValue(bson_1.EJSON.stringify(value, { relaxed: false }), {
	            delimiter,
	        });
	    }
	    if (['Long', 'Int32', 'Double'].includes(bsonType)) {
	        return value.toString();
	    }
	    if (value.toHexString) {
	        // ObjectId and UUID both have toHexString() which does exactly what we want
	        return value.toHexString();
	    }
	    if (bsonType === 'Binary') {
	        // This should base64 encode the value which can't contain the delimiter,
	        // line breaks or quotes
	        return value.toJSON();
	    }
	    if (bsonType === 'BSONRegExp') {
	        const bsonregex = value;
	        return formatCSVValue(`/${bsonregex.pattern}/${bsonregex.options}`, {
	            delimiter,
	        });
	    }
	    if (bsonType === 'Decimal128') {
	        // This should turn it into a number string with exponent
	        return value.toString();
	    }
	    if (bsonType === 'Timestamp') {
	        // This should turn it into a number string
	        return value.toString();
	    }
	    if (bsonType === 'MinKey') {
	        // Same as mongoexport
	        return '$MinKey';
	    }
	    if (bsonType === 'MaxKey') {
	        // Same as mongoexport
	        return '$MaxKey';
	    }
	    // BSONSymbol, Code, DBRef and whatever new types get added
	    return formatCSVValue(bson_1.EJSON.stringify(value, { relaxed: false }), {
	        delimiter,
	    });
	}
	function csvHeaderNameToFieldName(name) {
	    return name.replace(/\[\d+\]/g, '[]');
	}
	const MIN_INT = -2147483648;
	const MAX_INT = 2147483647;
	const MIN_LONG = BigInt('-9223372036854775808');
	const MAX_LONG = BigInt('9223372036854775807');
	// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1024
	const FLOAT_REGEX = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
	// from papaparse: https://github.com/mholt/PapaParse/blob/aa0046865f1b4e817ebba6966d6baf483e0652d7/papaparse.js#L1025
	const ISO_DATE_REGEX = /^((\d{4}-[01]\d-[0-3]\d[T ][0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
	const DATEONLY_REGEX = /^\d{4}-[01]\d-[0-3]\d$/;
	// a regular expression for detecting regular expressions
	const REGEX_REGEX = /^\/.*\/\w*$/;
	// from js-bson: https://github.com/mongodb/js-bson/blob/5b837a9e5019016529a83700f3ba3065d5e53e80/src/objectid.ts#L6
	// this also supports mongoexport's format
	const OBJECTID_REGEX = /^(ObjectId\()?([0-9a-fA-F]{24})\)?$/;
	// from js-bson: https://github.com/mongodb/js-bson/blob/5b837a9e5019016529a83700f3ba3065d5e53e80/src/uuid_utils.ts#L5
	const UUID_REGEX = /^(?:[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[0-9a-f]{12}4[0-9a-f]{3}[89ab][0-9a-f]{15})$/i;
	const TRUTHY_STRINGS = ['t', 'true', 'TRUE', 'True'];
	const FALSY_STRINGS = ['f', 'false', 'FALSE', 'False'];
	const NULL_STRINGS = ['Null', 'NULL', 'null'];
	const parenthesis = {
	    '{': '}',
	    '[': ']',
	};
	function isEJSON(value) {
	    if (value.length &&
	        ['{', '['].includes(value[0]) &&
	        value[value.length - 1] === parenthesis[value[0]]) {
	        try {
	            JSON.parse(value);
	        }
	        catch {
	            return false;
	        }
	        return true;
	    }
	    return false;
	}
	function detectCSVFieldType(value, name, ignoreEmptyStrings) {
	    // for some types we can go further and also look at the field name
	    if (name === '_id' && OBJECTID_REGEX.test(value)) {
	        return 'objectId';
	    }
	    if (value === '') {
	        return ignoreEmptyStrings ? 'undefined' : 'string';
	    }
	    if (isEJSON(value)) {
	        return 'ejson';
	    }
	    if (NULL_STRINGS.includes(value)) {
	        return 'null';
	    }
	    if (TRUTHY_STRINGS.includes(value)) {
	        return 'boolean';
	    }
	    if (FALSY_STRINGS.includes(value)) {
	        return 'boolean';
	    }
	    if (FLOAT_REGEX.test(value)) {
	        // first separate floating point numbers from integers
	        // 1.0 should be double
	        if (value.includes('.') || /[Ee][+-]?/.test(value)) {
	            return 'double';
	        }
	        let number;
	        try {
	            number = BigInt(value);
	        }
	        catch {
	            // just in case something makes it past the regex by accident
	            return 'string';
	        }
	        // then separate ints from longs
	        if (number >= MIN_LONG && number <= MAX_LONG) {
	            if (number >= MIN_INT && number <= MAX_INT) {
	                return 'int';
	            }
	            return 'long';
	        }
	        // really big integers will remain as strings
	        return 'string';
	    }
	    if (ISO_DATE_REGEX.test(value) || DATEONLY_REGEX.test(value)) {
	        return 'date';
	    }
	    if (UUID_REGEX.test(value)) {
	        return 'uuid';
	    }
	    if (REGEX_REGEX.test(value)) {
	        return 'regex';
	    }
	    if (value === '$MinKey') {
	        // support mongoexport's way of exporting minKey
	        return 'minKey';
	    }
	    if (value === '$MaxKey') {
	        // support mongoexport's way of exporting maxKey
	        return 'maxKey';
	    }
	    return 'string';
	}
	function placeValue(doc, path, value, overwrite) {
	    if (path.length === 0) {
	        return;
	    }
	    const lastPart = path[path.length - 1];
	    const ensure = (parentValue) => {
	        return path.length === 1
	            ? doc
	            : placeValue(doc, path.slice(0, path.length - 1), parentValue);
	    };
	    if (lastPart.type === 'field') {
	        const parent = ensure({});
	        // You could get here if a field is more than one of a) a simple value, b)
	        // an array, c) an object all in the same CSV row. That's not possible in
	        // the database and it therefore shouldn't be possible in files we generate
	        // on export, but it is possible to hand-craft a broken file like that.
	        // (Also checking _bsontype because `new Int32()` also results in an object,
	        // but that's not what we mean.)
	        (0, assert_1.default)(lodash_1.default.isObject(parent) &&
	            !parent._bsontype &&
	            !Array.isArray(parent), 'parent must be an object');
	        if (overwrite || parent[lastPart.name] === undefined) {
	            parent[lastPart.name] = value;
	        }
	        return parent[lastPart.name];
	    }
	    else {
	        const parent = ensure([]);
	        // Same story as for the isObject() assertion above.
	        (0, assert_1.default)(Array.isArray(parent), 'parent must be an array');
	        if (overwrite || parent[lastPart.index] === undefined) {
	            parent[lastPart.index] = value;
	        }
	        return parent[lastPart.index];
	    }
	}
	function overrideDetectedFieldType(fieldType) {
	    // We can detect regex, but we don't want to automatically select it due to
	    // the fact that URL paths often look like regexes. It is still useful to
	    // detect it, though, because then when the user manually selects regexp we
	    // can still warn if all the values for that field don't look like regular
	    // expressions.
	    if (fieldType === 'regex') {
	        return 'string';
	    }
	    return fieldType;
	}
	function makeDocFromCSV(chunk, header, parsedHeader, included, { ignoreEmptyStrings }) {
	    const doc = {};
	    // in order of the header row
	    for (const [index, name] of header.entries()) {
	        const fieldName = csvHeaderNameToFieldName(name);
	        // ignore fields that were exluded by the user
	        if (included[fieldName] === undefined) {
	            continue;
	        }
	        let original = chunk[name];
	        // Blanks at the end become undefined and not empty strings, but we want to
	        // treat them the same.
	        if (original === undefined) {
	            original = '';
	        }
	        // Ignore the field for this doc if it is an empty string and the user chose
	        // to ignore empty strings. Otherwise it will become null.
	        if (original === '' && ignoreEmptyStrings) {
	            continue;
	        }
	        let type = included[fieldName];
	        if (type === 'mixed') {
	            type = overrideDetectedFieldType(detectCSVFieldType(original, fieldName, ignoreEmptyStrings));
	        }
	        if (type === 'number') {
	            type = overrideDetectedFieldType(detectCSVFieldType(original, fieldName, ignoreEmptyStrings));
	            if (!['int', 'long', 'double'].includes(type)) {
	                throw new Error(`"${original}" is not a number (found "${type}") [Col ${index}]`);
	            }
	        }
	        const path = parsedHeader[name];
	        try {
	            const value = parseCSVValue(original, type);
	            placeValue(doc, path, value, true);
	        }
	        catch (err) {
	            // rethrow with the column index appended to aid debugging
	            err.message = `${err.message} [Col ${index}]`;
	            throw err;
	        }
	    }
	    return doc;
	}
	function parseCSVValue(value, type) {
	    if (type === 'int') {
	        if (isNaN(+value)) {
	            throw new Error(`"${value}" is not a number`);
	        }
	        return new bson_1.Int32(value);
	    }
	    if (type === 'long') {
	        if (isNaN(+value)) {
	            throw new Error(`"${value}" is not a number`);
	        }
	        return new bson_1.Long(value);
	    }
	    if (type === 'double') {
	        if (isNaN(+value)) {
	            throw new Error(`"${value}" is not a number`);
	        }
	        return new bson_1.Double(parseFloat(value));
	    }
	    if (type === 'boolean') {
	        // only using '1' and '0' when explicitly parsing, not when detecting so
	        // that those are left as ints
	        if (TRUTHY_STRINGS.includes(value) || value === '1') {
	            return true;
	        }
	        if (FALSY_STRINGS.includes(value) || value === '0') {
	            return false;
	        }
	        return Boolean(value);
	    }
	    if (type === 'date') {
	        let date;
	        if (ISO_DATE_REGEX.test(value)) {
	            // iso string
	            date = new Date(value);
	        }
	        else if (!isNaN(+value)) {
	            // if it is a number, assume it is an int64 value
	            // NOTE: this won't be detected as date, so the user can only get here by
	            // explicitly selecting date
	            date = new Date(+value);
	        }
	        else {
	            // As a last resort, maybe it is in the date-only format like "YYYY-MM-DD"
	            // with no time part?
	            date = new Date(value);
	        }
	        if (date.toString() === 'Invalid Date') {
	            throw new Error(`"${value}" is not a date`);
	        }
	        return date;
	    }
	    if (type === 'null') {
	        // At the time of writing the only way to get here is if the user selects
	        // mixed and it detects the type as null. Null is not an option in the
	        // dropdown.
	        if (NULL_STRINGS.includes(value)) {
	            return null;
	        }
	        else {
	            throw new Error(`"${value}" is not null`);
	        }
	    }
	    if (type === 'uuid') {
	        // NOTE: this can throw
	        return new bson_1.UUID(value);
	    }
	    if (type === 'regex') {
	        const match = value.match(/^\/(.*)\/(.*)$/);
	        if (!match) {
	            throw new Error(`"${value}" is not a regular expression`);
	        }
	        return new bson_1.BSONRegExp(match[1], match[2]);
	    }
	    if (type === 'minKey') {
	        if (value === '$MinKey') {
	            return new bson_1.MinKey();
	        }
	        else {
	            throw new Error(`"${value}" is not $MinKey`);
	        }
	    }
	    if (type === 'maxKey') {
	        if (value === '$MaxKey') {
	            return new bson_1.MaxKey();
	        }
	        else {
	            throw new Error(`"${value}" is not $MaxKey`);
	        }
	    }
	    if (type === 'ejson') {
	        // This works for arrays or objects that got stringified by mongoexport and
	        // also for the fallback exportCSV() has for types like symbol, javascript,
	        // javascriptWithScope and dbref where we don't have a better way to turn
	        // values into strings. Furthermore it also helps for the cases where
	        // mongoexport uses EJSON stringify and we don't. ie. Timestamp.
	        return bson_1.EJSON.parse(value);
	    }
	    if (type === 'objectId') {
	        const match = value.match(OBJECTID_REGEX);
	        if (!match) {
	            throw new Error(`"${value}" is not an ObjectId`);
	        }
	        return new bson_1.ObjectId(match[2]);
	    }
	    // The rest (other than the string fallback at the bottom) can't be detected
	    // at the the time of writing, so the user will have to explicitly select it
	    // from the dropdown.
	    if (type === 'binData') {
	        return new bson_1.Binary(Buffer.from(value, 'base64'), bson_1.Binary.SUBTYPE_DEFAULT);
	    }
	    if (type === 'md5') {
	        return new bson_1.Binary(Buffer.from(value, 'base64'), bson_1.Binary.SUBTYPE_MD5);
	    }
	    if (type === 'timestamp') {
	        if (isNaN(+value)) {
	            throw new Error(`"${value}" is not a number`);
	        }
	        return bson_1.Timestamp.fromString(value, 10);
	    }
	    if (type === 'decimal') {
	        // NOTE: this can throw
	        return bson_1.Decimal128.fromString(value);
	    }
	    // By default leave it as a string
	    return value;
	}
	function parseCSVHeaderName(value) {
	    const parts = [];
	    let previousType = 'field';
	    let ignoreBlankField = false;
	    let type = 'field';
	    let snippet = [];
	    for (const char of value) {
	        if (type === 'field') {
	            if (char === '[') {
	                // this snippet length check is for:
	                // 1. nested arrays (because closing an array defaults to type field)
	                // 2. top-level array paths like [0].foo
	                if (snippet.length) {
	                    parts.push({ type: 'field', name: snippet.join('') });
	                }
	                else if (previousType === 'field') {
	                    // this supports the edge case where the field name is a blank string
	                    // at the top level that is the name of an array field.
	                    if (!ignoreBlankField) {
	                        parts.push({ type: 'field', name: '' });
	                    }
	                }
	                previousType = type;
	                type = 'index';
	                snippet = [];
	                ignoreBlankField = false;
	                continue;
	            }
	            if (char === '.') {
	                if (snippet.length) {
	                    // this snippet length check helps with arrays of objects like
	                    // array[2].foo. closing the array defaults to type field and then
	                    // immediately afterwards we encounter a .
	                    parts.push({ type: 'field', name: snippet.join('') });
	                }
	                else if (previousType === 'field') {
	                    // this supports the edge case where the field name is a blank string
	                    // inside an object or a blank string at the top level that is the
	                    // name of an object.field.
	                    if (!ignoreBlankField) {
	                        parts.push({ type: 'field', name: '' });
	                    }
	                }
	                snippet = [];
	                ignoreBlankField = false;
	                continue;
	            }
	        }
	        else {
	            if (char === ']') {
	                const index = +snippet.join('');
	                if (isNaN(index) || snippet.length === 0) {
	                    // what initially looked like an array actually wasn't, so either
	                    // append to the previous part field if there is one or add a new
	                    // one
	                    const namePart = `[${snippet.join('')}]`;
	                    if (parts.length && parts[parts.length - 1].type === 'field') {
	                        parts[parts.length - 1].name += namePart;
	                    }
	                    else {
	                        parts.push({ type: 'field', name: namePart });
	                    }
	                    previousType = 'field';
	                    // previousType is 'field' and snippet is blank but if the next
	                    // character is { or . then we don't want a blank field name to be
	                    // appended because the part we just added or appended is the field
	                    // name.
	                    ignoreBlankField = true;
	                    type = 'field';
	                    snippet = [];
	                    continue;
	                }
	                parts.push({ type: 'index', index });
	                previousType = type;
	                type = 'field';
	                snippet = [];
	                ignoreBlankField = false;
	                continue;
	            }
	        }
	        snippet.push(char);
	        ignoreBlankField = false;
	    }
	    if (snippet.length) {
	        if (type === 'field') {
	            // in the most common case the path ends with an object field
	            parts.push({ type: 'field', name: snippet.join('') });
	        }
	        if (type === 'index') {
	            // shouldn't be possible unless the path is broken in a way where it ends
	            // after [ but before ].
	            const index = +snippet.join('');
	            if (isNaN(index)) {
	                const namePart = `[${snippet.join('')}`;
	                if (parts.length && parts[parts.length - 1].type === 'field') {
	                    parts[parts.length - 1].name += namePart;
	                }
	                else {
	                    parts.push({ type: 'field', name: namePart });
	                }
	            }
	            else {
	                parts.push({ type: 'index', index });
	            }
	        }
	    }
	    else if (parts.length === 0 ||
	        (value.length > 0 && value[value.length - 1] === '.')) {
	        // this supports the edge case where the field name is a blank string (either
	        // the whole field is a blank string or the last object field was a blank
	        // string)
	        parts.push({ type: 'field', name: '' });
	    }
	    return parts;
	}
	function formatCSVHeaderName(path) {
	    return path
	        .map((part, index) => {
	        if (part.type === 'field') {
	            return `${index === 0 ? '' : '.'}${part.name}`;
	        }
	        else {
	            return `[${part.index}]`;
	        }
	    })
	        .join('');
	}
	const NUMBER_TYPES = ['int', 'long', 'double'];
	function isCompatibleCSVFieldType(selectedType, type) {
	    if (type === 'undefined') {
	        // Blanks that are mixed in are always OK because they will be ignored
	        // separately depending on the Ignore empty strings option. This does leave
	        // the edge case where the entire column is always blank which has to be
	        // handed separately.
	        return true;
	    }
	    if (selectedType === 'string') {
	        // we can leave anything as a string
	        return true;
	    }
	    if (selectedType === 'mixed') {
	        // anything can be processed as mixed
	        return true;
	    }
	    if (selectedType === 'number') {
	        // only number type can be a number
	        return NUMBER_TYPES.includes(type);
	    }
	    if (selectedType === 'double') {
	        // any number type can be a double
	        return NUMBER_TYPES.includes(type);
	    }
	    if (selectedType === 'decimal') {
	        // any number type can be made a decimal
	        return NUMBER_TYPES.includes(type);
	    }
	    if (selectedType === 'long') {
	        // only int32 and long can both be long
	        return ['int', 'long'].includes(type);
	    }
	    if (selectedType === 'date') {
	        // dates and longs can be dates
	        if (['date', 'long'].includes(type)) {
	            return true;
	        }
	        // Our date type detection isn't perfect and `new Date(someString)` can take
	        // a surprising amount of stuff and kick out a date, so just allow users to
	        // try their luck. The parsing code will check that it made some date, at
	        // least.
	        if (NUMBER_TYPES.includes(type) || type === 'string') {
	            return true;
	        }
	        return false;
	    }
	    if (selectedType === 'timestamp') {
	        // we can only parse longs as timestamps
	        return type === 'long';
	    }
	    // The constructors for all these things can take various things (more than we
	    // can detect), so just allow the user to try anything. It will produce parse
	    // errors if things won't work anyway.
	    if (['objectId', 'uuid', 'md5', 'binData'].includes(selectedType)) {
	        return true;
	    }
	    // By default the type has to match what it detected. This should cover:
	    // *  boolean, minKey, maxKey and null where we can only parse it to a boolean
	    //    if it matches the strings used to detect
	    // * ejson where we check if it parses as part of the detection
	    // * regex where we check that we can parse it as part of detection
	    return type === selectedType;
	}
	function findBrokenCSVTypeExample(types, selectedType) {
	    for (const [type, info] of Object.entries(types)) {
	        if (!isCompatibleCSVFieldType(selectedType, type)) {
	            return info;
	        }
	    }
	    return null;
	}
	
	return csvUtils;
}

var hasRequiredExportUtils;

function requireExportUtils () {
	if (hasRequiredExportUtils) return exportUtils;
	hasRequiredExportUtils = 1;
	var __importDefault = (exportUtils && exportUtils.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exportUtils, "__esModule", { value: true });
	exportUtils.ColumnRecorder = void 0;
	exportUtils.lookupValueForPath = lookupValueForPath;
	const lodash_1 = __importDefault(require$$0$8);
	const csv_utils_1 = requireCsvUtils();
	function lookupValueForPath(row, path, allowObjectsAndArrays) {
	    /*
	    Descend along objects and arrays to find a BSON value (ie. something that's
	    not an object or an array) that we can stringify and put in a field.
	    It is possible that not all docs have the same structure which is where we
	    sometimes return undefined below.
	  
	    Imagine a collection:
	    {foo: ['x']}
	    {foo: { bar: 'y' }}
	    {foo: 'z'}
	  
	    It would have the following columns:
	    foo[0]
	    foo.bar
	    foo
	  
	    For each of the documents above it will return a string for one of the columns
	    and undefined for the other two. Unless allowObjectsAndArrays is true, then
	    the path "foo" will always return something that's not undefined. This is so
	    we can support optionally serializing arrays and objects as EJSON strings.
	    */
	    let value = row;
	    for (const part of path) {
	        if (part.type === 'index') {
	            if (Array.isArray(value)) {
	                value = value[part.index];
	            }
	            else {
	                return undefined;
	            }
	        }
	        else {
	            if (lodash_1.default.isPlainObject(value)) {
	                value = value[part.name];
	            }
	            else {
	                return undefined;
	            }
	        }
	    }
	    if (allowObjectsAndArrays) {
	        return value;
	    }
	    if (Array.isArray(value)) {
	        return undefined;
	    }
	    if (lodash_1.default.isPlainObject(value)) {
	        return undefined;
	    }
	    return value;
	}
	class ColumnRecorder {
	    constructor() {
	        this.columnCache = {};
	        this.columns = [];
	    }
	    cacheKey(path) {
	        // something that will make Record<> happy
	        return JSON.stringify(path);
	    }
	    findInsertIndex(path) {
	        const headerName = (0, csv_utils_1.formatCSVHeaderName)(path);
	        const fieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(headerName);
	        let lastIndex = -1;
	        for (const [columnIndex, column] of this.columns.entries()) {
	            const columnHeaderName = (0, csv_utils_1.formatCSVHeaderName)(column);
	            const columnFieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(columnHeaderName);
	            if (columnFieldName === fieldName) {
	                lastIndex = columnIndex;
	            }
	        }
	        if (lastIndex !== -1) {
	            return lastIndex + 1;
	        }
	        return this.columns.length;
	    }
	    addToColumns(value, path = []) {
	        // Something to keep in mind is that with arrays and objects we could
	        // potentially have an enormous amount of distinct paths. In that case we
	        // might want to either error or just EJSON.stringify() the top-level field.
	        if (Array.isArray(value)) {
	            for (const [index, child] of value.entries()) {
	                this.addToColumns(child, [...path, { type: 'index', index }]);
	            }
	        }
	        else if (lodash_1.default.isPlainObject(value)) {
	            for (const [name, child] of Object.entries(value)) {
	                this.addToColumns(child, [...path, { type: 'field', name }]);
	            }
	        }
	        else {
	            const cacheKey = this.cacheKey(path);
	            if (!this.columnCache[cacheKey]) {
	                this.columnCache[cacheKey] = true;
	                this.columns.splice(this.findInsertIndex(path), 0, path);
	            }
	        }
	    }
	}
	exportUtils.ColumnRecorder = ColumnRecorder;
	
	return exportUtils;
}

var hasRequiredExportCsv;

function requireExportCsv () {
	if (hasRequiredExportCsv) return exportCsv;
	hasRequiredExportCsv = 1;
	var __importDefault = (exportCsv && exportCsv.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(exportCsv, "__esModule", { value: true });
	exportCsv.exportCSVFromAggregation = exportCSVFromAggregation;
	exportCsv.exportCSVFromQuery = exportCSVFromQuery;
	const fs_1 = __importDefault(require$$4);
	const bson_1 = require$$0;
	const promises_1 = require$$1$6;
	const stream_1 = require$$0$7;
	const mongodb_ns_1 = __importDefault(requireMongodbNs());
	const Parser_1 = __importDefault(require$$5);
	const StreamValues_1 = __importDefault(require$$6);
	const path_1 = __importDefault(require$$3);
	const os_1 = __importDefault(require$$8);
	const export_utils_1 = requireExportUtils();
	const csv_utils_1 = requireCsvUtils();
	const csv_utils_2 = requireCsvUtils();
	const logger_1 = requireLogger();
	const export_cursor_1 = requireExportCursor();
	const debug = (0, logger_1.createDebug)('export-csv');
	const generateTempFilename = (suffix) => {
	    const randomString = Math.random().toString(36).substring(2, 15);
	    const filename = `temp-${randomString}${suffix}`;
	    return path_1.default.join(os_1.default.tmpdir(), filename);
	};
	class CSVRowStream extends stream_1.Transform {
	    constructor({ columns, delimiter, linebreak, progressCallback, }) {
	        super({ objectMode: true });
	        this.docsWritten = 0;
	        this.columns = columns;
	        this.progressCallback = progressCallback;
	        this.delimiter = delimiter;
	        this.linebreak = linebreak;
	    }
	    _transform(chunk, enc, cb) {
	        this.docsWritten++;
	        // We don't debug on every line passed as it will significantly slow down the
	        // export, however this is useful when diagnosing issues.
	        //debug('CSVRowStream', { chunk });
	        try {
	            const row = this.columns.map((path) => (0, export_utils_1.lookupValueForPath)(chunk, path));
	            const values = row.map((value) => (0, csv_utils_1.stringifyCSVValue)(value, {
	                delimiter: this.delimiter,
	            }));
	            // We don't debug on every line passed as it will significantly slow down the
	            // export, however this is useful when diagnosing issues.
	            //const doc = _.zipObject(this.columns.map(formatCSVHeaderName), values);
	            //console.dir(doc, { depth: Infinity });
	            const line = (0, csv_utils_1.formatCSVLine)(values, {
	                delimiter: this.delimiter,
	                linebreak: this.linebreak,
	            });
	            this.progressCallback?.(this.docsWritten, 'WRITE');
	            cb(null, line);
	        }
	        catch (err) {
	            cb(err);
	        }
	    }
	}
	// You probably want to use exportCSVFromAggregation() or exportCSVFromQuery() rather
	async function _exportCSV({ output, abortSignal, input, columns, progressCallback, delimiter = ',', linebreak = '\n', }) {
	    const headers = columns.map((path) => (0, csv_utils_2.formatCSVHeaderName)(path));
	    output.write((0, csv_utils_1.formatCSVLine)(headers.map((header) => (0, csv_utils_1.formatCSVValue)(header, { delimiter })), { delimiter, linebreak }));
	    const rowStream = new CSVRowStream({
	        columns,
	        delimiter,
	        linebreak,
	        progressCallback,
	    });
	    try {
	        await (0, promises_1.pipeline)([input, rowStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
	    }
	    catch (err) {
	        if (err.code === 'ABORT_ERR') {
	            return {
	                docsWritten: rowStream.docsWritten,
	                aborted: true,
	            };
	        }
	        throw err;
	    }
	    return {
	        docsWritten: rowStream.docsWritten,
	        aborted: !!abortSignal?.aborted,
	    };
	}
	class EJSONStream extends stream_1.Transform {
	    constructor() {
	        super({ objectMode: true });
	    }
	    _transform(chunk, enc, cb) {
	        // We don't debug on every line passed as it will significantly slow down the
	        // export, however this is useful when diagnosing issues.
	        //debug('EJSONStream', { chunk });
	        // We need relaxed: false so that BSONSymbols and possibly other values will
	        // be bson values and not strings or numbers. That way we can unambiguously
	        // serialize them.
	        cb(null, bson_1.EJSON.deserialize(chunk.value, { relaxed: false }));
	    }
	}
	class ColumnStream extends stream_1.Transform {
	    constructor(progressCallback) {
	        super({ objectMode: true });
	        this.docsProcessed = 0;
	        this.columnRecorder = new export_utils_1.ColumnRecorder();
	        this.progressCallback = progressCallback;
	    }
	    _transform(chunk, enc, cb) {
	        // We don't debug on every line passed as it will significantly slow down the
	        // export, however this is useful when diagnosing issues.
	        //debug('ColumnStream', { chunk });
	        this.columnRecorder.addToColumns(chunk);
	        this.docsProcessed++;
	        this.progressCallback?.(this.docsProcessed, 'DOWNLOAD');
	        cb(null, `${bson_1.EJSON.stringify(chunk, { relaxed: true })}\n`);
	    }
	    getColumns() {
	        return this.columnRecorder.columns;
	    }
	}
	async function loadEJSONFileAndColumns({ cursor, abortSignal, progressCallback, }) {
	    // Write the cursor to a temp file containing one ejson doc per line
	    // while simultaneously determining the unique set of columns in the order
	    // we'll have to write to the file.
	    const inputStream = cursor.stream();
	    const filename = generateTempFilename('.jsonl');
	    const output = fs_1.default.createWriteStream(filename);
	    const columnStream = new ColumnStream(progressCallback);
	    try {
	        await (0, promises_1.pipeline)([inputStream, columnStream, output], ...(abortSignal ? [{ signal: abortSignal }] : []));
	    }
	    finally {
	        void cursor.close();
	    }
	    const columns = columnStream.getColumns();
	    debug('columns', JSON.stringify(columns));
	    // Make a stream of EJSON documents for the temp file
	    const input = fs_1.default
	        .createReadStream(filename)
	        .pipe(Parser_1.default.parser({ jsonStreaming: true }))
	        .pipe(StreamValues_1.default.streamValues())
	        .pipe(new EJSONStream());
	    debug(`writing to ${filename}`);
	    return { filename, input, columns };
	}
	async function exportCSVFromAggregation({ ns, aggregation, dataService, preferences, ...exportOptions }) {
	    debug('exportCSVFromAggregation()', { ns: (0, mongodb_ns_1.default)(ns), aggregation });
	    const aggregationCursor = (0, export_cursor_1.createAggregationCursor)({
	        ns,
	        aggregation,
	        dataService,
	        preferences,
	    });
	    let filename, input, columns;
	    try {
	        try {
	            ({ filename, input, columns } = await loadEJSONFileAndColumns({
	                cursor: aggregationCursor,
	                abortSignal: exportOptions.abortSignal,
	                progressCallback: exportOptions.progressCallback,
	            }));
	        }
	        catch (err) {
	            if (err.code === 'ABORT_ERR') {
	                // aborted while still in the download phase, so no docs written yet
	                return {
	                    docsWritten: 0,
	                    aborted: true,
	                };
	            }
	            throw err;
	        }
	        finally {
	            // at this point we don't need the cursor anymore, because we've
	            // downloaded all the rows to a temporary file
	            void aggregationCursor.close();
	        }
	        return await _exportCSV({
	            ...exportOptions,
	            input,
	            columns,
	        });
	    }
	    finally {
	        if (filename) {
	            // clean up the temporary file
	            void fs_1.default.promises.rm(filename);
	        }
	    }
	}
	async function exportCSVFromQuery({ ns, query = { filter: {} }, dataService, ...exportOptions }) {
	    debug('exportCSVFromQuery()', { ns: (0, mongodb_ns_1.default)(ns), query });
	    const findCursor = (0, export_cursor_1.createFindCursor)({
	        ns,
	        query,
	        dataService,
	    });
	    let filename, input, columns;
	    try {
	        try {
	            ({ filename, input, columns } = await loadEJSONFileAndColumns({
	                cursor: findCursor,
	                abortSignal: exportOptions.abortSignal,
	                progressCallback: exportOptions.progressCallback,
	            }));
	        }
	        catch (err) {
	            if (err.code === 'ABORT_ERR') {
	                // aborted while still in the download phase, so no docs written yet
	                return {
	                    docsWritten: 0,
	                    aborted: true,
	                };
	            }
	            throw err;
	        }
	        finally {
	            // at this point we don't need the cursor anymore, because we've
	            // downloaded all the rows to a temporary file
	            void findCursor.close();
	        }
	        return await _exportCSV({
	            ...exportOptions,
	            input,
	            columns,
	        });
	    }
	    finally {
	        if (filename) {
	            // clean up the temporary file
	            void fs_1.default.promises.rm(filename);
	        }
	    }
	}
	
	return exportCsv;
}

var gatherFields = {};

var hasRequiredGatherFields;

function requireGatherFields () {
	if (hasRequiredGatherFields) return gatherFields;
	hasRequiredGatherFields = 1;
	var __importDefault = (gatherFields && gatherFields.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(gatherFields, "__esModule", { value: true });
	gatherFields.createProjectionFromSchemaFields = createProjectionFromSchemaFields;
	gatherFields.gatherFieldsFromQuery = gatherFieldsFromQuery;
	const stream_1 = require$$0$7;
	const promises_1 = require$$1$6;
	const mongodb_schema_1 = require$$2$2;
	const mongodb_ns_1 = __importDefault(requireMongodbNs());
	const hadron_document_1 = requireHadronDocument();
	const logger_1 = requireLogger();
	const debug = (0, logger_1.createDebug)('export-json');
	function createProjectionFromSchemaFields(fields) {
	    const projection = {};
	    for (const fieldPath of fields) {
	        let current = projection;
	        for (const [index, fieldName] of fieldPath.entries()) {
	            // Set the projection when it's the last index.
	            if (index === fieldPath.length - 1) {
	                // If we previously encountered ['foo', 'bar'], then ['foo'] after that,
	                // this will override it so you get all of 'foo'. ie. it should be the
	                // most inclusive
	                current[fieldName] = 1;
	                break;
	            }
	            if (!current[fieldName]) {
	                current[fieldName] = {};
	            }
	            // Only descend if we're adding to a {}. Don't try and add on to a true.
	            // ie. keep the projection as inclusive as possible. So if we already
	            // encountered ['foo'], then ['foo', 'bar'] and ['foo', 'bar', 'baz'] will
	            // be ignored.
	            if (current[fieldName] === 1) {
	                break;
	            }
	            current = current[fieldName];
	        }
	    }
	    // When _id isn't explicitly passed then we assume it's not
	    // intended to be in the results.
	    if (projection._id === undefined) {
	        projection._id = 0;
	    }
	    return projection;
	}
	// You probably want to use gatherFieldsFromQuery() rather
	async function _gatherFields({ input, abortSignal, progressCallback, }) {
	    const schemaAnalyzer = new mongodb_schema_1.SchemaAnalyzer();
	    const result = {
	        docsProcessed: 0,
	        aborted: false,
	    };
	    const analyzeStream = new stream_1.Transform({
	        objectMode: true,
	        transform: (doc, encoding, callback) => {
	            schemaAnalyzer
	                .analyzeDoc(doc)
	                .then(() => {
	                result.docsProcessed++;
	                progressCallback?.(result.docsProcessed);
	                callback();
	            })
	                .catch(callback);
	        },
	    });
	    try {
	        await (0, promises_1.pipeline)([input, analyzeStream], ...(abortSignal ? [{ signal: abortSignal }] : []));
	    }
	    catch (err) {
	        if (err.code === 'ABORT_ERR') {
	            result.aborted = true;
	        }
	        else {
	            throw err;
	        }
	    }
	    const paths = schemaAnalyzer
	        .getSchemaPaths()
	        .filter((fieldPaths) => !(0, hadron_document_1.isInternalFieldPath)(fieldPaths[0]));
	    return {
	        paths,
	        ...result,
	    };
	}
	function capLimitToSampleSize(limit, sampleSize) {
	    if (limit) {
	        if (sampleSize) {
	            return Math.min(limit, sampleSize);
	        }
	        else {
	            return limit;
	        }
	    }
	    else {
	        if (sampleSize) {
	            return sampleSize;
	        }
	        else {
	            return undefined;
	        }
	    }
	}
	async function gatherFieldsFromQuery({ ns, dataService, query = { filter: {} }, sampleSize, ...exportOptions }) {
	    debug('gatherFieldsFromQuery()', { ns: (0, mongodb_ns_1.default)(ns) });
	    const findCursor = dataService.findCursor(ns, query.filter ?? {}, {
	        // At the time of writing the export UI won't use this code if there is a
	        // projection, but we might as well pass it along if it is there, then this
	        // function can give you the unique set of fields for any find query.
	        projection: query.projection,
	        sort: query.sort,
	        // We optionally sample by setting a limit, but the user could have also
	        // specified a limit so we might have to combine them somehow
	        limit: capLimitToSampleSize(query.limit, sampleSize),
	        skip: query.skip,
	    });
	    const input = findCursor.stream();
	    try {
	        return await _gatherFields({
	            input,
	            ...exportOptions,
	        });
	    }
	    finally {
	        void findCursor.close();
	    }
	}
	
	return gatherFields;
}

var _export;
var hasRequired_export;

function require_export () {
	if (hasRequired_export) return _export;
	hasRequired_export = 1;

	const crypto = require$$0$2;
	const { Writable } = require$$0$7;
	const DataService = requireDataService();
	const { sanitizeFilename } = requireSanitize();
	const { sendError, wrapHandler } = requireErrorHandler();
	const { resolveMongoClient } = requireValidateConnection();
	const {
	  exportJSONFromQuery,
	  exportJSONFromAggregation,
	} = requireExportJson();
	const {
	  exportCSVFromQuery,
	  exportCSVFromAggregation,
	} = requireExportCsv();
	const {
	  gatherFieldsFromQuery,
	} = requireGatherFields();

	_export = function exportRoutes(fastify, opts, done) {
	  const connectionManager = fastify.connectionManager;
	  const exportIds = fastify.exportIds;

	  function createExportId(body, type) {
	    const exportId = crypto.randomBytes(8).toString('hex');
	    exportIds.set(exportId, { ...body, type });
	    return exportId;
	  }

	  fastify.post(
	    '/export-csv',
	    { preHandler: fastify.csrfProtection },
	    (request, reply) => {
	      reply.send(createExportId(request.body, 'csv'));
	    }
	  );

	  fastify.post(
	    '/export-json',
	    { preHandler: fastify.csrfProtection },
	    (request, reply) => {
	      reply.send(createExportId(request.body, 'json'));
	    }
	  );

	  fastify.get('/export/:exportId', async (request, reply) => {
	    const exportOptions = exportIds.get(request.params.exportId);
	    if (!exportOptions) {
	      return sendError(reply, 404, 'Export not found');
	    }

	    const mongoClient = await resolveMongoClient(
	      connectionManager, exportOptions.connectionId, reply
	    );
	    if (!mongoClient) return;

	    const outputStream = new Writable({
	      objectMode: true,
	      write: (chunk, encoding, callback) => {
	        reply.raw.write(chunk);
	        callback();
	      },
	    });

	    const ext = exportOptions.type === 'json' ? 'json' : 'csv';
	    const filename = sanitizeFilename(exportOptions.ns);
	    reply.raw.setHeader('Content-Type', 'application/octet-stream');
	    reply.raw.setHeader('Content-Disposition', `attachment; filename="${filename}.${ext}"`);

	    try {
	      const dataService = new DataService(mongoClient);
	      const exportFns = {
	        json: { query: exportJSONFromQuery, aggregation: exportJSONFromAggregation },
	        csv: { query: exportCSVFromQuery, aggregation: exportCSVFromAggregation },
	      };
	      const fnSet = exportFns[exportOptions.type];
	      const fn = exportOptions.query ? fnSet.query : fnSet.aggregation;

	      const params = {
	        ...exportOptions,
	        dataService,
	        output: outputStream,
	      };
	      if (!exportOptions.query) {
	        params.preferences = { getPreferences: () => exportOptions.preferences };
	      }

	      const res = await fn(params);
	      request.log.info({ exportId: request.params.exportId, result: res }, 'Export completed');
	    } catch (err) {
	      request.log.error(err, 'Export failed');
	      if (!reply.raw.headersSent) {
	        reply.raw.writeHead(500);
	      }
	    } finally {
	      reply.raw.end();
	    }
	  });

	  fastify.post('/gather-fields', {
	    preHandler: fastify.csrfProtection,
	  }, wrapHandler(async (request, reply) => {
	    const mongoClient = await resolveMongoClient(
	      connectionManager, request.body.connectionId, reply
	    );
	    if (!mongoClient) return;

	    const res = await gatherFieldsFromQuery({
	      ns: request.body.ns,
	      dataService: new DataService(mongoClient),
	      query: request.body.query,
	      sampleSize: request.body.sampleSize,
	    });

	    reply.send({ docsProcessed: res.docsProcessed, paths: res.paths });
	  }));

	  done();
	};
	return _export;
}

var importJson = {};

var importUtils = {};

var importWriter = {};

var hasRequiredImportWriter;

function requireImportWriter () {
	if (hasRequiredImportWriter) return importWriter;
	hasRequiredImportWriter = 1;
	Object.defineProperty(importWriter, "__esModule", { value: true });
	importWriter.ImportWriter = void 0;
	const logger_1 = requireLogger();
	const debug = (0, logger_1.createDebug)('import-writer');
	class ImportWriterError extends Error {
	    constructor(writeErrors) {
	        super('Something went wrong while writing data to a collection');
	        this.name = 'ImportWriterError';
	        this.writeErrors = writeErrors;
	    }
	}
	function writeErrorToJSError({ errInfo, errmsg, err, code, index, }) {
	    const op = err?.op;
	    const e = new Error(errmsg);
	    e.index = index;
	    e.code = code;
	    e.op = op;
	    e.errInfo = errInfo;
	    // https://www.mongodb.com/docs/manual/reference/method/BulkWriteResult/#mongodb-data-BulkWriteResult.writeErrors
	    e.name = index !== undefined && op ? 'WriteError' : 'WriteConcernError';
	    return e;
	}
	class ImportWriter {
	    constructor(dataService, ns, stopOnErrors) {
	        this.dataService = dataService;
	        this.ns = ns;
	        this.BATCH_SIZE = 1000;
	        this.docsWritten = 0;
	        this.docsProcessed = 0;
	        this.docsErrored = 0;
	        this.stopOnErrors = stopOnErrors;
	        this.batch = [];
	        this._batchCounter = 0;
	    }
	    async write(document) {
	        this.batch.push(document);
	        if (this.batch.length >= this.BATCH_SIZE) {
	            await this._executeBatch();
	        }
	    }
	    async finish() {
	        if (this.batch.length === 0) {
	            debug('%d docs written', this.docsWritten);
	            return;
	        }
	        debug('draining buffered docs', this.batch.length);
	        await this._executeBatch();
	    }
	    async _executeBatch() {
	        const documents = this.batch;
	        this.docsProcessed += documents.length;
	        this.batch = [];
	        let bulkWriteResult;
	        try {
	            bulkWriteResult = await this.dataService.bulkWrite(this.ns, documents.map((document) => ({
	                insertOne: { document },
	            })), {
	                ordered: this.stopOnErrors,
	                retryWrites: false,
	                checkKeys: false,
	            });
	        }
	        catch (bulkWriteError) {
	            // Currently, the server does not support batched inserts for FLE2:
	            // https://jira.mongodb.org/browse/SERVER-66315
	            // We check for this specific error and re-try inserting documents one by one.
	            if (bulkWriteError.code === 6371202) {
	                this.BATCH_SIZE = 1;
	                bulkWriteResult = await this._insertOneByOne(documents);
	            }
	            else {
	                // If we are writing with `ordered: false`, bulkWrite will throw and
	                // will not return any result, but server might write some docs and bulk
	                // result can still be accessed on the error instance
	                // Driver seems to return null instead of undefined in some rare cases
	                // when the operation ends in error, instead of relying on
	                // `_mergeBulkOpResult` default argument substitution, we need to keep
	                // this OR expression here
	                bulkWriteResult = (bulkWriteError.result ||
	                    {});
	                if (this.stopOnErrors) {
	                    this.docsWritten += bulkWriteResult.insertedCount || 0;
	                    this.docsErrored +=
	                        (bulkWriteResult.getWriteErrors?.() || []).length || 0;
	                    throw bulkWriteError;
	                }
	            }
	        }
	        const bulkOpResult = this._getBulkOpResult(bulkWriteResult);
	        const writeErrors = (bulkWriteResult?.getWriteErrors?.() || []).map(writeErrorToJSError);
	        this.docsWritten += bulkOpResult.insertedCount;
	        this.docsErrored += bulkOpResult.numWriteErrors;
	        this._batchCounter++;
	        if (writeErrors.length) {
	            throw new ImportWriterError(writeErrors);
	        }
	    }
	    async _insertOneByOne(documents) {
	        let insertedCount = 0;
	        const errors = [];
	        for (const doc of documents) {
	            try {
	                await this.dataService.insertOne(this.ns, doc);
	                insertedCount += 1;
	            }
	            catch (insertOneByOneError) {
	                if (this.stopOnErrors) {
	                    this.docsWritten += insertedCount;
	                    this.docsErrored += 1;
	                    throw insertOneByOneError;
	                }
	                errors.push(insertOneByOneError);
	            }
	        }
	        return {
	            insertedCount,
	            getWriteErrors: () => {
	                return errors;
	            },
	        };
	    }
	    _getBulkOpResult(result) {
	        const writeErrors = result.getWriteErrors?.() || [];
	        return {
	            insertedCount: result.insertedCount || 0,
	            numWriteErrors: writeErrors.length,
	        };
	    }
	}
	importWriter.ImportWriter = ImportWriter;
	
	return importWriter;
}

var utf8Validator = {};

var hasRequiredUtf8Validator;

function requireUtf8Validator () {
	if (hasRequiredUtf8Validator) return utf8Validator;
	hasRequiredUtf8Validator = 1;
	var __importDefault = (utf8Validator && utf8Validator.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(utf8Validator, "__esModule", { value: true });
	utf8Validator.Utf8Validator = void 0;
	const stream_1 = require$$0$7;
	const util_1 = __importDefault(require$$1$8);
	class Utf8Validator extends stream_1.Transform {
	    constructor() {
	        super(...arguments);
	        this.decoder = new util_1.default.TextDecoder('utf8', { fatal: true, ignoreBOM: true });
	    }
	    _transform(chunk, enc, cb) {
	        try {
	            this.decoder.decode(chunk, { stream: true });
	        }
	        catch (err) {
	            cb(err);
	            return;
	        }
	        cb(null, chunk);
	    }
	    _flush(cb) {
	        try {
	            this.decoder.decode(new Uint8Array());
	        }
	        catch (err) {
	            cb(err);
	            return;
	        }
	        cb(null);
	    }
	}
	utf8Validator.Utf8Validator = Utf8Validator;
	
	return utf8Validator;
}

var byteCounter = {};

var hasRequiredByteCounter;

function requireByteCounter () {
	if (hasRequiredByteCounter) return byteCounter;
	hasRequiredByteCounter = 1;
	Object.defineProperty(byteCounter, "__esModule", { value: true });
	byteCounter.ByteCounter = void 0;
	const stream_1 = require$$0$7;
	class ByteCounter extends stream_1.Transform {
	    constructor() {
	        super(...arguments);
	        this.total = 0;
	    }
	    _transform(chunk, enc, cb) {
	        this.total += chunk.length;
	        cb(null, chunk);
	    }
	}
	byteCounter.ByteCounter = ByteCounter;
	
	return byteCounter;
}

var hasRequiredImportUtils;

function requireImportUtils () {
	if (hasRequiredImportUtils) return importUtils;
	hasRequiredImportUtils = 1;
	var __importDefault = (importUtils && importUtils.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(importUtils, "__esModule", { value: true });
	importUtils.DocStatsCollector = void 0;
	importUtils.makeImportResult = makeImportResult;
	importUtils.errorToJSON = errorToJSON;
	importUtils.writeErrorToLog = writeErrorToLog;
	importUtils.doImport = doImport;
	const os_1 = __importDefault(require$$8);
	const stream_1 = require$$0$7;
	const import_writer_1 = requireImportWriter();
	const logger_1 = requireLogger();
	const utf8_validator_1 = requireUtf8Validator();
	const byte_counter_1 = requireByteCounter();
	const strip_bom_stream_1 = __importDefault(require$$6$1);
	const debug = (0, logger_1.createDebug)('import');
	function makeImportResult(importWriter, numProcessed, numParseErrors, docStatsStream, aborted) {
	    const result = {
	        docsErrored: numParseErrors + importWriter.docsErrored,
	        docsWritten: importWriter.docsWritten,
	        ...docStatsStream.getStats(),
	        // docsProcessed is not on importWriter so that it includes docs that
	        // produced parse errors and therefore never made it that far
	        docsProcessed: numProcessed,
	    };
	    if (aborted) {
	        result.aborted = aborted;
	    }
	    return result;
	}
	function errorToJSON(error) {
	    const obj = {
	        name: error.name,
	        message: error.message,
	    };
	    for (const key of ['index', 'code', 'op', 'errInfo']) {
	        if (error[key] !== undefined) {
	            obj[key] = error[key];
	        }
	    }
	    return obj;
	}
	function writeErrorToLog(output, error) {
	    return new Promise(function (resolve) {
	        output.write(JSON.stringify(error) + os_1.default.EOL, 'utf8', (err) => {
	            if (err) {
	                debug('error while writing error', err);
	            }
	            // we always resolve because we ignore the error
	            resolve();
	        });
	    });
	}
	function hasArrayOfLength(val, len = 250, seen = new WeakSet()) {
	    if (Array.isArray(val)) {
	        return val.length >= len;
	    }
	    if (typeof val === 'object' && val !== null) {
	        if (seen.has(val)) {
	            return false;
	        }
	        seen.add(val);
	        for (const prop of Object.values(val)) {
	            if (hasArrayOfLength(prop, len, seen)) {
	                return true;
	            }
	        }
	    }
	    return false;
	}
	class DocStatsCollector {
	    constructor() {
	        this.stats = { biggestDocSize: 0, hasUnboundArray: false };
	    }
	    collect(doc) {
	        this.stats.hasUnboundArray =
	            this.stats.hasUnboundArray || hasArrayOfLength(doc, 250);
	        try {
	            const docString = JSON.stringify(doc);
	            this.stats.biggestDocSize = Math.max(this.stats.biggestDocSize, docString.length);
	        }
	        catch {
	            // We ignore the JSON stringification error
	        }
	    }
	    getStats() {
	        return this.stats;
	    }
	}
	importUtils.DocStatsCollector = DocStatsCollector;
	async function doImport(input, streams, transformer, { dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, }) {
	    const byteCounter = new byte_counter_1.ByteCounter();
	    let stream;
	    const docStatsCollector = new DocStatsCollector();
	    const importWriter = new import_writer_1.ImportWriter(dataService, ns, stopOnErrors);
	    let numProcessed = 0;
	    let numParseErrors = 0;
	    // Stream errors just get thrown synchronously unless we listen for the event
	    // on each stream we use in the pipeline. By destroying the stream we're
	    // iterating on and passing the error, the "for await line" will throw inside
	    // the try/catch below. Relevant test: "errors if a file is truncated utf8"
	    function streamErrorListener(error) {
	        stream.destroy(error);
	    }
	    input.once('error', streamErrorListener);
	    stream = input;
	    const allStreams = [
	        new utf8_validator_1.Utf8Validator(),
	        byteCounter,
	        (0, strip_bom_stream_1.default)(),
	        ...streams,
	    ];
	    for (const s of allStreams) {
	        stream = stream.pipe(s);
	        stream.once('error', streamErrorListener);
	    }
	    if (abortSignal) {
	        stream = (0, stream_1.addAbortSignal)(abortSignal, stream);
	    }
	    try {
	        for await (const chunk of stream) {
	            // Call progress and increase the number processed even if it errors
	            // below. The import writer stats at the end stores how many got written.
	            // This way progress updates continue even if every row fails to parse.
	            ++numProcessed;
	            if (!abortSignal?.aborted) {
	                progressCallback?.({
	                    bytesProcessed: byteCounter.total,
	                    docsProcessed: numProcessed,
	                    docsWritten: importWriter.docsWritten,
	                });
	            }
	            let doc;
	            try {
	                doc = transformer.transform(chunk);
	            }
	            catch (err) {
	                ++numParseErrors;
	                // deal with transform error
	                // rethrow with the line number / array index appended to aid debugging
	                err.message = `${err.message}${transformer.lineAnnotation(numProcessed)}`;
	                if (stopOnErrors) {
	                    throw err;
	                }
	                else {
	                    const transformedError = errorToJSON(err);
	                    debug('transform error', transformedError);
	                    errorCallback?.(transformedError);
	                    if (output) {
	                        await writeErrorToLog(output, transformedError);
	                    }
	                }
	                continue;
	            }
	            docStatsCollector.collect(doc);
	            try {
	                // write
	                await importWriter.write(doc);
	            }
	            catch (err) {
	                // if there is no writeErrors property, then it isn't an
	                // ImportWriteError, so probably not recoverable
	                if (!err.writeErrors) {
	                    throw err;
	                }
	                // deal with write error
	                debug('write error', err);
	                if (stopOnErrors) {
	                    throw err;
	                }
	                if (!output) {
	                    continue;
	                }
	                const errors = err.writeErrors;
	                for (const error of errors) {
	                    const transformedError = errorToJSON(error);
	                    errorCallback?.(transformedError);
	                    await writeErrorToLog(output, transformedError);
	                }
	            }
	        }
	        input.removeListener('error', streamErrorListener);
	        for (const s of allStreams) {
	            s.removeListener('error', streamErrorListener);
	        }
	        // also insert the remaining partial batch
	        try {
	            await importWriter.finish();
	        }
	        catch (err) {
	            // if there is no writeErrors property, then it isn't an
	            // ImportWriteError, so probably not recoverable
	            if (!err.writeErrors) {
	                throw err;
	            }
	            // deal with write error
	            debug('write error', err);
	            if (stopOnErrors) {
	                throw err;
	            }
	            if (output) {
	                const errors = err.writeErrors;
	                for (const error of errors) {
	                    const transformedError = errorToJSON(error);
	                    errorCallback?.(transformedError);
	                    await writeErrorToLog(output, transformedError);
	                }
	            }
	        }
	    }
	    catch (err) {
	        if (err.code === 'ABORT_ERR') {
	            debug('import:aborting');
	            const result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector, true);
	            debug('import:aborted', result);
	            return result;
	        }
	        // stick the result onto the error so that we can tell how far it got
	        err.result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector);
	        throw err;
	    }
	    debug('import:completing');
	    const result = makeImportResult(importWriter, numProcessed, numParseErrors, docStatsCollector);
	    debug('import:completed', result);
	    return result;
	}
	
	return importUtils;
}

var hasRequiredImportJson;

function requireImportJson () {
	if (hasRequiredImportJson) return importJson;
	hasRequiredImportJson = 1;
	var __importDefault = (importJson && importJson.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(importJson, "__esModule", { value: true });
	importJson.importJSON = importJSON;
	const bson_1 = require$$0;
	const mongodb_ns_1 = __importDefault(requireMongodbNs());
	const Parser_1 = __importDefault(require$$5);
	const StreamArray_1 = __importDefault(require$$3$1);
	const StreamValues_1 = __importDefault(require$$6);
	const import_utils_1 = requireImportUtils();
	const logger_1 = requireLogger();
	const debug = (0, logger_1.createDebug)('import-json');
	class JSONTransformer {
	    transform(chunk) {
	        // make sure files parsed as jsonl only contain objects with no arrays and simple values
	        // (this will either stop the entire import and throw or just skip this
	        // one value depending on the value of stopOnErrors)
	        if (Object.prototype.toString.call(chunk.value) !== '[object Object]') {
	            throw new Error('Value is not an object');
	        }
	        return bson_1.EJSON.deserialize(chunk.value, {
	            relaxed: false,
	        });
	    }
	    lineAnnotation(numProcessed) {
	        return ` [Index ${numProcessed - 1}]`;
	    }
	}
	async function importJSON({ dataService, ns, output, abortSignal, progressCallback, errorCallback, stopOnErrors, input, jsonVariant, }) {
	    debug('importJSON()', { ns: (0, mongodb_ns_1.default)(ns) });
	    if (ns === 'test.compass-import-abort-e2e-test') {
	        // Give the test more than enough time to click the abort before we continue.
	        await new Promise((resolve) => setTimeout(resolve, 3000));
	    }
	    const transformer = new JSONTransformer();
	    const streams = [];
	    if (jsonVariant === 'jsonl') {
	        streams.push(Parser_1.default.parser({ jsonStreaming: true }));
	        streams.push(StreamValues_1.default.streamValues());
	    }
	    else {
	        streams.push(Parser_1.default.parser());
	        streams.push(StreamArray_1.default.streamArray());
	    }
	    return await (0, import_utils_1.doImport)(input, streams, transformer, {
	        dataService,
	        ns,
	        output,
	        abortSignal,
	        progressCallback,
	        errorCallback,
	        stopOnErrors,
	    });
	}
	
	return importJson;
}

var guessFiletype = {};

var csvTypes = {};

var hasRequiredCsvTypes;

function requireCsvTypes () {
	if (hasRequiredCsvTypes) return csvTypes;
	hasRequiredCsvTypes = 1;
	(function (exports) {
		Object.defineProperty(exports, "__esModule", { value: true });
		exports.CSVFieldTypeLabels = exports.parsableFieldTypes = exports.detectableFieldTypes = exports.supportedLinebreaks = exports.supportedDelimiters = void 0;
		exports.supportedDelimiters = [',', '\t', ';', ' '];
		exports.supportedLinebreaks = ['\r\n', '\n'];
		// the subset of bson types that we can detect
		exports.detectableFieldTypes = [
		    'int',
		    'long',
		    'double',
		    'boolean',
		    'date',
		    'string',
		    'objectId',
		    'uuid',
		    'regex',
		    'minKey',
		    'maxKey',
		    // ejson is not a real type, but the fallback for otherwise unserializable
		    // values like javascript, javascriptWithCode, DBRef (which itself is just a
		    // convention, not a type) and whatever new types get added. It also covers
		    // arrays and objects exported by mongoexport. So we detect those as ejson and
		    // then we can import them.
		    'ejson',
		    'null',
		];
		// NOTE: 'undefined' exists internally for ignored empty strings, but it is
		// deprecated as a bson type so we can't actually parse it, so it is left out of
		// detectable and parsable field types.
		// the subset of bson types that we can parse
		exports.parsableFieldTypes = [
		    ...exports.detectableFieldTypes,
		    'binData',
		    'md5',
		    'timestamp',
		    'decimal',
		    'number', // like 'mixed', but for use when everything is an int, long or double.
		    'mixed',
		];
		exports.CSVFieldTypeLabels = {
		    int: 'Int32',
		    long: 'Long',
		    double: 'Double',
		    boolean: 'Boolean',
		    date: 'Date',
		    string: 'String',
		    null: 'Null',
		    objectId: 'ObjectId',
		    binData: 'Binary',
		    uuid: 'UUID',
		    md5: 'MD5',
		    timestamp: 'Timestamp',
		    decimal: 'Decimal128',
		    regex: 'RegExpr',
		    minKey: 'MinKey',
		    maxKey: 'MaxKey',
		    ejson: 'EJSON',
		    number: 'Number',
		    mixed: 'Mixed',
		};
		
	} (csvTypes));
	return csvTypes;
}

var hasRequiredGuessFiletype;

function requireGuessFiletype () {
	if (hasRequiredGuessFiletype) return guessFiletype;
	hasRequiredGuessFiletype = 1;
	var __importDefault = (guessFiletype && guessFiletype.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(guessFiletype, "__esModule", { value: true });
	guessFiletype.guessFileType = guessFileType;
	const stream_1 = require$$0$7;
	const util_1 = __importDefault(require$$1$8);
	const papaparse_1 = __importDefault(require$$0$9);
	const stream_json_1 = __importDefault(require$$3$2);
	const logger_1 = requireLogger();
	const csv_types_1 = requireCsvTypes();
	const debug = (0, logger_1.createDebug)('import-guess-filetype');
	function detectJSON(input) {
	    return new Promise(function (resolve) {
	        const parser = stream_json_1.default.parser();
	        let found = false;
	        parser.once('data', (data) => {
	            debug('detectJSON:data', data);
	            let jsonVariant = null;
	            if (data.name === 'startObject') {
	                jsonVariant = 'jsonl';
	            }
	            else if (data.name === 'startArray') {
	                jsonVariant = 'json';
	            }
	            found = true;
	            input.destroy();
	            resolve(jsonVariant);
	        });
	        parser.on('end', () => {
	            debug('detectJSON:end');
	            if (!found) {
	                found = true;
	                // reached the end before a full doc
	                input.destroy();
	                resolve(null);
	            }
	        });
	        parser.on('close', (err) => {
	            debug('detectJSON:close', err);
	            if (!found) {
	                found = true;
	                // stream closed before a full doc
	                input.destroy();
	                resolve(null);
	            }
	        });
	        parser.on('error', (err) => {
	            debug('detectJSON:error', err);
	            if (!found) {
	                found = true;
	                // got an error before a full doc
	                input.destroy();
	                resolve(null);
	            }
	        });
	        input.pipe(parser);
	    });
	}
	function hasDelimiterError({ data, errors, }) {
	    // papaparse gets weird when there's only one header field. It might find a
	    // space in the second line and go with that. So rather go with our own
	    // delimiter detection code in this case.
	    if (data.length < 2) {
	        return true;
	    }
	    return (errors.find((error) => error.code === 'UndetectableDelimiter') !== undefined);
	}
	function redetectDelimiter({ data }) {
	    for (const char of data[0]) {
	        if (csv_types_1.supportedDelimiters.includes(char)) {
	            return char;
	        }
	    }
	    return ',';
	}
	function detectCSV(input, jsonPromise) {
	    let csvDelimiter = null;
	    let lines = 0;
	    let found = false;
	    // stop processing CSV as soon as we detect JSON
	    const jsonDetected = new Promise(function (resolve) {
	        jsonPromise
	            .then((jsonType) => {
	            if (jsonType) {
	                input.destroy();
	                resolve(null);
	            }
	        })
	            .catch(() => {
	            // if the file was not valid JSON, then ignore this because either CSV
	            // detection will eventually succeed FileSizeEnforcer will error
	        });
	    });
	    return Promise.race([
	        jsonDetected,
	        new Promise(function (resolve) {
	            papaparse_1.default.parse(input, {
	                // NOTE: parsing without header: true otherwise the delimiter detection
	                // can't fail and will always detect ,
	                delimitersToGuess: csv_types_1.supportedDelimiters,
	                step: function (results) {
	                    ++lines;
	                    debug('detectCSV:step', lines, results);
	                    if (lines === 1) {
	                        if (hasDelimiterError(results)) {
	                            csvDelimiter = redetectDelimiter(results);
	                        }
	                        else {
	                            csvDelimiter = results.meta.delimiter;
	                        }
	                    }
	                    // must be at least two lines for header row and data
	                    if (lines === 2) {
	                        found = true;
	                        debug('detectCSV:complete');
	                        input.destroy();
	                        resolve(lines === 2 ? csvDelimiter : null);
	                    }
	                },
	                complete: function () {
	                    debug('detectCSV:complete');
	                    if (!found) {
	                        found = true;
	                        // we reached the end before two lines
	                        input.destroy();
	                        resolve(null);
	                    }
	                },
	                error: function (err) {
	                    debug('detectCSV:error', err);
	                    if (!found) {
	                        found = true;
	                        // something failed before we got to the end of two lines
	                        input.destroy();
	                        resolve(null);
	                    }
	                },
	            });
	        }),
	    ]);
	}
	const MAX_LENGTH = 1000000;
	class FileSizeEnforcer extends stream_1.Transform {
	    constructor() {
	        super(...arguments);
	        this.length = 0;
	    }
	    _transform(chunk, enc, cb) {
	        this.length += chunk.length;
	        if (this.length > MAX_LENGTH) {
	            cb(new Error(`CSV still not detected after ${MAX_LENGTH} bytes`));
	        }
	        else {
	            cb(null, chunk);
	        }
	    }
	}
	class NewlineDetector extends stream_1.Transform {
	    constructor() {
	        super(...arguments);
	        this.chunks = [];
	        this.decoder = new util_1.default.TextDecoder('utf8', { fatal: true, ignoreBOM: true });
	    }
	    _transform(chunk, enc, cb) {
	        try {
	            /*
	            It might look like this is going to store the entire file in memory, but
	            this whole process will stop the moment it detects either JSON (which
	            happens nearly immediately if that's the case) or when it detects CSV
	            (which happens as soon as we hit two lines). If it doesn't detect either
	            of those, then FileSizeEnforcer will kick in, we'll find Unknown and the
	            process also stops.
	      
	            But just in case someone thinks this is generic enough to use in any
	            situation, we're not exporting this class so it will only be used here.
	            */
	            this.chunks.push(this.decoder.decode(chunk, { stream: true }));
	        }
	        catch (err) {
	            cb(err);
	            return;
	        }
	        cb(null, chunk);
	    }
	    _flush(cb) {
	        try {
	            this.chunks.push(this.decoder.decode(new Uint8Array()));
	        }
	        catch (err) {
	            cb(err);
	            return;
	        }
	        cb(null);
	    }
	    detectNewline() {
	        const text = this.chunks.join('');
	        const firstRN = text.indexOf('\r\n');
	        const firstN = text.indexOf('\n');
	        if (firstRN !== -1 && firstRN < firstN) {
	            // If there is a \r\n then there most be a \n , so firstN is never -1. But
	            // there might have been a \n even earlier.
	            return '\r\n';
	        }
	        // Either there is only a \n in which case we go with that, or there are no
	        // line endings in which case we just go with a default of \n as it won't
	        // matter because there are no lines to split anyway.
	        return '\n';
	    }
	}
	function guessFileType({ input, }) {
	    return new Promise((resolve, reject) => {
	        void (async () => {
	            const newlineDetector = new NewlineDetector();
	            input = input.pipe(newlineDetector);
	            input.once('error', function (err) {
	                reject(err);
	            });
	            const jsStream = input.pipe(new stream_1.PassThrough());
	            const csvStream = input
	                .pipe(new stream_1.PassThrough())
	                .pipe(new FileSizeEnforcer());
	            const jsonPromise = detectJSON(jsStream);
	            const [jsonVariant, csvDelimiter] = await Promise.all([
	                jsonPromise,
	                detectCSV(csvStream, jsonPromise),
	            ]);
	            // keep streaming until both promises resolved, then destroy the input
	            // stream to stop further processing
	            input.destroy();
	            debug('guessFileType', jsonVariant, csvDelimiter);
	            // check JSON first because practically anything will parse as CSV
	            if (jsonVariant) {
	                resolve({ type: jsonVariant });
	                return;
	            }
	            if (csvDelimiter) {
	                const newline = newlineDetector.detectNewline();
	                resolve({ type: 'csv', csvDelimiter, newline });
	                return;
	            }
	            resolve({ type: 'unknown' });
	        })();
	    });
	}
	
	return guessFiletype;
}

var importCsv = {};

var hasRequiredImportCsv;

function requireImportCsv () {
	if (hasRequiredImportCsv) return importCsv;
	hasRequiredImportCsv = 1;
	var __importDefault = (importCsv && importCsv.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(importCsv, "__esModule", { value: true });
	importCsv.importCSV = importCSV;
	const papaparse_1 = __importDefault(require$$0$9);
	const mongodb_ns_1 = __importDefault(requireMongodbNs());
	const csv_utils_1 = requireCsvUtils();
	const import_utils_1 = requireImportUtils();
	const logger_1 = requireLogger();
	const debug = (0, logger_1.createDebug)('import-csv');
	class CSVTransformer {
	    constructor({ fields, ignoreEmptyStrings, }) {
	        this.fields = fields;
	        this.ignoreEmptyStrings = ignoreEmptyStrings;
	        this.headerFields = [];
	    }
	    addHeaderField(field) {
	        this.headerFields.push(field);
	    }
	    transform(row) {
	        if (!this.parsedHeader) {
	            // There's a quirk in papaparse where it calls transformHeader()
	            // before it finishes auto-detecting the line endings. We could pass
	            // in a line ending that we previously detected (in guessFileType(),
	            // perhaps?) or we can just strip the extra \r from the final header
	            // name if it exists.
	            if (this.headerFields.length) {
	                const fixupFrom = this.headerFields[this.headerFields.length - 1];
	                const fixupTo = fixupFrom.replace(/\r$/, '');
	                this.headerFields[this.headerFields.length - 1] = fixupTo;
	            }
	            this.parsedHeader = {};
	            for (const name of this.headerFields) {
	                this.parsedHeader[name] = (0, csv_utils_1.parseCSVHeaderName)(name);
	            }
	            // TODO(COMPASS-7158): make sure array indexes start at 0 and have no
	            // gaps, otherwise clean them up (ie. treat those parts as part of the
	            // field name). So that you can't have a foo[1000000]
	            // edge case.
	        }
	        return (0, csv_utils_1.makeDocFromCSV)(row, this.headerFields, this.parsedHeader, this.fields, {
	            ignoreEmptyStrings: this.ignoreEmptyStrings,
	        });
	    }
	    lineAnnotation(numProcessed) {
	        return `[Row ${numProcessed}]`;
	    }
	}
	async function importCSV({ dataService, ns, input, output, abortSignal, progressCallback, errorCallback, delimiter = ',', newline, ignoreEmptyStrings, stopOnErrors, fields, }) {
	    debug('importCSV()', { ns: (0, mongodb_ns_1.default)(ns), stopOnErrors });
	    if (ns === 'test.compass-import-abort-e2e-test') {
	        // Give the test more than enough time to click the abort before we continue.
	        await new Promise((resolve) => setTimeout(resolve, 3000));
	    }
	    const transformer = new CSVTransformer({ fields, ignoreEmptyStrings });
	    const parseStream = papaparse_1.default.parse(papaparse_1.default.NODE_STREAM_INPUT, {
	        delimiter,
	        newline,
	        header: true,
	        transformHeader: function (header, index) {
	            debug('importCSV:transformHeader', header, index);
	            transformer.addHeaderField(header);
	            return header;
	        },
	    });
	    const streams = [parseStream];
	    return await (0, import_utils_1.doImport)(input, streams, transformer, {
	        dataService,
	        ns,
	        output,
	        abortSignal,
	        progressCallback,
	        errorCallback,
	        stopOnErrors,
	    });
	}
	
	return importCsv;
}

var listCsvFields = {};

var hasRequiredListCsvFields;

function requireListCsvFields () {
	if (hasRequiredListCsvFields) return listCsvFields;
	hasRequiredListCsvFields = 1;
	var __importDefault = (listCsvFields && listCsvFields.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(listCsvFields, "__esModule", { value: true });
	listCsvFields.listCSVFields = listCSVFields;
	const papaparse_1 = __importDefault(require$$0$9);
	const strip_bom_stream_1 = __importDefault(require$$6$1);
	const logger_1 = requireLogger();
	const csv_utils_1 = requireCsvUtils();
	const utf8_validator_1 = requireUtf8Validator();
	const debug = (0, logger_1.createDebug)('list-csv-fields');
	const NUM_PREVIEW_FIELDS = 10;
	async function listCSVFields({ input, delimiter, newline, }) {
	    return new Promise(function (resolve, reject) {
	        let lines = 0;
	        const result = {
	            uniqueFields: [],
	            headerFields: [],
	            preview: [],
	        };
	        const validator = new utf8_validator_1.Utf8Validator();
	        validator.once('error', function (err) {
	            reject(err);
	        });
	        input = input.pipe(validator).pipe((0, strip_bom_stream_1.default)());
	        papaparse_1.default.parse(input, {
	            delimiter,
	            newline,
	            step: function (results, parser) {
	                ++lines;
	                debug('listCSVFields:step', lines, results);
	                if (lines === 1) {
	                    const headerFields = results.data;
	                    // There's a quirk in papaparse where it extracts header fields before
	                    // it finishes auto-detecting the line endings. We could pass in a
	                    // line ending that we previously detected (in guessFileType(),
	                    // perhaps?) or we can just strip the extra \r from the final header
	                    // name if it exists.
	                    if (headerFields.length) {
	                        const lastName = headerFields[headerFields.length - 1];
	                        headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
	                    }
	                    result.headerFields = headerFields;
	                    // remove array indexes so that foo[0], foo[1] becomes foo
	                    // and bar[0].a, bar[1].a becomes bar.a
	                    // ie. the whole array counts as one field
	                    const flattened = headerFields.map(csv_utils_1.csvHeaderNameToFieldName);
	                    const fieldMap = {};
	                    // make sure that each array field is only included once
	                    for (const name of flattened) {
	                        if (!fieldMap[name]) {
	                            fieldMap[name] = true;
	                            result.uniqueFields.push(name);
	                        }
	                    }
	                    return;
	                }
	                result.preview.push(results.data);
	                if (lines === NUM_PREVIEW_FIELDS + 1) {
	                    parser.abort();
	                    // Aborting the parser does not destroy the input stream. If we don't
	                    // destroy the input stream it will try and read the entire file into
	                    // memory.
	                    input.destroy();
	                }
	            },
	            complete: function () {
	                debug('listCSVFields:complete');
	                resolve(result);
	            },
	            error: function (err) {
	                debug('listCSVFields:error', err);
	                reject(err);
	            },
	        });
	    });
	}
	
	return listCsvFields;
}

var analyzeCsvFields = {};

var hasRequiredAnalyzeCsvFields;

function requireAnalyzeCsvFields () {
	if (hasRequiredAnalyzeCsvFields) return analyzeCsvFields;
	hasRequiredAnalyzeCsvFields = 1;
	var __importDefault = (analyzeCsvFields && analyzeCsvFields.__importDefault) || function (mod) {
	    return (mod && mod.__esModule) ? mod : { "default": mod };
	};
	Object.defineProperty(analyzeCsvFields, "__esModule", { value: true });
	analyzeCsvFields.analyzeCSVFields = analyzeCSVFields;
	const stream_1 = require$$0$7;
	const promises_1 = require$$1$6;
	const papaparse_1 = __importDefault(require$$0$9);
	const strip_bom_stream_1 = __importDefault(require$$6$1);
	const csv_utils_1 = requireCsvUtils();
	const utf8_validator_1 = requireUtf8Validator();
	const byte_counter_1 = requireByteCounter();
	function initResultFields(result, headerFields) {
	    for (const [columnIndex, name] of headerFields.entries()) {
	        const fieldName = (0, csv_utils_1.csvHeaderNameToFieldName)(name);
	        if (!result.fields[fieldName]) {
	            result.fields[fieldName] = {
	                types: {},
	                columnIndexes: [],
	                detected: 'mixed', // we'll fill this at the end
	            };
	        }
	        // For fields inside arrays different CSV header fields can map to
	        // the same fieldName, so there will be more than one entry in
	        // columnIndex.
	        result.fields[fieldName].columnIndexes.push(columnIndex);
	    }
	}
	function addRowToResult(fields, rowNum, data, ignoreEmptyStrings) {
	    for (const [name, field] of Object.entries(fields)) {
	        for (const columnIndex of field.columnIndexes) {
	            const original = data[columnIndex] ?? '';
	            const type = (0, csv_utils_1.detectCSVFieldType)(original, name, ignoreEmptyStrings);
	            if (!field.types[type]) {
	                field.types[type] = {
	                    count: 0,
	                    firstRowIndex: rowNum,
	                    firstColumnIndex: columnIndex,
	                    firstValue: original,
	                };
	            }
	            ++field.types[type].count;
	        }
	    }
	}
	function pickFieldType(field) {
	    const types = Object.keys(field.types);
	    if (types.length === 1) {
	        // This is a bit of an edge case. If a column is always empty and
	        // "Ignore empty strings" is checked, we'll detect "undefined".
	        // We'll never actually insert undefined due to the checkbox, but
	        // undefined as a bson type is deprecated so it might give the wrong
	        // impression. We could select any type in the selectbox, so the
	        // choice of making it string is arbitrary.
	        if (types[0] === 'undefined') {
	            return 'string';
	        }
	        // If there's only one detected type, go with that.
	        return (0, csv_utils_1.overrideDetectedFieldType)(types[0]);
	    }
	    if (types.length === 2) {
	        const filtered = types.filter((type) => type !== 'undefined');
	        if (filtered.length === 1) {
	            // If there are two detected types and one is undefined (ie. an ignored
	            // empty string), go with the non-undefined one because undefined values
	            // are special-cased during import.
	            return (0, csv_utils_1.overrideDetectedFieldType)(filtered[0]);
	        }
	    }
	    // If everything is number-ish (or undefined), go with the made up type
	    // 'number'. Behaves much like 'mixed', but makes it a bit clearer to the user
	    // what will happen and matches the existing Number entry we have in the field
	    // type dropdown.
	    if (types.every((type) => ['int', 'long', 'double', 'undefined'].includes(type))) {
	        return 'number';
	    }
	    // otherwise stick with the default 'mixed'
	    return field.detected;
	}
	async function analyzeCSVFields({ input, delimiter, newline, abortSignal, progressCallback, ignoreEmptyStrings, }) {
	    const byteCounter = new byte_counter_1.ByteCounter();
	    const result = {
	        totalRows: 0,
	        fields: {},
	        aborted: false,
	    };
	    const parseStream = papaparse_1.default.parse(papaparse_1.default.NODE_STREAM_INPUT, {
	        delimiter,
	        newline,
	    });
	    let numRows = 0;
	    const analyzeStream = new stream_1.Transform({
	        objectMode: true,
	        transform: (chunk, encoding, callback) => {
	            if (numRows === 0) {
	                const headerFields = chunk;
	                // There's a quirk in papaparse where it extracts header fields before
	                // it finishes auto-detecting the line endings. We could pass in a
	                // line ending that we previously detected (in guessFileType(),
	                // perhaps?) or we can just strip the extra \r from the final header
	                // name if it exists.
	                if (headerFields.length) {
	                    const lastName = headerFields[headerFields.length - 1];
	                    headerFields[headerFields.length - 1] = lastName.replace(/\r$/, '');
	                }
	                initResultFields(result, headerFields);
	            }
	            else {
	                addRowToResult(result.fields, result.totalRows, chunk, ignoreEmptyStrings);
	                result.totalRows = numRows;
	                progressCallback?.({
	                    bytesProcessed: byteCounter.total,
	                    docsProcessed: result.totalRows,
	                });
	            }
	            ++numRows;
	            callback();
	        },
	    });
	    try {
	        await (0, promises_1.pipeline)([
	            input,
	            new utf8_validator_1.Utf8Validator(),
	            byteCounter,
	            (0, strip_bom_stream_1.default)(),
	            parseStream,
	            analyzeStream,
	        ], ...(abortSignal ? [{ signal: abortSignal }] : []));
	    }
	    catch (err) {
	        if (err.code === 'ABORT_ERR') {
	            result.aborted = true;
	        }
	        else {
	            throw err;
	        }
	    }
	    for (const field of Object.values(result.fields)) {
	        field.detected = pickFieldType(field);
	    }
	    return result;
	}
	
	return analyzeCsvFields;
}

var _import;
var hasRequired_import;

function require_import () {
	if (hasRequired_import) return _import;
	hasRequired_import = 1;

	const DataService = requireDataService();
	const { sendError, wrapHandler } = requireErrorHandler();
	const { resolveMongoClient } = requireValidateConnection();
	const { importJSON } = requireImportJson();
	const { guessFileType } = requireGuessFiletype();
	const { importCSV } = requireImportCsv();
	const { listCSVFields } = requireListCsvFields();
	const { analyzeCSVFields } = requireAnalyzeCsvFields();

	async function parseFileUpload(request, reply) {
	  const file = await request.file();
	  if (!file) {
	    sendError(reply, 400, 'No file');
	    return null;
	  }
	  const rawJson = file.fields.json?.value;
	  if (!rawJson) {
	    return { file: file.file, body: null };
	  }
	  try {
	    return { file: file.file, body: JSON.parse(rawJson) };
	  } catch (err) {
	    sendError(reply, 400, 'Invalid JSON body');
	    return null;
	  }
	}

	_import = function importRoutes(fastify, opts, done) {
	  const connectionManager = fastify.connectionManager;

	  fastify.post(
	    '/guess-filetype',
	    { preHandler: fastify.csrfProtection },
	    async (request, reply) => {
	      const file = await request.file();
	      if (!file) return sendError(reply, 400, 'No file');
	      const res = await guessFileType({ input: file.file });
	      reply.send(res);
	    }
	  );

	  fastify.post(
	    '/upload-json',
	    { preHandler: fastify.csrfProtection },
	    wrapHandler(async (request, reply) => {
	      const upload = await parseFileUpload(request, reply);
	      if (!upload) return;
	      const { file, body } = upload;
	      if (!body) return sendError(reply, 400, 'No json body');

	      const mongoClient = await resolveMongoClient(connectionManager, body.connectionId, reply);
	      if (!mongoClient) return;

	      const res = await importJSON({
	        ...body,
	        dataService: new DataService(mongoClient),
	        input: file,
	      });
	      reply.send(res);
	    })
	  );

	  fastify.post(
	    '/upload-csv',
	    { preHandler: fastify.csrfProtection },
	    wrapHandler(async (request, reply) => {
	      const upload = await parseFileUpload(request, reply);
	      if (!upload) return;
	      const { file, body } = upload;
	      if (!body) return sendError(reply, 400, 'No json body');

	      const mongoClient = await resolveMongoClient(connectionManager, body.connectionId, reply);
	      if (!mongoClient) return;

	      const res = await importCSV({
	        ...body,
	        dataService: new DataService(mongoClient),
	        input: file,
	      });
	      reply.send(res);
	    })
	  );

	  fastify.post(
	    '/list-csv-fields',
	    { preHandler: fastify.csrfProtection },
	    wrapHandler(async (request, reply) => {
	      const upload = await parseFileUpload(request, reply);
	      if (!upload) return;
	      const { file, body } = upload;
	      if (!body) return sendError(reply, 400, 'No json body');

	      const res = await listCSVFields({ ...body, input: file });
	      reply.send(res);
	    })
	  );

	  fastify.post(
	    '/analyze-csv-fields',
	    { preHandler: fastify.csrfProtection },
	    wrapHandler(async (request, reply) => {
	      const upload = await parseFileUpload(request, reply);
	      if (!upload) return;
	      const { file, body } = upload;
	      if (!body) return sendError(reply, 400, 'No json body');

	      const res = await analyzeCSVFields({ ...body, input: file });
	      reply.send(res);
	    })
	  );

	  done();
	};
	return _import;
}

var ai;
var hasRequiredAi;

function requireAi () {
	if (hasRequiredAi) return ai;
	hasRequiredAi = 1;

	const { sendError } = requireErrorHandler();
	const { generateQuery, generateAggregation } = requireGenAi();

	function requireGenAI(args) {
	  return async (request, reply) => {
	    if (request.params.projectId !== args.projectId) {
	      return sendError(reply, 400, 'Project ID mismatch');
	    }
	    if (!args.enableGenAiFeatures) {
	      return sendError(reply, 400, 'Gen AI is not enabled');
	    }
	    if (!args.openaiApiKey) {
	      return sendError(reply, 400, 'Missing OpenAI API key');
	    }
	  };
	}

	ai = function aiRoutes(fastify, opts, done) {
	  const args = fastify.args;
	  const preHandler = [fastify.csrfProtection, requireGenAI(args)];

	  fastify.post(
	    '/ai/v1/groups/:projectId/mql-query',
	    { preHandler },
	    async (request, reply) => {
	      try {
	        const query = await generateQuery(args.openaiApiKey, request.body, args);
	        reply.send({ content: { query } });
	      } catch (err) {
	        return sendError(reply, 400, err.message);
	      }
	    }
	  );

	  fastify.post(
	    '/ai/v1/groups/:projectId/mql-aggregation',
	    { preHandler },
	    async (request, reply) => {
	      try {
	        const aggregation = await generateAggregation(args.openaiApiKey, request.body, args);
	        reply.send({ content: { aggregation } });
	      } catch (err) {
	        return sendError(reply, 400, err.message);
	      }
	    }
	  );

	  done();
	};
	return ai;
}

var routes;
var hasRequiredRoutes;

function requireRoutes () {
	if (hasRequiredRoutes) return routes;
	hasRequiredRoutes = 1;

	routes = function routes(fastify, opts, done) {
	  fastify.register(requireSettings());
	  fastify.register(requireConnections());
	  fastify.register(require_export());
	  fastify.register(require_import());
	  fastify.register(requireAi());

	  fastify.setNotFoundHandler((request, reply) => {
	    const csrfToken = reply.generateCsrf();
	    reply.view('index.eta', { csrfToken, appName: fastify.args.appName });
	  });

	  done();
	};
	return routes;
}

var app;
var hasRequiredApp;

function requireApp () {
	if (hasRequiredApp) return app;
	hasRequiredApp = 1;

	const path = require$$3;
	const { Eta } = require$$1$9;
	const NodeCache = require$$2$3;
	const { EXPORT_CACHE_TTL } = requireConstants();
	const { ConnectionManager } = requireConnectionManager();
	const { InMemoryStorage } = requireInMemory();
	const { readCliArgs } = requireCli();
	const { registerAuth } = requireAuth$1();

	const args = readCliArgs();

	// ─── Connection Manager ───
	const storage = new InMemoryStorage();
	const connectionManager = new ConnectionManager(storage, args);

	const exportIds = new NodeCache({ stdTTL: EXPORT_CACHE_TTL });

	const fastify = require$$8$1({ logger: true });

	fastify.decorate('args', args);
	fastify.decorate('exportIds', exportIds);
	fastify.decorate('connectionManager', connectionManager);

	// ─── Core Plugins ───
	fastify.register(require$$9, {
	  engine: { eta: new Eta() },
	  root: path.join(__dirname),
	});

	fastify.register(require$$10, {
	  root: path.join(__dirname, 'static'),
	  prefix: '/static/',
	  decorateReply: false,
	});

	// Serve dist files (compass.js, images, favicon)
	fastify.register(require$$10, {
	  root: __dirname,
	  prefix: '/',
	  serve: false,
	  decorateReply: true,
	});

	// Explicit routes for dist assets
	fastify.get('/compass.js', (req, reply) => reply.sendFile('compass.js'));
	fastify.get('/compass.js.LICENSE.txt', (req, reply) => reply.sendFile('compass.js.LICENSE.txt'));
	fastify.get('/favicon.svg', (req, reply) => reply.sendFile('favicon.svg'));
	fastify.get('/680f69f3c2e6b90c1812.png', (req, reply) => reply.sendFile('680f69f3c2e6b90c1812.png'));
	fastify.get('/7ea3a6d428136b87ab95.png', (req, reply) => reply.sendFile('7ea3a6d428136b87ab95.png'));
	fastify.get('/a4e0eb7ad904a4858361.svg', (req, reply) => reply.sendFile('a4e0eb7ad904a4858361.svg'));

	fastify.register(require$$11);
	fastify.register(require$$12);
	fastify.register(require$$13);

	// ─── Security ───
	fastify.register(require$$14, {
	  contentSecurityPolicy: {
	    directives: {
	      defaultSrc: ["'self'"],
	      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
	      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.cdnfonts.com"],
	      connectSrc: ["'self'", "wss:", "ws:", "https:"],
	      imgSrc: ["'self'", "data:", "blob:"],
	      fontSrc: ["'self'", "https://fonts.cdnfonts.com", "data:"],
	      workerSrc: ["'self'", "blob:"],
	    },
	  },
	});

	fastify.register(require$$15, {
	  max: 100,
	  timeWindow: '1 minute',
	  keyGenerator: (request) => request.ip,
	});

	fastify.register(require$$16, {
	  getToken: (req) => req.headers['csrf-token'],
	  sessionPlugin: '@fastify/cookie',
	});

	fastify.register(require$$17);

	// ─── Authentication ───
	registerAuth(fastify);

	// ─── Routes ───
	fastify.after(() => {
	  // Auth routes (login, setup, admin API)
	  fastify.register(requireAuth());

	  // Page routes
	  fastify.get('/login', (request, reply) => {
	    reply.view('login.eta', { appName: args.appName });
	  });

	  fastify.get('/setup', (request, reply) => {
	    reply.view('setup.eta', { appName: args.appName });
	  });

	  fastify.get('/admin', (request, reply) => {
	    if (!request.user || request.user.role !== 'admin') {
	      return reply.redirect('/');
	    }
	    reply.view('admin.eta', { appName: args.appName });
	  });

	  // WebSocket proxy
	  fastify.register(requireWs());

	  // API routes
	  fastify.register(requireRoutes());
	});

	app = fastify;
	return app;
}

var hasRequiredServer;

function requireServer () {
	if (hasRequiredServer) return server$1;
	hasRequiredServer = 1;

	const fastify = requireApp();

	const args = fastify.args;

	/** * @type {import('node-cache')}*/
	const exportIds = fastify.exportIds;

	/** * @type {import('./connection-manager').ConnectionManager} */
	const connectionManager = fastify.connectionManager;
	const { closeDb, cleanExpiredSessions } = requireDb();
	const { SHUTDOWN_TIMEOUT_MS } = requireConstants();

	let shuttingDown = false;

	fastify.listen({ port: args.port, host: args.host }, (err, address) => {
	  if (err) {
	    console.error(err);
	    process.exit(1);
	  }

	  console.log(`Server is running at ${address}`);

	  // Clean up connections on shutdown
	  const shutdown = async (signal) => {
	    if (shuttingDown) {
	      return;
	    }

	    shuttingDown = true;
	    console.log(`Received ${signal}. Shutting down the server...`);

	    // 10 seconds timeout to shutdown
	    const timeout = setTimeout(() => {
	      console.error('Forcefully shutting down after 10 seconds.');
	      process.exit(1);
	    }, SHUTDOWN_TIMEOUT_MS);

	    try {
	      await connectionManager.close();
	      await fastify.close();
	      exportIds.close();
	      closeDb();
	      console.log('Server closed successfully.');
	    } catch (shutdownError) {
	      console.error('Error during server shutdown:', shutdownError);
	    } finally {
	      clearTimeout(timeout);
	      process.exit();
	    }
	  };

	  for (const signal of ['SIGINT', 'SIGTERM']) {
	    process.once(signal, () => shutdown(signal));
	  }
	});
	return server$1;
}

var serverExports = requireServer();
var server = /*@__PURE__*/getDefaultExportFromCjs(serverExports);

module.exports = server;
