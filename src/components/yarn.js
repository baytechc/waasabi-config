export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Installing Yarn…`;

  const run = [];

  // Install the GPG keys of Yarn's Debian repository
  run.push([
    '@https://dl.yarnpkg.com/debian/pubkey.gpg',
    '@pipe:gpg --yes --dearmor -o /usr/share/keyrings/yarnkey.gpg',
  ]);

  // Configure the APT source for Yarn
  run.push([
    '@writefile:/etc/apt/sources.list.d/yarn.list',
    `deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian stable main`,
  ])

  // Install Yarn
  run.push([ '@ospkg', 'yarn' ])

  return { name, desc, run, success: `Yarn installed` };
}
