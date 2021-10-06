import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input, Password, Select, Toggle } = enquirer;

import { defaults } from '../components/peertube/setup.js';

export default async function() {

  layout`
    ## PeerTube integration

    PeerTube is an open source, federated video sharing application. You can learn more about PeerTube at https://joinpeertube.org.
    
    You may either use an existing account/server on a PeerTube service and connect that to Waasabi, or install PeerTube locally alongside Waasabi to create your own instance dedicated to Waasabi.

    *Please note: currently only local installs are supported*
  `;

  const current = setup.services.peertube?.enabled ?? 'disable'
  const choices = []

  // Configure peertube
  choices.push({
    name: 'local',
    message: `${current == 'local' ? 'Reconfigure':'Install'} local PeerTube instance` 
  });

  if (current != 'connect') {
    choices.push({ name: 'connect', message: '(coming soon) Connect with existing PeerTube server' });
  }
  if (current != 'disable') {
    choices.push({ name: 'disable', message: 'Disable PeerTube integration' });
  }

  choices.push({ name: 'done', message: 'Done' });

  const selection = await (new Select({
    name: 'mode',
    message: 'PeerTube integration:',
    choices,
  })).run();

  if (selection === 'done') return;

  // Disable chat integrations
  if (selection === 'disable') {
    delete setup.services.peertube;
    delete setup.backend.type;
    return;
  }

  // TODO: allow configuring other chat service
  await configure(selection);
}

async function configure(type) {
  const peertube = Object.assign(defaults(), setup.services.peertube);
  setup.services.peertube = peertube;

  if (type == 'local') {
    await configureLocal();

  } else {
    layout`
      /!\ WARNING!

      The non-local setup with an existing PeerTube instance is currently unsupported. The installer will likely break and you will need to manually complete some of the automated steps. Only proceed if you know what you are doing and willing to get your hands dirty.
    `;

    const confirmation = await (new Toggle({
      message: 'I have understood the disclaimer & want to proceed.',
      initial: false,
    })).run();

    if (!confirmation) return;
  }

  // ### Matrix Homeserver config ###
  layout`
    ## PeerTube: Host information

    If you are hosting a local service, these will be used for configuration. If you are connecting to a remote PeerTube instance use the below fields to configure the connection.
  `;

  peertube.host = await (new Input({
    message: 'PeerTube host',
    footer: 'You may expose or connect to a PeerTube instance on a different domain.',
    initial: peertube.host ?? setup.host
  })).run();

  peertube.database = await (new Input({
    message: 'Database',
    footer: 'The name of the database to use for the bot.',
    initial: peertube.database
  })).run();

  layout`
    ## PeerTube: Admin user

    On local instances a new admin user will be created for you for Waasabi streaming. On existing instances, you must create this user yourself and provide the credentials below.
  `; 

  peertube.username = await (new Input({
    message: 'PeerTube admin username',
    footer: '',
    initial: peertube.username
  })).run();
  
  peertube.password = await (new Password({
    message: 'PeerTube admin password',
    footer: 'Leave empty to use the Waasabi admin password.',
    initial: peertube.password
  })).run();

  peertube.enabled = type;
  setup.services.peertube = peertube;
}

async function configureLocal() {
  layout`
    # Configure the local PeerTube instance

    Waasabi will install and configure a self-hosted PeerTube instance to serve as a backend. Below are some configuration options to customize the instance. Most of the time you don't need to change anything here and can just accept the provided defaults.
  `;

  const local = Object.assign({}, setup.services.peertube?.local);

  local.version = await (new Input({
    message: 'PeerTube version',
    footer: 'The version of PeerTube to install. Don\'t change this unless you know what you\'re doing!',
    initial: local.version
  })).run();

  local.bind = await (new Input({
    message: 'PeerTube listen address',
    footer: 'IP address to start listening on for connections.',
    initial: local.bind
  })).run();

  local.port = await (new Input({
    message: 'PeerTube port',
    footer: 'TCP port to listen on internally, will be exposed publicly through a reverse proxy.',
    initial: local.port
  })).run();

  local.homedir = await (new Input({
    message: 'Install dir',
    footer: 'PeerTube will be installed into this directory.',
    initial: local.homedir
  })).run();

  local.systemuser = await (new Input({
    message: 'System user',
    footer: 'The username used by PeerTube and its services, will be created if doesn\'t exist.',
    initial: local.systemuser
  })).run();

  setup.services.peertube.local = local;
}