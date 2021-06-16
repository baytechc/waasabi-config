import * as Setup from '../init/setup.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing the Waasabi server, powered by Strapi…`;

  const run = [];

  // In the Waasabi user home
  run.push([ '@dir:/home/waasabi' ]);

  // Canonicalize older config versions
  if (setup.strapiVersion) {
    if (!setup.strapi_version) setup.strapi_version = setup.strapiVersion;
    delete setup.strapiVersion;
    Setup.persist();
  }
  if (setup.strapi_version.startsWith('@')) {
    setup.strapi_version = setup.strapi_version.substr(1);
  }

  // Create a Waasabi server instance from the Strapi template
  run.push([
    '@as:waasabi',
    'npx',
    'create-strapi-app@'+(setup.strapi_version || 'latest'), /* install specific Strapi version */
    setup.app, /* the name of the directory to create the server in */
    '--template',
    'https://github.com/baytechc/strapi-template-waasabi', /* the Waasabi server template */
    '--no-run',
    '--quickstart',
  ]);

  return { name, desc, run, success: `Waasabi server installed` };
}
