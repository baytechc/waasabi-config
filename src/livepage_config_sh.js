import b64 from './b64.js';

import websiteconfigjs from './components/livepage/livepage_website_config.js';

export default (setup) => `
echo -n 'Configuring live page... ' >> /var/log/waasabi_init.log

# Configure live page
sudo -u waasabi bash -c '
  cd ~/live

  # TODO: figure out the best place to update the config
  ${b64(websiteconfigjs(setup))} > website.config.js

  # Generate the site
  ${setup.mode=='develop'?'#':''}npm install
  npm run build
'

echo '\u2713  DONE' >> /var/log/waasabi_init.log
`;
