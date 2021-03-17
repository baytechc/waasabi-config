import b64 from './b64.js';

import middlewarejs from './strapi_config_middleware.js';
import serverjs from './strapi_config_server.js';
import pm2config from './pm2_config.js';

export default (setup) => `
# Strapi config & daemonize through PM2
echo -n 'Configuring backend... ' >> /var/log/waasabi_init.log

echo 'Configuring Waasabi instance'
sudo -u waasabi bash -c '
  cd ~/${setup.app}

  ${b64(middlewarejs(setup))} > config/middleware.js
  ${b64(serverjs(setup))} > config/server.js

  echo "" > ".env"
  echo "ADMIN_JWT_SECRET=${setup.secret}" >> ".env"
  echo "BACKEND_URL=${setup.backend.url}" >> ".env"
  echo "MUX_WEBHOOK_SECRET=${setup.backend.webhook_secret}" >> ".env"

  # install strapi and dependencies
  ${setup.mode=='develop'?'#':''}npm install && npm dedupe

  # npx strapi admin:reset-user-password --email=${setup.admin_email} --password=${setup.admin_password}
  npx strapi build ${setup.prod ? '' :'--no-optimization'}

  ${b64(pm2config(setup))} > pm2.yaml
  pm2 -m start pm2.yaml --env=production
  pm2 save
'

echo '\u2713  DONE' >> /var/log/waasabi_init.log
`;