export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing Node.js…`;

  const run = [];

  // Install the NodeSource distribution sources for the Node.js LTS
  run.push([
    '@https://deb.nodesource.com/setup_lts.x',
    '@pipe:bash -',
  ]);

  // Install Node.js
  run.push([ '@ospkg', 'nodejs' ]);

  return { name, desc, run, success: `Node.js enabled` };
}
