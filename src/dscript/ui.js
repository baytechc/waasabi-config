`

# Install live page that will be served at the host root
echo -n 'Generating live page... ' >> /var/log/waasabi_init.log

sudo -u waasabi bash -c '
  cd ~/
  # TODO: make the clone source configurable
  git clone https://github.com/baytechc/waasabi-live.git live
'

echo '\\u2713  DONE' >> /var/log/waasabi_init.log

`