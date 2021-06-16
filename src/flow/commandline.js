import * as VM from '../init/vm.js';

import enquirer from 'enquirer';
const { Input } = enquirer;

import { layout } from '../init/content-formatter.js';


export default async function() {
  layout(`
  ## Waasabi commandline

  You can control the development instance using the Waasabi commandline. Type "exit" to stop. Type "help" to learn about the other commands.
  `);

  while (true) {
    let command;

    try {
      command = await (new Input({
        message: '$>',
      })).run();  
    }
    catch (e) {
      // Enquirer throws when it detects Ctrl+C
      console.log('Please type `exit` and press Enter to exit the Waasabi commandline!');
    }

    // Exit Waasabi commandline
    if (command === 'q' || command === 'exit') {
      process.exit(0);
    }

    // Restart backend
    if (command === 'r') {
      await VM.restartBackend();
    }
  }
}