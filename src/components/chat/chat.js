import bcrypt from 'bcryptjs';

import matrixbotconfig from './matrix_config_toml.js';
import matrixbotpm2 from './matrix_pm2_config.js';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring the Waasabi chat integrations…`;

  const run = [];

  // Create a new Admin user with the supplied password
  if (setup.services.matrix) {
    run.push(...integrateMatrixChat(setup));
  }

  return { name, desc, run, success: `Waasabi chat integration configured` };
}

function integrateMatrixChat(setup) {
  const { matrix } = setup.services;
  const run = [];

  const f = {
    username: `'${matrix.backend.username}'`,
    email: `'waasabi-matrixbot@${setup.host}'`,
    provider: `'local'`,
    password: `'${bcrypt.hashSync(matrix.backend.password, 10)}'`,
    confirmed: `TRUE`,
    role: `(SELECT id FROM "users-permissions_role" WHERE type='integrations')`,
  };

  // Execute the query on the Waasabi database to add an admin user
  run.push([
    '@as:waasabi',
    'psql',
    '-d', 'waasabi',
    '-c',
    `INSERT INTO "users-permissions_user" ("${
      Object.keys(f).join('","')
    }") VALUES (${
      Object.values(f).join(',')
    });`,
  ]);

  // Create home folder for the bot and install the binary
  run.push([
    '@as:waasabi',
    'mkdir',
    '-p',
    matrix.bot.dir
  ]);

  run.push([
    '@as:waasabi',
    // TODO: move this to the next command and pipe into that for clarity
    // TODO: ownership doesn't apply for the piped command
    `@pipe:tar -xz -C /home/waasabi/matrixbot`,
    /* extracts the tar.gz into the 'live' stripping the top folder path */
    'curl',
    '-fsSL',
    `https://github.com/baytechc/waasabi-matrix/releases/download/${matrix.bot.version}/waasabi-matrix-${matrix.bot.version}-x86_64-unknown-linux-gnu.tar.gz`,
  ]);

  // Switch to the bot directory
  run.push([ '@dir:'+matrix.bot.dir ]);

  // Write Waasabi Matrix Bot config file
  run.push([
    '@as:waasabi',
    '@writefile:config.toml',
    matrixbotconfig(setup),
  ]);

  // Create a Waasabi Matrix Bot PM2 ecosystem file
  run.push([
    '@as:waasabi',
    '@writefile:pm2.yaml',
    matrixbotpm2(setup),
  ]);

  // Start the server
  run.push([
    '@as:waasabi',
    'pm2',
    'start',
    'pm2.yaml',
    '-m', /* output a compacted list without formatting */
  ]);

  run.push([
    '@as:waasabi',
    'pm2',
    'save',
  ]);

  return run;
}