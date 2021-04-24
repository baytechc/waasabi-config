export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring Let's Encrypt…`;

  if (setup?.prod) {
    const run = [];

    run.push([
      'certbot',
      '--nginx',
      '--redirect', /* set up http->https redirect */
      '-d', setup.host,
      '-m', setup.admin_email,
      '--agree-tos',
      '-n', /* run non-interactively */
    ]);

    return { name, desc, run, success: `HTTPS enabled for ${setup.host}` }
  }

  return { name, desc, skip: `HTTPS proxying unavailable for local instances` }
}