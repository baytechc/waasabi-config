import YAML from 'yaml';

import generateInitSh from './init_sh.js';
import { generateYaml as generateWaasabiInitYml } from './waasabi_init.js';


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

    // Initial packages
  const packages = [
    'git', /* needed for e.g. the Strapi installer */
    'curl','unzip', /* needed for the Deno installer */
    'nginx',
  ];

  const package_update = true;

  return { packages, package_update };
}

export default async function generate(setup) {
  const cloudinit = {};

  cloudinit.users = [ defaultUser(setup) ];

  Object.assign(cloudinit, await configurePackages(setup));

  cloudinit.write_files = [];
  
  cloudinit.write_files.push({
    path: '/root/waasabi-init.yml',
    permissions: '0600',
    content: generateWaasabiInitYml(setup)
  });

  cloudinit.write_files.push({
    path: '/var/lib/cloud/scripts/per-once/init.sh',
    permissions: '0700',
    content: generateInitSh(setup)
  });

  cloudinit.output = {
    all: '| tee -a /var/log/cloud-init-output.log'
  };

  return cloudinit;
}

export async function generateYaml(setup, cloudConfig=true) {
  const g = await generate(setup);

  return (cloudConfig ? '#cloud-config\n' :'' ) + YAML.stringify(g);
}
