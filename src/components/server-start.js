import pm2config from '../pm2_config.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Starting Waasabi server…`;

  const run = [];

  // In the Waasabi server directory
  run.push([ '@dir:'+setup.app_dir ]);

  // Create a Waasabi server PM2 ecosystem file
  run.push([
    '@as:waasabi',
    '@writefile:pm2.yaml',
    pm2config(setup),
  ]);

  // Start the server
  run.push([
    '@as:waasabi',
    'pm2',
    'start',
    'pm2.yaml',
    '--env=production',
    '-m', /* output a compacted list without formatting */
  ]);

  run.push([
    '@as:waasabi',
    'pm2',
    'save',
  ]);

  return { name, desc, run, success: `Server started` };
}
