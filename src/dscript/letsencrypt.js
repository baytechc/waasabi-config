export default function task(setup) {
  const name = import.meta.url.match(/([^\/]+)\.js$/)[1];
  const desc = `Configuring Let's Encrypt…`;

  if (setup?.prod) {
    const run = [];

    // Install certbot and the --nginx backend
    run.push([
      'apt-get',
      'install',
      'certbot',
      'python3-certbot-nginx',
    ]);

    // Run certbot-nginx to provision a new Let's Encrypt SSL certificate
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