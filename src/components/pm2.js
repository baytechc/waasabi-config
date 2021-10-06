export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing PM2…`;

  const run = [];

  // Install the pm2 executable
  run.push([
    'npm',
    'install',
    '-g', /* install as globally accessible tool */
    'pm2',
  ]);

  // Generate pm2 system startup script
  run.push([
    'pm2',
    'startup',
    'systemd',
    '-u',
    'waasabi',
    '--hp',
    '/home/waasabi',
  ]);

  // Enable pm2 on system startup
  run.push([
    'systemctl',
    'start',
    'pm2-waasabi'
  ])

  return { name, desc, run, success: `PM2 enabled` };
}
