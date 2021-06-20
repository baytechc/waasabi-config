import YAML from 'yaml';

import nginx from './dscript/nginx.js';
import letsencrypt from './dscript/letsencrypt.js';
import postgresql from './dscript/postgresql.js';
import nodejs from './dscript/nodejs.js';
import pm2 from './dscript/pm2.js';
import server from './dscript/server.js';
import serverconfig from './dscript/server-config.js';
import serverinit from './dscript/server-init.js';
import serverdbinit from './dscript/server-dbinit.js';
import serverstart from './dscript/server-start.js';
import ui from './dscript/ui.js';
import uiconfig from './dscript/ui-config.js';
import chatconfig from './dscript/chat.js';


export default function generate(setup) {
  return [
    nginx(setup),
    letsencrypt(setup),
    postgresql(setup),
    nodejs(setup),
    pm2(setup),
    server(setup),
    serverconfig(setup),
    serverinit(setup),
    serverstart(setup),
    ui(setup),
    uiconfig(setup),
    serverdbinit(setup),
    chatconfig(setup),
  ];
}

export function generateYaml(setup) {
  const g = generate(setup);

  return '#waasabi-init\n'+YAML.stringify(g);
}
