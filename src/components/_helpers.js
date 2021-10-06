import fs from 'fs-extra';
import { parse } from 'path';

export function componentName(url) {
  return url.match(/([^\/]+\/[^\/]+)\.\w+$/)[1];
}

export function hookTemplate(url, source, active) {
  const { name: target, template: hook } = loadTemplate(url, active);
  return { source, target, url, hook }
}

export function loadTemplate(url, activityCheck) {
  const { base, name, ext } = parse(url.pathname);
  const comp = componentName(url.toString());

  const contents = fs.readFileSync(url).toString().trim();
  const template = new Function('setup','hooks',`
    const hook = ${__hook.toString().replace(/\s+/,' ').replace('__hook','')};
    if (${activityCheck} === false) return void 0;/*console.log('DEBUG ${comp} inactive.');*/
    return \`${contents}\`;`
  );

  return { comp, base, name, ext, template };
}

export function loadTemplates(...urls) {
  return Object.fromEntries(
    urls.map(url => {
      const t = loadTemplate(url);
      return [t.base, t];
    })
  );
}

function __hook(i){
  const r = (hooks[i]??[]).map(e => e.hook(setup)).filter(h => typeof h != 'undefined');
  /*console.log('DEBUG ['+i+'] active hooks: '+(r.length))+'/'+(hooks[i].length||0);*/
  return r.join('\n');
};

