import setup, * as Setup from '../init/setup.js';
import { layout } from '../init/content-formatter.js';

import enquirer from 'enquirer';
const { Input } = enquirer;


export default async function() {

  layout(`##  Waasabi instance details`);

  setup.title = await (new Input({
    name: 'title',
    header: 'Choose a title for the Waasabi service (e.g. "My Cool Meetup", "Jane\'s Gaming Stream", etc.):',
    message: 'Title',
    initial: setup.title ?? 'My Waasabi'
  })).run();
}
