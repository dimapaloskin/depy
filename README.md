# depy

[![npm version](https://badge.fury.io/js/depy.svg)](https://www.npmjs.com/package/depy)
[![Build Status](https://travis-ci.org/dimapaloskin/depy.svg?branch=master)](https://travis-ci.org/dimapaloskin/depy)
[![XO code style](https://img.shields.io/badge/code_style-XO-5ed9c7.svg)](https://github.com/sindresorhus/xo)

> Depy is a small cli tool that watches your project dependencies and runs the appropriate package manager when it is needed. Depy tracks changes in [package.json](https://github.com/npm/npm), [npm-shrinkwrap.json](https://github.com/npm/npm), [yarn.lock](https://github.com/yarnpkg/yarn), [inpack.json](https://github.com/dimapaloskin/inpack). 

## Screencast

[![asciicast](https://asciinema.org/a/80g78fev1cywov31dxwo1q6t3.png)](https://asciinema.org/a/80g78fev1cywov31dxwo1q6t3)

## Install

```bash
npm install --save-dev depy
```

## How it works

After the very first run, depy creates project confuguration files cache. From now on, when the tool is running, it will be comparing all the configuration files with the cache. If there are any inconsistencies, depy will run the appropriate tool to update dependecies.

Depy runs different commands for each type of config:
- ```package.json``` and ```npm-shrinkwrap.json``` - npm install
- ```yarn.lock``` - yarn install
- ```inpack.json``` - inpack link

Also depy can detect yarn ("yarn install" will be executed instead of "npm install"). If npm-shrinkwrap.json exists and was changed, "npm install" will be executed in any case.

## Usage

```bash
$ depy
```

Since depy is the tool for developers, you need to install it with ```--save-dev``` npm flag (or ```-D``` for yarn). You can run depy manually, but it might be annoying doing this every time.  So, you can simply add depy to your npm-scripts.

#### Example

package.json **before**
```js
...
"scripts": {
  "start": "webpack",
  "test": "ava"
},
...
```

package.json **after**
```js
...
"scripts": {
  "start": "depy && webpack",
  "test": "depy && ava"
},
...
```

You can use ```depy cache``` to recreate the cache without running any package manager. Makes sense to add this script to the "postinstall" section. It is a good way to avoid an unnecessary package manager launch after installing new dependencies.

In this case, your modified package.json will be:

```js
...
"scripts": {
  "start": "depy && webpack",
  "test": "depy && ava"
},
"postinstsall": "depy cache",
...
```

## Available flags

- ```--dir``` - project directory (current directory by default)
- ```--cache-dir``` - cache directory (depy installation directory by default)

#### Author
[Dmitry Pavlovsky](http://palosk.in)
