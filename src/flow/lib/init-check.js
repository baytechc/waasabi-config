import * as Setup from '../../init/setup.js';
import * as Multipass from '../../init/multipass.js';


export default async function initCheck() {
  const instancelist = await Multipass.list();
  const configlist = await Setup.list();

  // No instances
  if (!instancelist) return configlist;

  // Map the list of instances keyed by the instance names
  const instances = new Map(instancelist.list.map(i => [i.name, i]));

  // Find associated instances and for the respective saved configurations
  const configs = configlist.map(host => {
    const instancename = Setup.instancename(host);
    const instance = instances.get(instancename); 

    return { host, instancename, instance };
  });

  // TODO: ordering? latest-updated first? Running-instance-first?

  return configs;
}