// deno run --allow-read --allow-run deno-init.js waasabi-init.yml

import { parse } from 'https://deno.land/std@0.95.0/encoding/yaml.ts'

let DUMMY = true;
let LOG = true;


try {
  const yaml = Deno.readTextFileSync(Deno.args[0]);
  const parsed = parse(yaml);

  for (let task of parsed) {
    if (LOG) console.log(`\n[${task.name}] ${task.desc}`);

    for (let cmd of task.run) {
      let owner; /* default owner: no change (root) */

      // Match special command
      do {
        let [,command,param] = cmd[0]?.match(/^@(\w+)(?::(.*))?/) ?? [];

        // @as: execute as the specified user (defaults to 'root')
        if (command === 'as') {
          cmd.shift();
          owner = param;
        }
  
        // @writefile: create a new file with the specified contents
        if (command === 'writefile') {
          cmd.shift();

          let [contents] = cmd;
          cmd.shift();
  
          if (LOG) {
            console.log(`\n${param} created:\n|\t` + contents.trim().replace(/\n/g,'\n|\t'));
          }
  
          if (!DUMMY) {
            Deno.writeTextFile(param.substr(1), contents);
            //TODO:owner
  
          }
  
          continue;
        }
  
        // @dir: set current directory (cwd)
        if (command === 'dir') {
          cmd.shift();
  
          if (LOG) {
            console.log('cd ' +param+ ' # switched cwd');
          }
  
          if (!DUMMY) {
            Deno.chdir(param);
  
          }
  
          continue;
        }
  
      // Process all special commands before moving on
      } while(cmd[0]?.startsWith('@'));

      // Nothing left to process
      if (!cmd.length) continue;

      if (owner) {
        cmd = [ 'sudo', '-u'+owner, '--' ].concat(cmd)
      }

      if (LOG) {
        console.log(cmd.join(' '));
      }

      if (!DUMMY) {
        const proc = Deno.run({ cmd: parsed.run[0] });
        console.log(proc);

        const presult = await proc.status();
        console.log(presult);
      }
    }
  }
}
catch (e) {
  console.error(e);
}