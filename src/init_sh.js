export default (setup) => `
#!/bin/sh

# Install Deno, the tool that will execute the waasabi-init task list
export DENO_INSTALL=/usr/share/deno
curl -fsSL https://deno.land/x/install/install.sh | sh

ln -s /usr/share/deno/bin/deno /usr/bin/deno

deno run --allow-read --allow-write --allow-run https://waasabi.org/code/init@0.0.5/init.js /root/waasabi-init.yml

`.trim()+'\n';

