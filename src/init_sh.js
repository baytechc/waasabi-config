export default (setup) => `
#!/bin/sh

# Install Deno, the tool that will execute the waasabi-init task list
export DENO_INSTALL=/usr/share/deno
curl -fsSL https://deno.land/x/install/install.sh | sh

ln -s /usr/share/deno/bin/deno /usr/bin/deno

deno run --allow-read --allow-write --allow-run --allow-net --unstablecd  \
     https://waasabi.org/code/init@${setup.INITSCRIPT_VERSION ?? 'latest'}/init.js \
     /root/waasabi-init.yml

`.trim()+'\n';
