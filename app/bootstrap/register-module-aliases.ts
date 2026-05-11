import moduleAlias = require('module-alias');
import path from 'path';

const appRoot = path.join(__dirname, '..');

moduleAlias.addAliases({
  '@core': path.join(appRoot, 'core'),
  '@features': path.join(appRoot, 'features'),
  '@bootstrap': path.join(appRoot, 'bootstrap'),
  '@logger': path.join(appRoot, 'logger'),
  '@routes': path.join(appRoot, 'routes'),
  '@controllers': path.join(appRoot, 'controllers'),
  '@middlewares': path.join(appRoot, 'middlewares'),
  '@services': path.join(appRoot, 'services'),
  '@repositories': path.join(appRoot, 'repositories'),
  '@schemas': path.join(appRoot, 'schemas'),
  '@dtos': path.join(appRoot, 'dtos'),
  '@utils': path.join(appRoot, 'utils'),
  '@api-messages': path.join(appRoot, 'api-messages'),
  '@tests': path.join(appRoot, 'tests'),
  '@docs': path.join(appRoot, 'docs'),
  logger: path.join(appRoot, 'logger')
});
