import { componentName, hookTemplate } from '../_helpers.js';
import { defaults } from './setup.js';

import bcrypt from 'bcryptjs';


const templates = {};

const Component = componentName(import.meta.url);
export default {
  inits: [ defaults ],
  tasks: [ maintask ],
  templates,
  hooks: [
    hookTemplate(new URL('nginx-upstream.conf', import.meta.url), Component, '!!setup.services.peertube?.local'),
    hookTemplate(new URL('nginx-location.conf', import.meta.url), Component, '!!setup.services.peertube?.local'),
  ],
}

export function maintask(setup) {
  const desc = `Configuring the PeerTube streaming backend…`;

  // Missing config
  if (!setup.services.peertube?.enabled) {
    return { name: Component, desc, skip: `The PeerTube backend was incorrectly configured, or it is disabled.` };
  }

  // Username, can also be waasabi
  const _PEERTUBE = setup.services.peertube.local.systemuser;
  // Was /var/www/peertube before
  const HOMEDIR = setup.services.peertube.local.homedir;
  // PeerTube version
  const VERSION = setup.services.peertube.local.version;
  // Release tarball URL
  const URL = `https://github.com/Chocobozzz/PeerTube/releases/download/${VERSION}/peertube-${VERSION}.tar.xz`

  // PeerTube database in Postgres
  // TODO: maybe allow customizing this for non-local instances?
  const DBUSER = setup.services.postgresql.username;
  const DBPASSWORD = setup.services.postgresql.password;
  const DBNAME = setup.services.peertube.database;

  const run = [];


  // Start once Postgresql/Redis is already installed
  run.push([ '@after', 'postgresql', 'redis', 'nodejs','yarn' ])

  // Requires nodejs+yarn, ffmpeg and various dev dependencies
  run.push([ '@ospkg',
    'curl', 'ffmpeg', 'cron',
    // 'unzip' - replaced .zip download with .tar.xz
    'python-dev', 'python-is-python3',
    'git',
    'openssl',
    'g++', 'make'
  ])

  // Create Postgresql database owned by the waasabi user created by the Postgres install
  run.push([
    '@as:postgres',
    'createdb', // create new database
      '-O', DBUSER, // owned by the 'waasabi' db user
      '-E', 'UTF8', // encoding
      '-T', 'template0', // template
      DBNAME // db name
  ]);

  // Postgres extensions required by PeerTube
  run.push([ '@as:postgres', 'psql', '-c', 'CREATE EXTENSION pg_trgm;', DBNAME ]);
  run.push([ '@as:postgres', 'psql', '-c', 'CREATE EXTENSION unaccent;', DBNAME ]);

  // Create new OS user for PeerTube
  // sudo useradd -m -d /var/www/peertube -s /bin/bash -p crypt(peertube) peertube
  // TODO: skip if already exists?
  run.push([ '@createuser', {
    username: _PEERTUBE,
    password: bcrypt.hashSync(setup.admin_password, 10),
    home: HOMEDIR,
    shell: '/bin/bash',
  } ]);

  run.push([ '@as:'+_PEERTUBE, '@ensuredir',
    HOMEDIR+'/config',
    HOMEDIR+'/storage',
    HOMEDIR+'/versions'
  ]);

  run.push([ '@dir:'+HOMEDIR+'/versions' ]);

  // Fetches the file from the URL, detects the file type, extracts it and puts contents into the destination directory
  run.push([ '@as:'+_PEERTUBE, '@'+URL, '@extract:peertube-'+VERSION ]);

  // Link the current version as 'latest'
  //run.push([ '@dir:'+HOMEDIR, '@as:'+_PEERTUBE, '@symlink:versions/peertube-'+VERSION, './peertube-latest' ])
  run.push([ '@dir:'+HOMEDIR, '@as:'+_PEERTUBE, 'ln', '-s', 'versions/peertube-'+VERSION, './peertube-latest' ]);
  
  run.push([ '@dir:'+HOMEDIR+'/peertube-latest' ]);
  run.push([ '@as:'+_PEERTUBE, 'yarn', 'install', '--production', '--pure-lockfile' ]);

  // Update the YAML configuration of the instance
  // This takes the default YAML configuration that came with the PeerTube version
  // and updates it with the neccessary entries
  run.push([ '@yaml:'+HOMEDIR+'/config/production.yaml',
    // Local bind ip/port config
    [ '@set:listen.hostname', setup.services.peertube.local.bind ],
    [ '@set:listen.port', setup.services.peertube.local.port ],

    // Hostname setup
    [ '@set:webserver.hostname', setup.services.peertube.host || setup.host ],

    // Database config
    [ '@unset:database.suffix' ],
    [ '@set:database.name', DBNAME ],
    [ '@set:database.username', DBUSER ],
    [ '@set:database.password', DBPASSWORD ],
  ]);

  // Install and start system service
  run.push([ 'cp', HOMEDIR+'/peertube-latest/support/systemd/peertube.service', '/etc/systemd/system/' ]);
  run.push([ 'systemctl', 'enable', 'peertube' ]);
  run.push([ 'systemctl', 'start', 'peertube' ]);

  // Register admin users and get credentials

  // Wait a couple seconds for initialization to complete
  run.push([ 'sleep', 10 ])

  // The logfile contains the admin credentials
  const PEERTUBE_LOG=HOMEDIR+'/logs/peertube.log';

  // Fetch credentials and expose them as environment variables for subsequent calls
  run.push([
    '@grepfile:'+PEERTUBE_LOG, `(?<=^{"message":"Client id: )([^"]+)`,
    '@setenv:WAASABI_PT_CLIENT_ID',
  ])
  run.push([
    '@grepfile:'+PEERTUBE_LOG, `(?<=^{"message":"Client secret: )([^"]+)`,
    '@setenv:WAASABI_PT_CLIENT_SECRET',
  ])
  run.push([
    '@grepfile:'+PEERTUBE_LOG, `(?<=^{"message":"Username: )([^"]+)`,
    '@setenv:WAASABI_PT_USERNAME',
  ])
  run.push([
    '@grepfile:'+PEERTUBE_LOG, `(?<=^{"message":"User password: )([^"]+)`,
    '@setenv:WAASABI_PT_USERPASSWORD',
  ])

  // Authenticate as the admin and fetch the API token
  run.push([
    `@http://${setup.host}/api/v1/users/token`,
      {
        data: {
          client_id: '$WAASABI_PT_CLIENT_ID',
          client_secret: '$WAASABI_PT_CLIENT_SECRET',
          grant_type: 'password',
          response_type: 'code',
          username: '$WAASABI_PT_USERNAME',
          password: '$WAASABI_PT_USERPASSWORD'
        }
      },
    '@json:.access_token',
    '@setenv:WAASABI_PT_ADMINTOKEN',
  ]);

  // Create waasabi user
  run.push([ '@http://localhost/api/v1/users/',
    {
      auth: 'Bearer $WAASABI_PT_ADMINTOKEN',
      jsondata: {
        "username":    setup.services.peertube.username,
        "channelName": "live",
        "email":       setup.admin_email,
        "password":    setup.services.peertube.password || setup.admin_password,
        "role":        "0",
        "videoQuota":      -1,
        "videoQuotaDaily": -1,
        "byPassAutoBlock": true,
        "adminFlags":      1
      }
    }
  ]);

  // Auto-install Waasabi plugin
  run.push([ '@http://localhost/api/v1/plugins/install',
    {
      auth: 'Bearer $WAASABI_PT_ADMINTOKEN',
      jsondata: {
        npmName: "peertube-plugin-waasabi"
      }
    }
  ]);

  // Configure the plugin webhook
  run.push([ '@http://localhost/api/v1/plugins/peertube-plugin-waasabi/settings',
    {
      auth: 'Bearer $WAASABI_PT_ADMINTOKEN',
      jsondata: {
        settings: {
          'webhook-endpoint': 'http://localhost/waasabi/event-manager/webhooks',
          'webhook-secret': setup.secret
        }
      }
    }
  ]);

  return { name: Component, desc, run, success: `PeerTube instance deployed` };
}
