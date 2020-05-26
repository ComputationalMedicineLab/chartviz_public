import { configure } from '@storybook/react';

import '../src/index.css';
import 'bootstrap/dist/css/bootstrap.css';

function loadStories() {
  require('../src/stories');
}

configure(loadStories, module);
