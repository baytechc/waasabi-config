export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing Node.js…`;

  const run = [];

  // Install the NodeSource distribution sources for the Node.js LTS
  run.push([
    '@pipe:bash -',
    'curl',
    '-fsSL',
    'https://deb.nodesource.com/setup_lts.x',
  ]);

  // Install Node.js
  run.push([
    'apt-get',
    'install',
    '-y',
    'nodejs'
  ]);

  return { name, desc, run, success: `Node.js enabled` };
}
