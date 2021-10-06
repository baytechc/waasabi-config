import YAML from 'yaml';

export default (setup) => YAML.stringify({
  name: 'waasabi-matrix',
  script: './waasabi-matrix config.toml',
});
