import generateNginxConfig from '../nginx_config.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring Nginx…`;

  const run = [];

  // Generate reverse-proxy configuration and overwrite default host config
  run.push([
    '@writefile:/etc/nginx/sites-available/default',
    generateNginxConfig(setup)
  ]);
  
  // Reload Nginx
  run.push([
    'nginx',
    '-s',
    'reload',
  ]);

  return { name, desc, run, success: `Nginx reverse proxy for ${setup.host} enabled` };
}





