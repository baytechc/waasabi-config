import YAML from 'yaml';
import { configurators, hooks } from './init/components.js';


export default function generate(setup) {
  return configurators.map(c => c(setup,hooks));
}

export function generateYaml(setup) {
  const g = generate(setup);

  return '#waasabi-init\n'+YAML.stringify(g);
}
