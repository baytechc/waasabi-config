import setup, * as Setup from '../init/setup.js';
import { em, layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
import configPeertube from './config-peertube.js';
const { Input, Select, Password } = enquirer;


export default async function() {

  layout(`
    ## Streaming backend

    Please choose the video streaming provider you would like to use.
  `);

  const backendOptions = [
    { name: 'Use Mux.com (HLS)', type: 'mux'},
    { name: '(Beta!) Federated video streaming with PeerTube', type: 'peertube' },
    { name: '(coming soon) Personal streaming server with OwnCast', type: 'owncast' },
    { name: '(coming soon) Self-hosted distributed IPFS streaming', type: 'ipfs' },
  ];

  // Mark active option
  backendOptions.forEach(o => {
    if (o.active = (o.type === setup.backend.type)) {
      o.name += ' '+em('ACTIVE');
    }
  });

  // Pull active option to top
  backendOptions.sort((a,b) => b.active - a.active)

  const backendSelection  = await (new Select({
    name: 'backend_type',
    message: 'Select video streaming backend',
    choices: [ ...backendOptions, { name: '-', message: setup.backend.type ? 'Done' : 'Skip' } ]
  })).run();

  if (backendSelection == '-') return;

  const backendType = backendOptions.find(i => i.name===backendSelection).type;
  setup.backend = setup.backend ?? {};
  setup.backend.type = backendType;

  if (backendType === 'mux') {
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

  } else if (backendType === 'peertube') {
    await configPeertube()

  }
}