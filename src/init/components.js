import metadata from '../components/metadata.js';
import startup from '../components/startup.js';

import server from '../components/server.js';
// TODO: move subcomponents under the main component
import serverConfig from '../components/server-config.js';
import serverInit from '../components/server-init.js';
import serverStart from '../components/server-start.js';

import nginx from '../components/nginx/main.js';
import letsencrypt from '../components/letsencrypt/letsencrypt.js';
import postgresql from '../components/postgresql/main.js';
import nodejs from '../components/nodejs.js';
import yarn from '../components/yarn.js';
import pm2 from '../components/pm2.js';
import livepageDefault from '../components/livepage/default.js';
import livepageDefaultCfg from '../components/livepage/default-config.js';
import serverDbinit from '../components/server-dbinit.js';
import chat from '../components/chat/chat.js';
import redis from '../components/redis/main.js';
import peertube from '../components/peertube/main.js';

// TODO: make this resolve automatically via before/after dependencies
const components = [
  metadata,
  startup,
  nginx,
  letsencrypt,
  postgresql,
  nodejs,
  yarn,
  pm2,
  server,
  serverConfig,
  serverInit,
  serverStart,
  livepageDefault,
  livepageDefaultCfg,
  serverDbinit,
  chat,
  redis,
  peertube,
];

// Allows for pulling (potentially multiple) components from the
// 'config' key of the main component object, or falls back to
// using the main component itself it it is not component-object-aware
export const configurators = components.flatMap( c => 'tasks' in c ? c.tasks : [c] );
// TODO: the above works when component tasks are running in one
// group but when they aere separated (see serverDbinit) tasks
// must have a before/after constraints, the handling of which is
// not yet implemented

// TODO: automate
export const initializers = components.flatMap(
  c => 'inits' in c ? c.inits : []
);

// The collection of all hooks and different hook targets
const hookEntries = components.flatMap(c => c.hooks).filter(c => !!c)
const hookTypes = Array.from(new Set( hookEntries.map(c => c?.target).filter(c => !!c) ));

export const hooks = Object.fromEntries( hookTypes.map(t => [t,hookEntries.filter(e => e.target == t)]) );
