export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Loading installation metadata…`;

  const meta = {
    logport: 30535+Math.round(Math.random()*35000),
    logsvchost: 'http://localhost',
  }
  
  return { name, desc, meta, success: `Metadata loaded.` }
}
