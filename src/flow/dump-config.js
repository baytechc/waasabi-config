import setup, * as Setup from '../init/setup.js';
import { clear, pause } from '../init/content-formatter.js';


// Dump configuration and exit
export default async function() {
  clear();

  console.log(setup);

  await pause();
}
