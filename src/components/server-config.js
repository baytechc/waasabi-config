import middlewarejs from '../strapi_config_middleware.js';
import serverjs from '../strapi_config_server.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring the Waasabi server…`;

  const run = [];

  // In the Waasabi server directory
  run.push([ '@dir:'+setup.app_dir ]);

  // Create a Waasabi server configuration files
  run.push([
    '@as:waasabi',
    '@writefile:./config/middleware.js',
    middlewarejs(setup),
  ]);

  run.push([
    '@as:waasabi',
    '@writefile:./config/server.js',
    serverjs(setup),
  ]);

  run.push([
    '@as:waasabi',
    '@writefile:'+setup.app_config,
    //TODO: move this out of here
    [
      `ADMIN_JWT_SECRET=${setup.secret}`,
      `BACKEND_URL=${setup.backend.url ?? 'http://localhost/waasabi/' }`,
      // TODO: only for Mux backends
      `MUX_WEBHOOK_SECRET=${setup.backend.webhook_secret}`,
    ].join('\n'),
  ]);

  return { name, desc, run, success: `Waasabi server configuration saved` };
}

