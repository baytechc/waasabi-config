import websiteconfigjs from '../livepage_website_config.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring the Waasabi Livepage…`;

  const run = [];

  // In the Waasabi livepage directory
  run.push([ '@dir:'+setup.ui_dir ]);

  // Create a Waasabi server configuration files
  run.push([
    '@as:waasabi',
    `@writefile:${setup.ui_config}`,
    websiteconfigjs(setup),
  ]);

  run.push([
    '@as:waasabi',
    'npm',
    'run',
    'build',
    setup.prod ? '' :'--no-optimization'
  ]);

  return { name, desc, run, success: `Waasabi Livepage published` };
}
