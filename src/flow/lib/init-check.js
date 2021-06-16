import * as Setup from '../../init/setup.js';
import * as VM from '../../init/vm.js';


export default async function initCheck() {
  const configlist = await Setup.list({ sort: 'newest' });

  // Check for virtualization options
  const providers = await VM.providers();

  let instancelist;
  if (providers) instancelist = await VM.list({ detail: 'full' });

  // No virtualization providers available, or no instances has been configured
  if (!instancelist) return configlist.map(host => ({host}));

  
  // Map the list of instances keyed by the instance names
  const instances = new Map(instancelist.map(i => [i.name, i]));

  // Find associated instances and for the respective saved configurations
  const configs = configlist.map(host => {
    const instancename = Setup.instancename(host);
    const instance = instances.get(instancename); 

    return { host, instancename, instance };
  });

  return configs;
}