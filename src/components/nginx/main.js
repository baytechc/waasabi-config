import { componentName, loadTemplates } from '../_helpers.js';
import { hooks } from '../../init/components.js';

const templates = loadTemplates(
  new URL('nginx.conf', import.meta.url),
);

export default {
  inits: [],
  tasks: [ maintask ],
  templates,
  hooks: [],
}

export function maintask(setup, hooks) {
  const name = componentName(import.meta.url);
  const desc = `Configuring Nginx…`;

  const run = [];

  // Install Nginx
  run.push([
    '@ospkg',
    'nginx'
  ]);

  // Generate reverse-proxy configuration and overwrite default host config
  run.push([
    '@writefile:/etc/nginx/sites-available/default',
    templates['nginx.conf'].template(setup, hooks)
  ]);
  
  // Reload Nginx
  run.push([
    'nginx',
    '-s',
    'reload',
  ]);

  return { name, desc, run, success: `Nginx reverse proxy for ${setup.host} enabled` };
}





