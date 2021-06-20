import bcrypt from 'bcryptjs';

export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Initializing Waasabi backend database…`;

  const run = [];

  // Create a new Admin user with the supplied password
  if (setup.services.postgresql) {
    const f = {
      firstname: `'Waasabi'`,
      lastname: `'Admin'`,
      username: `'admin'`,
      email: `'${setup.admin_email}'`,
      password: `'${bcrypt.hashSync(setup.admin_password, 10)}'`,
      isActive: `TRUE`,
    };

    // Execute the query on the Waasabi database to add an admin user
    run.push([
      '@as:waasabi',
      'psql',
      '-d', 'waasabi',
      '-c',
      `INSERT INTO strapi_administrator ("${
        Object.keys(f).join('","')
      }") VALUES (${
        Object.values(f).join(',')
      });`,
    ]);

    // Make the newly created user a super-admin
    run.push([
      '@as:waasabi',
      'psql',
      '-d', 'waasabi',
      '-c',
      `INSERT INTO "strapi_users_roles" ("user_id","role_id") VALUES (
(SELECT id FROM "strapi_administrator" WHERE username='admin'),
(SELECT id FROM "strapi_role" WHERE code='strapi-super-admin'));`,
    ]);
  }

  return { name, desc, run, success: `Backend database initialized` };
}
