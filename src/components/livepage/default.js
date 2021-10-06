export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing the Waasabi Live UI…`;

  const run = [];

  // In the Waasabi user home
  run.push([ '@dir:/home/waasabi' ]);

  // Download livepage that will be served at the host root
  run.push([
    '@as:waasabi',
    `@https://github.com/baytechc/waasabi-live/archive/refs/tags/${setup.ui_version}.tar.gz`,
    '@extract:'+setup.ui_dir,
     ])

  // Install livepage dependencies
  run.push([
    `@dir:${setup.ui_dir}`,
    '@as:waasabi',
    'npm',
    'install',
  ]);

  return { name, desc, run, success: `Waasabi livepage deployed` };
}
