import YAML from 'yaml';

export default (setup) => YAML.stringify({
  name: 'waasabi-server',
  script: './node_modules/.bin/strapi',
  env: {
    NODE_ENV: 'development',
    args: 'develop'
  },
  env_production: {
    NODE_ENV: 'production',
    args: 'start'
  }
});
