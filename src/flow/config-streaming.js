import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input, Select, Password } = enquirer;


export default async function() {

  layout(`
    ## Streaming backend

    Please choose the video streaming provider you would like to use.
  `);

  const backend_options = [
    { name: 'Use Mux.com (HLS)', type: 'mux'},
    { name: '(coming soon) Own streaming server with OwnCast', type: 'owncast' },
    { name: '(coming soon) Own federated streaming service with PeerTube', type: 'peertube' },
    { name: '(coming soon) Self-hosted distributed IPFS streaming', type: 'ipfs' },
  ];
  const BACKEND_MUX = 0;
  const BACKEND_WHIP = 1;

  setup.backend = setup.backend ?? {};
  const backend_type  = await (new Select({
    name: 'backend_type',
    message: 'Select video streaming backend',
    choices: [ ...backend_options, { name: '-', message: 'Skip' } ]
  })).run();

  if (backend_type === backend_options[BACKEND_MUX].name) {
    setup.backend.type = backend_options[BACKEND_MUX].type;

    layout(`
      Before you may start using the Mux.com backend you will need to sign up for the service at https://mux.com/.
      Please configure the Access Token & Token Secret below, as provided by Mux.
      
      You can create new credentials at https://dashboard.mux.com/settings/access-tokens
    `);

    try {
      setup.backend.token = await (new Input({
        name: 'backend.mux_token_id',
        message: 'Token ID',
        initial: setup.backend.token
      })).run();

      setup.backend.token_secret = await (new Password({
        name: 'backend.mux_token_secret',
        message: 'Token Secret',
        initial: setup.backend.token_secret
      })).run();
    }
    catch(e) {}
  }
}