import password from 'secure-random-password';
import { createHash } from 'crypto';


export function randomPassword(opts = 15) {
  if (typeof opts == 'number') opts = { length: opts};

  return password.randomPassword(opts);
}

export function md5(string) {
  return createHash('md5').update(string).digest('hex');
}
