import { inspect } from 'util';

import setup, * as Setup from '../init/setup.js';
import { clear, pause } from '../init/content-formatter.js';


// Dump configuration and exit
export default async function() {
  clear();

  // Recurse JSON object to unfold all depths
  console.log( inspect(setup, { depth: null, colors: true }) );

  await pause();
}
