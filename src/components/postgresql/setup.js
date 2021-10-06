import password from 'secure-random-password';
import { createHash } from 'crypto';

export function newPassword(opts = { length: 15 }) {
  return password.randomPassword(opts);
}

export function md5Password(password, username='waasabi') {
  if (password === undefined) throw new Error('Empty password supplied.');

  return createHash('md5').update(password + username).digest('hex');
}

// Default configuration
export function defaults(setup) {
  console.log('Initializing PostgreSQL configuration…')
  const config = {
    enabled: true,
    host: '127.0.0.1',
    port: '5432',
    database: 'waasabi',
    username: 'waasabi',
    password: newPassword(),
  };

  if (setup) setup.services.postgresql = config;
  return config;
}

