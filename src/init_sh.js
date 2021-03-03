import middlewarejs from './strapi_config_middleware.js';
import serverjs from './strapi_config_server.js';
import pm2config from './pm2_config.js';
import websiteconfigjs from './live_website_config.js';

const b64 = str => `echo "${Buffer.from(str).toString('base64')}" | base64 -d`;

export default (setup) => `
# Waasabi setup

# Certbot (generate LetsEncrypt SSL certificate)
# Uncomment when publishing into production!
# certbot -n --nginx -d ${setup.host} --agree-tos --redirect -m ${setup.admin_email}

# Install PM2
npm install pm2 -g
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u waasabi --hp /home/waasabi
systemctl start pm2-waasabi

# Create a Waasabi instance from the Strapi template
echo 'Creating new Waasabi instance'
sudo -u waasabi bash -c '
  cd ~/
  npx create-strapi-app${setup.strapiVersion} ${setup.app} --template flaki/waasabi --no-run --quickstart
  cd ${setup.app}
  npm install
  npm dedupe
'

# Strapi config & daemonize through PM2
echo 'Configuring Waasabi instance'
sudo -u waasabi bash -c '
  cd ~/${setup.app}
  ${b64(middlewarejs())} > config/middleware.js
  ${b64(serverjs())} > config/server.js
  echo "" > ".env"
  # the user must exist first
  # npx strapi admin:reset-user-password --email=${setup.admin_email} --password=${setup.admin_password}
  npx strapi build

  ${b64(pm2config())} > pm2.yaml
  pm2 start pm2.yaml --env=production
  pm2 save
'

# Install live page that will be served at the host root
sudo -u waasabi bash -c '
  cd ~/
  # TODO: make the clone source configurable
  git clone https://github.com/flaki/waasabi-live.git live
  cd live

  # TODO: figure out the best place to update the config
  ${b64(websiteconfigjs(setup))} > website.config.js

  # Generate the site
  npm install && npm run build
'

#TODO: matrix bot

`.trim()+'\n';