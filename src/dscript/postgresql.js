import { md5Password } from '../init/setup_postgresql.js';


export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring PostgreSQL…`;


  if (setup.services?.postgresql) {
    const run = [];

    // Postgres configuration
    const {
      name: database,
      username,
      password,
    } = setup.services.postgresql.config;

    // Install certbot and the --nginx backend
    run.push([
      'apt',
      'install',
      '-y',
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

    // sudo -u postgres psql -c "SQL"
    run.push([
      '@as:postgres',
      'psql',
      '-c', `CREATE ROLE ${username} PASSWORD 'md5${md5Password(password,username)}' INHERIT LOGIN;`,
      '-c', `CREATE DATABASE ${database} OWNER waasabi;`,
      '-c', `CREATE DATABASE ${database}_peertube OWNER waasabi;`,
    ]);

    return { name, desc, run, success: `PostgreSQL server deployed.` }
  }

  return { name, desc, skip: `PostgreSQL installation is not requested, skipping` }
}