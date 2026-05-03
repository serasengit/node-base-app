import moduleAlias = require('module-alias');
import path from 'path';

const appRoot = path.join(__dirname, '..');

moduleAlias.addAliases({
  '@core': path.join(appRoot, 'core'),
  '@features': path.join(appRoot, 'features'),
  '@bootstrap': path.join(appRoot, 'bootstrap'),
  '@logger': path.join(appRoot, 'logger'),
  '@api-messages': path.join(appRoot, 'api-messages'),
  '@middlewares': path.join(appRoot, 'middlewares'),
  '@docs': path.join(appRoot, 'docs'),
  logger: path.join(appRoot, 'logger')
});
