import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import { md5, randomPassword } from '../utils.js';

import enquirer from 'enquirer';
const { Input, Password, Select  } = enquirer;


export default async function() {

  layout(`
    ## Components: Chat integration

    Please select and configure any chat integrations that you would like to enable for this Waasabi instance.
  `);

  const selection = await (new Select({
    name: 'mode',
    message: 'How should the database be deployed?',
    choices: [
      { name: 'matrixbot', message: 'Enable Matrix chat integration' },
      { name: 'disable', message: 'Disable all chat integrations' },
      { name: 'done', message: 'Done' },
    ]
  })).run();

  if (selection === 'done') return;

  // Disable chat integrations
  if (selection === 'disable') {
    delete setup.services.matrix;
    return;
  }

  // TODO: allow configuring other chat service
  await matrixSetup();
}

async function matrixSetup() {
  const matrix = Object.assign({}, setup.services.matrix);

  layout(`
    # Set up Matrix chat integration

    Please configure the details of the Matrix server and waasabi-matrix bot below:
  `);

  // ### Matrix Homeserver config ###
  layout(`
    ## Matrix Chat: Homeserver information
  `);

  matrix.homeserver = await (new Input({
    footer: 'The URL of the Matrix homeserver which hosts the /_matrix/ API the bot will use.',
    message: 'Homeserver',
    initial: matrix.homeserver
  })).run();

  //TODO: matrix.link?
  //TODO: matrix.client?


  // ### Matrix Backend config ###
  matrix.backend = matrix.backend ?? {};

  // setup.backend.url?
  matrix.backend.host = matrix.backend.host ?? 'http://127.0.0.1:1337/waasabi/';
  matrix.backend.endpoint = matrix.backend.endpoint ?? 'event-manager/integrations';

  layout(`
    ## Matrix Chat: Backend configuration
  `);

  matrix.backend.host = await (new Input({
    footer: 'The URL of the Strapi backend (most of the time you want to leave this as the default).',
    message: 'Backend host',
    initial: matrix.backend.host
  })).run();

  matrix.backend.endpoint = await (new Input({
    footer: 'The integrations endpoint of the Strapi backend (most of the time you want to leave this as the default).',
    message: 'Backend endpoint',
    initial: matrix.backend.endpoint
  })).run();

  matrix.backend.username = await (new Input({
    footer: 'Strapi API username for the bot (unless you changed this, it should be "matrixbot").',
    message: 'Backend username',
    initial: matrix.backend.username ?? 'matrixbot'
  })).run();
  
  matrix.backend.password = await (new Password({
    footer: 'The bot\'s password to the Strapi backend (leave it empty to auto-generate a secure password).',
    message: 'Backend password',
    initial: matrix.backend.password
  })).run();

  if (!matrix.backend.password) matrix.backend.password = randomPassword();


  // ### Matrix Bot config ###
  matrix.bot = matrix.bot ?? {};
  matrix.bot.version = matrix.bot.version ?? Setup.DEFAULT_MATRIXBOT_VERSION;
  matrix.bot.dir = matrix.bot.dir ?? '/home/waasabi/matrixbot';

  layout(`
    ## Matrix Chat: Bot configuration
  `); 

  matrix.bot.username = await (new Input({
    footer: 'The fully qualified Matrix ID (username) of the bot account to log into the homeserver.',
    message: 'Bot Matrix username',
    initial: matrix.bot.username
  })).run();
  
  matrix.bot.password = await (new Password({
    footer: 'The password of the bot\'s Matrix user account on the homeserver.',
    message: 'Bot Matrix password',
    initial: matrix.bot.password
  })).run();

  matrix.bot.apikey = await (new Password({
    footer: 'The API key for sending commands to the bot (leave it empty to auto-generate a secure API key).',
    message: 'Bot API key',
    initial: matrix.bot.apikey
  })).run();

  if (!matrix.bot.apikey) matrix.bot.apikey = md5(passwd);

  const botadmins = await (new Input({
    footer: 'A comma-separated list of @matrix:usernam.es of users who are allowed to control the bot.',
    message: 'Bot admins',
    initial: (matrix.bot.admins || []).join(', ')
  })).run();

  matrix.bot.admins = botadmins.split(',').map(r => r.trim());

  setup.services.matrix = matrix;
}