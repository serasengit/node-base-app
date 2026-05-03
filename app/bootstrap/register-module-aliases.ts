import moduleAlias = require('module-alias');
import path from 'path';

const appRoot = path.join(__dirname, '..');

moduleAlias.addAliases({
  '@models': path.join(appRoot, 'models'),
  '@controllers': path.join(appRoot, 'controllers'),
  '@services': path.join(appRoot, 'services'),
  '@routes': path.join(appRoot, 'routes'),
  '@dtos': path.join(appRoot, 'dtos'),
  '@repositories': path.join(appRoot, 'repositories'),
  '@schemas': path.join(appRoot, 'schemas'),
  '@api-messages': path.join(appRoot, 'api-messages'),
  '@middlewares': path.join(appRoot, 'middlewares'),
  '@docs': path.join(appRoot, 'docs'),
  logger: path.join(appRoot, 'logger')
});
