import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input, Snippet } = enquirer;


export default async function() {

  layout(`## Domain configuration`);

  setup.domain = await (new Input({
    name: 'domain',
    footer: 'Enter your website\'s domain name.',
    message: 'Domain name',
    initial: setup.domain ?? 'my-website.net'
  })).run();

  const host = await (new Snippet({
    name: 'host',
    footer:
      'Choose a subdomain for the Waasabi server. '
      +'Note: you nay need to manually configure the domain name at your provider.',
    message: 'Subdomain',
    required: true,
    fields: [
      {
        name: 'subdomain',
        message: 'Waasabi Subdomain'
      },
    ],
    template: `\${subdomain:${setup.subdomain ?? 'waasabi'}}.${setup.domain}`
  })).run();

  setup.host = host.result;
  setup.subdomain = host.values.subdomain;
}