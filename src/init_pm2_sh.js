export default (setup) => `
echo -n 'Installing PM2... ' >> /var/log/waasabi_init.log

npm install pm2 -g
env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u waasabi --hp /home/waasabi
systemctl start pm2-waasabi

echo '\u2713  DONE' >> /var/log/waasabi_init.log
`