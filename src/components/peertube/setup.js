// Default configuration
export function defaults(setup) {
  console.log('Initializing PeerTube configuration…')
  const config = {
    enabled: 'default',
    local: {
      version: 'v3.2.1',
      bind: '127.0.0.1', // listen on localhost 
      port: '9000',
      homedir: '/var/www/peertube',
      systemuser: 'peertube',
    },
    host: null, // defaults to setup.host
    database: 'peertube_waasabi',
    // PeerTube admin user
    username: 'waasabi',
    password: null, // user-facing, so it defaults to setup.admin_password
  };

  if (setup) setup.services.peertube = config;
  return config;
}
