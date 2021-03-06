import {join, resolve} from 'path';
import test from 'ava';
import shortid from 'shortid';
import fs from 'fs-extra';
import Depy from './../lib';

test('should run npm install if package.json changed', t => {
  const id = shortid.generate();
  const sandboxDest = join(__dirname, 'sandbox', id);

  fs.copySync(resolve(join(__dirname, '/fixtures')), sandboxDest);
  fs.removeSync(join(sandboxDest, 'yarn.lock'));

  const depy = new Depy(sandboxDest, {cacheDir: join(sandboxDest, '.cache')});
  depy.run();

  const pkgPath = join(sandboxDest, 'package.json');
  const pkg = fs.readJsonSync(pkgPath);
  pkg.dependencies.five = '^0.8.0';
  fs.writeJsonSync(pkgPath, pkg);

  depy.run();

  const fiveStat = fs.statSync(join(sandboxDest, 'node_modules', 'five'));
  const cacheEncodedName = new Buffer(sandboxDest).toString('base64');
  const cachedPkg = fs.readJsonSync(join(sandboxDest, '.cache', cacheEncodedName, 'package.json'));

  t.is(fiveStat.isDirectory(), true);
  t.is(cachedPkg.dependencies.five, '^0.8.0');

  fs.removeSync(sandboxDest);
});

test('should run yarn install if yarn.lock changed', t => {
  const id = shortid.generate();
  const sandboxDest = join(__dirname, 'sandbox', id);

  fs.copySync(resolve(join(__dirname, '/fixtures')), sandboxDest);

  const depy = new Depy(sandboxDest, {cacheDir: join(sandboxDest, '.cache')});
  depy.run();

  fs.removeSync(join(sandboxDest, 'yarn.lock'));
  fs.copySync(join(sandboxDest, 'two-deps-yarn.lock'), join(sandboxDest, 'yarn.lock'));

  const pkgPath = join(sandboxDest, 'package.json');
  const pkg = fs.readJsonSync(pkgPath);
  pkg.dependencies.five = '^0.8.0';
  fs.writeJsonSync(pkgPath, pkg);

  depy.run();

  const fiveStat = fs.statSync(join(sandboxDest, 'node_modules', 'five'));
  const cacheEncodedName = new Buffer(sandboxDest).toString('base64');
  const cachedPkg = fs.readJsonSync(join(sandboxDest, '.cache', cacheEncodedName, 'package.json'));
  const yarnLock = fs.readFileSync(join(sandboxDest, 'yarn.lock'));
  const cachedYarnLock = fs.readFileSync(join(sandboxDest, '.cache', cacheEncodedName, 'yarn.lock'));

  t.is(fiveStat.isDirectory(), true);
  t.is(cachedPkg.dependencies.five, '^0.8.0');
  t.is(yarnLock.toString(), cachedYarnLock.toString());

  fs.removeSync(sandboxDest);
});

test('should run  inpack link if inpack.json changed', t => {
  const inpackModules = {
    'inpack-module': {
      path: 'inpack-module',
      name: 'inpack-module',
      package: {
        name: 'inpack-module',
        main: 'src/index.js',
        inpack: true
      }
    }
  };

  const id = shortid.generate();
  const sandboxDest = join(__dirname, 'sandbox', id);

  fs.copySync(resolve(join(__dirname, '/fixtures')), sandboxDest);

  const depy = new Depy(sandboxDest, {cacheDir: join(sandboxDest, '.cache')});
  depy.run();

  const inpackPath = join(sandboxDest, 'inpack.json');
  const inpackJson = fs.readJsonSync(inpackPath);
  inpackJson.modules = inpackModules;
  fs.writeJsonSync(inpackPath, inpackJson);

  depy.run();

  const inpackModuleStat = fs.statSync(join(sandboxDest, 'node_modules', 'inpack-module'));
  const cacheEncodedName = new Buffer(sandboxDest).toString('base64');
  const cachedInpackJson = fs.readJsonSync(join(sandboxDest, '.cache', cacheEncodedName, 'inpack.json'));

  t.is(inpackModuleStat.isDirectory(), true);
  t.deepEqual(cachedInpackJson.modules, inpackModules);

  fs.removeSync(sandboxDest);
});
