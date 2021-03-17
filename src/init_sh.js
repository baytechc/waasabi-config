export default (setup) => `
# Waasabi setup
/root/init_logs.sh


echo -n 'Configuring LetsEncrypt... ' >> /var/log/waasabi_init.log

# Certbot (generate LetsEncrypt SSL certificate)
${setup.prod ? '#' :''}certbot -n --nginx -d ${setup.host} --agree-tos --redirect -m ${setup.admin_email}

echo '\u2713  DONE' >> /var/log/waasabi_init.log


# Install PM2
/root/init_pm2.sh


# Create a Waasabi instance from the Strapi template
echo -n 'Generating backend... ' >> /var/log/waasabi_init.log

sudo -u waasabi bash -c '
  cd ~/
  npx create-strapi-app${setup.strapiVersion} ${setup.app} --template baytechc/waasabi --no-run --quickstart
'

echo '\u2713  DONE' >> /var/log/waasabi_init.log


# Configure backend
/root/init_backend_config.sh


# Install live page that will be served at the host root
echo -n 'Generating live page... ' >> /var/log/waasabi_init.log

sudo -u waasabi bash -c '
  cd ~/
  # TODO: make the clone source configurable
  git clone https://github.com/baytechc/waasabi-live.git live
'

echo '\u2713  DONE' >> /var/log/waasabi_init.log


# Configure live page
/root/init_livepage_config.sh


#TODO: matrix bot


echo '\u2713  Waasabi initialization complete' >> /var/log/waasabi_init.log


`.trim()+'\n';