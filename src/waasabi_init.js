import YAML from 'yaml';

import nginx from './dscript/nginx.js';
import letsencrypt from './dscript/letsencrypt.js';
import nodejs from './dscript/nodejs.js';
import pm2 from './dscript/pm2.js';
import server from './dscript/server.js';
import serverconfig from './dscript/server-config.js';
import serverinit from './dscript/server-init.js';
import serverstart from './dscript/server-start.js';


export default function generate(setup) {
  return [
    nginx(setup),
    letsencrypt(setup),
    nodejs(setup),
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
