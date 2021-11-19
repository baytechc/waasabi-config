#!/bin/sh

/*

# Set system locale
locale-gen --purge "en_US.UTF-8"
#update-locale "LANG=en_US.UTF-8"
#dpkg-reconfigure --frontend noninteractive locales

# Cloud-init replacement
apt-get update -y
apt-get install -y git curl unzip
apt-get upgrade -y

useradd -m -c 'Waasabi Dev Stream Waasabi' -p '$2a$10$UyPQaK.ZnVvXNDhgLV5BM.lhQrrseNHIFILvA/.2ry9ugqp9g0d.G' waasabi

# Install Deno, the tool that will execute the waasabi-init task list
export DENO_INSTALL=/usr/share/deno
curl -fsSL https://deno.land/x/install/install.sh | sh
ln -s /usr/share/deno/bin/deno /usr/bin/deno

# Run installer
NO_COLOR=1 deno run --allow-read --allow-write --allow-run --allow-net --unstable \
  https://waasabi.org/code/init@latest/init.js --debug --verbose \
  /root/deploy.yml 2>&1 | tee /var/log/init.log

*/