import fs from 'fs';
import setup, * as Setup from '../init/setup.js';

import { layout } from '../init/content-formatter.js';

import { generateYaml as generateCloudInitYml } from '../cloud_init.js';
import { generateYaml as generateWaasabiInitYml } from '../waasabi_init.js';


// Dump configuration and exit
export default async function() {
  setup.prod = true;

  //TODO: switch backend urls to the production ones

  // Cloud Init YAML
  await fs.promises.writeFile(
    new URL(`${Setup.instancedir()}/cloud-init.yml`, import.meta.url),
    await generateCloudInitYml(setup)
  );

  const waasabiInitYaml = generateWaasabiInitYml(setup);
  
  // Waasabi Init YAML
  await fs.promises.writeFile(
    new URL(`${Setup.instancedir()}/waasabi-init.yml`, import.meta.url),
    waasabiInitYaml
  );

  // TODO: configure Mux webhooks
  layout(`
    ## Manual configuration

    You will find your \`cloud-init\` configuration file in:

    \`./${Setup.instancedir()}/cloud-init.yml\`

    You can use it to configure any cloud provider that supports cloud-init, or by using cloud-init manually on your deployment server.
  `);

  process.exit(0);
}
