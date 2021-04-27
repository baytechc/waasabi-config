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

  // Temporary patch to allow moving Strapi entirely behind the /waasabi path prefix
  // See https://gist.github.com/flaki/7db47d57fec5234479659b24e877188a for details
  run.push([
    '@as:waasabi',
    'curl',
    '-fsSL',
    'https://gist.githubusercontent.com/flaki/7db47d57fec5234479659b24e877188a/raw/b8ae09507d013147dd5594e0983f6bb0aaa0edd3/index.js',
    '-o',
    './node_modules/strapi/lib/middlewares/router/index.js'
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
