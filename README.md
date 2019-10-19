# generator-dev-standards [![NPM version][npm-image]][npm-url] [![Build Status][travis-image]][travis-url] [![Dependency Status][daviddm-image]][daviddm-url] [![Coverage percentage][coveralls-image]][coveralls-url]
> An opinionated generator for using npm based development tools with any language.

## Installation

First, install [Yeoman](http://yeoman.io) and generator-dev-standards using [npm](https://www.npmjs.com/) (we assume you have pre-installed [node.js](https://nodejs.org/)).

```bash
npm install -g yo generator-dev-standards
```

Clone the repo and link it:

Finally, move to a fresh directory with git setup (preferably with a remote added) and initiate the generator:

```bash
yo dev-standards
```

## What this Generator Controls

### Git Hooks

Git hooks are auto-configured using husky and lint-staged. Out of the box, it includes the following hooks:

#### Pre-Commit

Precommit hooks are setup to the following:
* eslint for all .js files
* jsonlint for all .json files
* pylint for all .py files
* rubocop for all .rb files

#### Commit Message

Validates using Commitlint to commitizen standard for compatibility with standard-version auto-generated changelogs and version bumps.

### Release Process

To release a new version, simply run:

```bash
npm run release
```

This will automatically increment the version in package.json and the version file according to the commit history, and create a tag. It will also auto-update the changelog.

### Standards

To re-run the dev-standards generator:

```
npm run standards
```

## Getting To Know Yeoman

 * Yeoman has a heart of gold.
 * Yeoman is a person with feelings and opinions, but is very easy to work with.
 * Yeoman can be too opinionated at times but is easily convinced not to be.
 * Feel free to [learn more about Yeoman](http://yeoman.io/).

## License

 © [Dan Rosenbloom](https://github.com/flyinbutrs)


[npm-image]: https://badge.fury.io/js/generator-dev-standards.svg
[npm-url]: https://npmjs.org/package/generator-dev-standards
[travis-image]: https://travis-ci.org/flyinbutrs/generator-dev-standards.svg?branch=master
[travis-url]: https://travis-ci.org/flyinbutrs/generator-dev-standards
[daviddm-image]: https://david-dm.org/flyinbutrs/generator-dev-standards.svg?theme=shields.io
[daviddm-url]: https://david-dm.org/flyinbutrs/generator-dev-standards
[coveralls-image]: https://coveralls.io/repos/flyinbutrs/generator-dev-standards/badge.svg
[coveralls-url]: https://coveralls.io/r/flyinbutrs/generator-dev-standards
