import colors from 'ansi-colors';
import ora from 'ora';

import enquirer from 'enquirer';
const { Invisible } = enquirer;


// TODO: create separate module for formatting
function h1(cont) {
  return `\n${colors.bgGreen(' '+cont+' ')}\n`;
}

function h2(cont) {
  return `\n${colors.green(cont)}\n`;
}

export function warning(cont) {
  return `\n${colors.bgYellow(colors.black(' '+cont+' '))}\n`;
}

function p(cont) {
  // Paragraphs may contain multiple lines
  cont = cont.join(' ').trim();
  // Chop to readable widths (72 chars by default)
  cont = chop(cont).join('\n');
  // Highlight certain content (e.g. links)
  cont = highlight(cont);

  return `\n${cont}\n`;
}

// Word-wrap string along the given boundary
function chop(str, cols = 72) {
  let s = str;
  let idx = 0;

  const ret = [];

  while (s) {
    idx = s.substr(0, cols).lastIndexOf(' ');

    // Can't chop further
    if (s.length <= cols || idx<0) {
      ret.push(s);
      break;
    }

    ret.push(s.substr(0, idx));
    s=s.substr(idx+1)
  }

  return ret;
}

// Highlight certain parts of the string
function highlight(str) {
  // Highlight links
  str = str.replace(/http[s]?:\/\/[^.\s]+(?:\.[^.\s]+)*/g, (m) => colors.blueBright(m) );

  // Highlight stuff in *emphasis*
  str = str.replace(/\*([^\*\n]+)\*/g, (_,m) => colors.blueBright(m) );

  // Highlight stuff between `backticks`
  str = str.replace(/`([^`\n]+)`/g, (_,m) => colors.magenta(m) );


  return str;
}

// leading/trailing whitespace is ignored
// links are highlighted
// lines starting with # are title lines
// lines starting with ## are section headings
// empty lines are newlines
// continuous paragraphs (no empty lines) are reformatted to 72chars

export function layout(s, ...r) {
  // Tagged template literal mode
  if (Array.isArray(s)) {
    s = (r??[]).map( (stitch, i) => s.raw[i]+stitch ).join('')+s.raw[s.raw.length-1].replace(/\\`/g,'`');
  }
 
  // \t (tabs) are converted to 2 spaces, \r (carriage return) is discarded
  s = s.replace(/\t/g,'  ').replace(/\r/g,'');

  let lines = s.split('\n');

  let doc = [];
  for (let l of lines) {
    l = l.trim();

    // Title
    if (l.startsWith('# ')) {
      doc.push({ t:'h1', c: l.substr(2).trim() });

    // Paragraph heading
    } else if (l.startsWith('## ')) {
      doc.push({ t:'h2', c: l.substr(3).trim() });

    // Warning heading
    } else if (l.startsWith('/!\\ ')) {
      doc.push({ t:'warn', c: l.substr(3).trim() });
    

    // Empty line (end of start new paragraph)
    } else if (l == '') {
      doc.push({ t: '-' });

    // Paragraph content
    } else {
      // Append to the last paragraph or start a new one
      const lastP = doc.length > 0 && doc[doc.length-1].t == 'p' ? true : false;
      if (lastP) {
        doc[doc.length-1].c.push(l);
      } else {
        doc.push({ t: 'p', c: [l] });
      }

    }
  }

  let output = doc.map(({t,c}) =>{
    if (t == 'h1') {
      return h1(c);
    } else if (t == 'h2') {
      return h2(c);
    } else if (t == 'warn') {
      return warning(c);
    } else if (t == 'p') {
      return p(c);
    } else {
      return '';
    }
  }).join('');

  console.log(output);
}

export function em(string) {
  return colors.bgBlue(colors.whiteBright(string));
}

export function clear() {
  if (process.env.NOCLEAR) return;
  console.clear();
}

export function pause(message = 'Press Enter to continue...') {
  return new Invisible({
    name: 'wait',
    message,
  }).run().catch(() => ''); // avoid freezing the terminal on Ctrl+C
}


export async function loading(message, task) {
  const spinner = ora(message).start();

  let taskresult;
  try {
    taskresult = await task;
  }
  catch(e) {
    spinner.stop();
    throw e;
  }

  spinner.stop();
  return taskresult;
}