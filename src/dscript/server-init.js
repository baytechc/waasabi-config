export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing dependencies & building Waasabi server…`;

  const run = [];

  // In the Waasabi server directory
  run.push([ '@dir:/home/waasabi/'+setup.app ]);

  // if (!setup.mode == 'develop') {...}
  // Install dependencies
  run.push([
    '@as:waasabi',
    'npm',
    'install',
  ]);

  run.push([
    '@as:waasabi',
    'npm',
    'dedupe',
  ]);

  run.push([
    '@as:waasabi',
    'npx',
    'strapi',
    'build',
    setup.prod ? '' :'--no-optimization'
  ]);

  return { name, desc, run, success: `Server ready to start` };
}
