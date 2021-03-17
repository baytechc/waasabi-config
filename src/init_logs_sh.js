export default (setup) => `
sudo touch /var/log/waasabi_init.log
sudo chown ubuntu /var/log/waasabi_init.log

echo 'Waasabi setup started' >> /var/log/waasabi_init.log
`
