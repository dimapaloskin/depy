'use strict';

module.exports = {
  files: ['yarn.lock', 'package.json', 'npm-shrinkwrap.json', 'inpack.json'],
  cmds: {
    yarn: 'yarn install',
    npm: 'npm install',
    inpack: 'inpack link'
  }
};
