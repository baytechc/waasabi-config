import * as Setup from '../../init/setup.js';
import * as VM from '../../init/vm.js';


export default async function initCheck() {
  const instancelist = await VM.list({ detail: 'full' });
  const configlist = await Setup.list({ sort: 'newest' });

  // No instances
  if (!instancelist) return configlist;

  // Map the list of instances keyed by the instance names
  const instances = new Map(instancelist.map(i => [i.name, i]));

  // Find associated instances and for the respective saved configurations
  const configs = configlist.map(host => {
    const instancename = Setup.instancename(host);
    const instance = instances.get(instancename); 

    return { host, instancename, instance };
  });

  // TODO: ordering? latest-updated first? Running-instance-first?

  return configs;
}