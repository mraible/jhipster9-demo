// ***********************************************************
// This support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************
if (Cypress.expose('CYPRESS_COVERAGE')) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('./coverage');
}

import './account';
import './commands';
import './navbar';
import './entity';
import './management';
import installLogsCollector from 'cypress-terminal-report/src/installLogsCollector';

installLogsCollector();
