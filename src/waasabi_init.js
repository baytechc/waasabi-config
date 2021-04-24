import YAML from 'yaml';
import letsencrypt from './dscript/letsencrypt.js';
import pm2 from './dscript/pm2.js';
import server from './dscript/server.js';
import serverconfig from './dscript/server-config.js';
import serverinit from './dscript/server-init.js';
import serverstart from './dscript/server-start.js';


export default function generate(setup) {
  return [
    letsencrypt(setup),
    pm2(setup),
    server(setup),
    serverconfig(setup),
    serverinit(setup),
    serverstart(setup),
  ];
}

export function generateYaml(setup) {
  const g = generate(setup);

  return '#waasabi-init\n'+YAML.stringify(g);
}
