import fetch from 'node-fetch';

import generateInitSh from './init_sh.js';
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
    'nodejs'
  ];

  const package_update = true;

  return { apt, packages, package_update };
}

export default async (setup) => {
  const cloudinit = {};

  cloudinit.users = [ defaultUser(setup) ];

  Object.assign(cloudinit, await configurePackages(setup));

  cloudinit.write_files = [];
  
  let nginxConfig = generateNginxConfig(setup);
  cloudinit.write_files.push(
    { path: '/etc/nginx/sites-available/default', content: nginxConfig }
  );

  let initscript = generateInitSh(setup);
  cloudinit.write_files.push(
    { path: '/root/init.sh', permissions: '0700', content: initscript }
  );

  cloudinit.runcmd = [
    [ '/root/init.sh' ]
  ];

  cloudinit.output = {
    all: '| tee -a /var/log/cloud-init-output.log'
  };

  return cloudinit;
}
