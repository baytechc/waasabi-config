export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing the Waasabi Live UI…`;

  const run = [];

  // In the Waasabi user home
  run.push([ '@dir:/home/waasabi' ]);

  // Download livepage that will be served at the host root
  run.push([
    '@as:waasabi',
    // TODO: move this to the next command and pipe into that for clarity
    // TODO: ownership doesn't apply for the piped command
    `@pipe:tar -xvz --one-top-level=${setup.ui_dir} --strip-components=1`,
    /* extracts the tar.gz into the 'live' stripping the top folder path */
    'curl',
    '-fsSL',
    `https://github.com/baytechc/waasabi-live/archive/refs/tags/${setup.ui_version}.tar.gz`,
  ]);
  // TODO: Temporary fix for livepage folder ownership
  // Moving the tar command serially to next-command-pipe should make this unneccessary
  run.push([
    'chown',
    '-R',
    'waasabi:waasabi',
    'live'
  ]);

  // Install livepage dependencies
  run.push([
    `@dir:${setup.ui_dir}`,
    '@as:waasabi',
    'npm',
    'install',
  ]);

  return { name, desc, run, success: `Waasabi livepage deployed` };
}
