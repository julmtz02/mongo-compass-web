'use strict';

const yargs = require('yargs');
const { hideBin } = require('yargs/helpers');
const { ConnectionString } = require('mongodb-connection-string-url');
const pkgJson = require('../package.json');
const { AGGREGATION_SYSTEM_PROMPT, QUERY_SYSTEM_PROMPT } = require('./gen-ai');

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
      default: 'localhost',
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
    const crypto = require('crypto');
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

module.exports = { readCliArgs };
