import * as Setup from './src/init/setup.js';

import start from './src/flow/start.js';
import { configNew } from './src/flow/config.js';
import actionsMenu from './src/flow/actions.js';

(async () => {
  let selectedConfig = await start();

  // No existing config, or creating a new
  if (selectedConfig === 'new') {

    await configNew();
  
  // Load an existing config
  } else {

    await Setup.restore(Setup.configfile(selectedConfig));

  }

  // Select action
  const mode = await actionsMenu();

  // Exit
  if (mode === 'exit') {
    return;
  }

})().catch(console.error);
