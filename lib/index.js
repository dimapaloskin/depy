'use strict';

const path = require('path');
const fs = require('fs-extra');
const pick = require('lodash.pick');
const deepequal = require('deepequal');
const execa = require('execa');
const config = require('./config');

function Depy(directory, options) {
  directory = path.resolve(directory);
  if (!options) {
    options = {};
  }

  this.directory = directory;
  this.options = options;

  const cacheEncodedName = new Buffer(directory).toString('base64');
  this.projectCacheDir = path.resolve(path.join(this.options.cacheDir, cacheEncodedName));
}

Depy.prototype.run = function () {
  const files = this.collect();
  this.validateCache(files);
  const engines = this.diff(files);

  if (files['yarn.lock'] && files['yarn.lock'].exists && (!files['npm-shrinkwrap.json'] || !files['npm-shrinkwrap.json'].exists)) {
    engines.yarn = engines.npm;
    delete engines.npm;
  }

  let needRebuildCache = false;
  for (let engine in engines) {
    if (Object.prototype.hasOwnProperty.call(engines, engine)) {
      if (engines[engine]) {
        needRebuildCache = true;
        const cmd = config.cmds[engine];
        execa.shellSync(cmd, {
          cwd: this.directory,
          stdio: [0, 1, 2]
        });
      }
    }
  }

  if (needRebuildCache) {
    this.createCache(files);
  }

  return files;
};

Depy.prototype.createCache = function (files) {
  for (let key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const file = files[key];
      const cacheAbsolutePath = path.join(this.projectCacheDir, key);
      fs.copySync(file.absolute, cacheAbsolutePath);
    }
  }
};

Depy.prototype.diff = function (files) {
  const engines = {
    npm: false,
    inpack: false
  };

  for (let key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const file = files[key];

      const cachedAbsoultePath = path.join(this.projectCacheDir, file.file);

      if (key === 'package.json' || key === 'npm-shrinkwrap.json') {
        const current = fs.readJsonSync(file.absolute);
        const cached = fs.readJsonSync(cachedAbsoultePath);

        const list = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies', 'bundledDependencies'];
        const collectCurrent = pick(current, list);
        const collectCached = pick(cached, list);

        if (deepequal(collectCached, collectCurrent) === false) {
          engines.npm = true;
        }
      }

      if (key === 'yarn.lock') {
        const current = fs.readFileSync(file.absolute);
        const cached = fs.readFileSync(cachedAbsoultePath);

        if (deepequal(current.toString(), cached.toString())) {
          engines.npm = true;
        }
        engines.npm = !(cached.toString() === current.toString());
      }

      if (key === 'inpack.json') {
        const current = fs.readJsonSync(file.absolute);
        const cached = fs.readJsonSync(cachedAbsoultePath);

        const list = ['modules'];
        const collectCurrent = pick(current, list);
        const collectCached = pick(cached, list);

        if (deepequal(collectCached, collectCurrent) === false) {
          engines.inpack = true;
        }
      }
    }
  }

  return engines;
};

Depy.prototype.validateCache = function (files) {
  fs.mkdirpSync(this.projectCacheDir);

  for (let key in files) {
    if (Object.prototype.hasOwnProperty.call(files, key)) {
      const file = files[key];

      if (!file.cached) {
        fs.copySync(file.absolute, path.join(this.projectCacheDir, file.file));
      }
    }
  }
};

Depy.prototype.collect = function () {
  const files = {};

  config.files.forEach(file => {
    try {
      const absolutePath = path.join(this.directory, file);
      const stat = fs.statSync(absolutePath);
      if (stat.isFile()) {
        files[file] = {
          file: file,
          absolute: absolutePath,
          exists: true
        };
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        throw err;
      }
    }

    if (files[file]) {
      try {
        const cacheAbsolutePath = path.join(this.projectCacheDir, file);
        const stat = fs.statSync(cacheAbsolutePath);
        if (stat.isFile()) {
          files[file].cached = true;
        }
      } catch (err) {
        files[file].cached = false;
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }
  });

  return files;
};

module.exports = Depy;
