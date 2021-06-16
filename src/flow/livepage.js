import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input, Toggle } = enquirer;


export default async function() {

  layout(`## Livestream UI configuration
  
  Please note: more customization options are available from the Waasabi administration interface.`);

  //TODO: allow completely replacing the UI with arbitrary code

  setup.ui_version = await (new Input({
    name: 'ui_version',
    footer: 'Livestream UI version to use.',
    message: 'UI version',
    initial: setup.ui_version
  })).run();

  const branding = await (new Toggle({
    message: 'Custom branding/theme?',
    initial: Boolean(setup.ui_brand),
  })).run();

  if (branding) {
    layout(`## Custom branding`);

    setup.branding = await (new Input({
      name: 'domain',
      footer: `Enter the branding URL. It's a publicly accessible url of a .tgz or .zip.`,
      message: 'Domain name',
      initial: setup.branding ?? 'http://example.com/branding.zip'
    })).run();
  
  }

}
