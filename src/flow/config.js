import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Select } = enquirer;

import domain from './config-domain.js';
import admin from './config-admin.js';
import content from './config-content.js';
import streaming from './config-streaming.js';
import deployment from './deployment.js';
import livepage from './livepage.js';

const Change = { domain, admin, content, streaming, deployment, livepage };


export async function configNew() {
  await domain();
  await admin();
  await content();
  await streaming();

  await Setup.persist();
}

export async function configChange() {
  // Store so we can clean up the old config dir
  const oldhost = setup.host;

  do {
    layout(`
      # Edit configuration

      Select the configuration options you wish to change. When you have made all the changes, select \`Done\`.
    `);

    const selection = await (new Select({
      name: 'mode',
      message: 'What would you like to change?',
      choices: [
        { name: 'domain', message: 'Domain: '+setup.host },
        { name: 'admin', message: 'Admin details: '+setup.admin_email },
        { name: 'streaming', message: 'Streaming backend: '+setup.backend.type },
        { name: 'livepage', message: 'Streaming UI…' },
        { name: 'content', message: 'Content…' },
        { name: 'database', message: 'Database…' },
        { name: 'chat', message: 'Chat integration…' },
        { name: 'deployment', message: 'Deployment: '+setup.deployment },
        { name: 'done', message: 'Done' },
      ]
    })).run();

    if (selection in Change) await Change[selection]();

    if (selection === 'done') break;
  } while (1);

  // TODO: if setup.host is different then oldhost clean up the old config directory first

  await Setup.persist();
}