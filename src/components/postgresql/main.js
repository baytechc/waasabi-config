import { defaults, md5Password } from './setup.js';


export function maintask(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring PostgreSQL…`;


  if (setup.services.postgresql) {
    const run = [];

    // Postgres configuration
    const {
      database,
      username,
      password,
    } = setup.services.postgresql;

    // Install Postgres components
    run.push([
      '@ospkg',
      'postgresql',
      'postgresql-contrib',
    ]);

    // Start the Postgres server
    run.push([
      'pg_ctlcluster',
      '12',
      'main',
      'start',
    ]);
    run.push([
      'sleep',
      5
    ])

    // sudo -u postgres psql -c "SQL"
    run.push([ '@dir:/' ]) // avoids directory permission errors of /root
    run.push([
      '@as:postgres',
      'psql',
      '-c', `CREATE ROLE ${username} PASSWORD 'md5${md5Password(password,username)}' INHERIT LOGIN;`,
    ]);
    run.push([
      '@as:postgres',
      'createdb',
      '-O', 'waasabi',
      '-E', 'UTF8',
      '-T', 'template0',
      database
    ])

    return { name, desc, run, success: `PostgreSQL server deployed.` }
  }

  return { name, desc, skip: `PostgreSQL installation is not requested, skipping` }
}

export default {
  inits: [ defaults ],
  tasks: [ maintask ],
  hooks: [],
}
