import fetch from 'node-fetch';
import YAML from 'yaml';

import generateInitSh from './init_sh.js';
import { generateYaml as generateWaasabiInitYml } from './waasabi_init.js';
import generateNginxConfig from './nginx_config.js';


function defaultUser(setup) {
  const u = {
    name: 'waasabi',
    gecos: `${setup.title} Waasabi`,
    plain_text_passwd: setup.admin_password,
  }

  if (setup.ssh) {
    // TODO:
    u['ssh_authorized_keys'] = "";
  }

  return u;
}

// https://cloudinit.readthedocs.io/en/latest/topics/examples.html#additional-apt-configuration-and-repositories
// https://github.com/nodesource/distributions/blob/master/README.md#manual-installation
async function configurePackages(setup) {
  // Download nodesource GPG signing key
  let gpgkey = await fetch('https://deb.nodesource.com/gpgkey/nodesource.gpg.key').then(r => r.text());

  // Add a new source for Node.js 14
  const apt = {
    preserve_sources_list: true,
    sources: {
      'nodesource.list': {
        source: 'deb https://deb.nodesource.com/node_14.x $RELEASE main',
        key: gpgkey
      }
    }
  }

    // Initial packages
  const packages = [
    'nginx',
    'certbot',
    'python3-certbot-nginx',
    'nodejs',
    'unzip', /* needed for the Deno installer */
  ];

  const package_update = true;

  return { apt, packages, package_update };
}

export default async function generate(setup) {
  const cloudinit = {};

  cloudinit.users = [ defaultUser(setup) ];

  Object.assign(cloudinit, await configurePackages(setup));

  cloudinit.write_files = [];
  
  let nginxConfig = generateNginxConfig(setup);
  cloudinit.write_files.push(
    { path: '/etc/nginx/sites-available/default', content: nginxConfig }
  );

  cloudinit.write_files.push({
    path: '/root/init.sh',
    permissions: '0700',
    content: generateInitSh(setup)
  });
  cloudinit.write_files.push({
    path: '/root/waasabi-init.yml',
    permissions: '0700',
    content: generateWaasabiInitYml(setup)
  });

  cloudinit.runcmd = [];

  if (setup.mode === 'develop') {
    cloudinit.runcmd.push([ '/root/init_logs.sh' ]);
    cloudinit.runcmd.push([ '/root/init_pm2.sh' ]);

  } else {
    cloudinit.runcmd.push([ '/root/init.sh' ]);

  }

  cloudinit.output = {
    all: '| tee -a /var/log/cloud-init-output.log'
  };

  return cloudinit;
}

export async function generateYaml(setup) {
  const g = await generate(setup);

  return "#cloud-config\n" + YAML.stringify(g);
}
