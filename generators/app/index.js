'use strict';
const Generator = require('yeoman-generator');
const chalk = require('chalk');
const yosay = require('yosay');
const path = require('path');
const yaml = require('js-yaml');
const _ = require('lodash');
const spawn = require('child_process').spawnSync;
const ncu = require('npm-check-updates');
const GENERATOR_VERSION = require('./version');

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option('upgrade', {
      desc: 'Only ask for answers without defaults',
      alias: 'u',
      type: Boolean,
      default: false
    });

    this.defaults = {
      version: '0.1.0',
      license: 'MIT'
    };
  }

  initializing() {
    this.packageJson = this.fs.readJSON('package.json') || {};

    const existing = {
      packageName: this.packageJson.name,
      authorName: this.packageJson.author,
      email: this.packageJson.email,
      version: this.packageJson.version,
      description: this.packageJson.description,
      license: this.packageJson.license,
    };

    if (this.packageJson.keywords) {
      existing.keywords = this.packageJson.keywords.join(' ');
    } else {
      existing.keywords = '';
    }

    if (this.packageJson.repository) {
      existing.repository = this.packageJson.repository.url;
    }

    const guesses = {
      url: guessPackageURL,
      email: oneLineCommand('git config --global user.email'),
      authorName: oneLineCommand('git config --global user.name'),
      packageName: path.basename(process.cwd())
    };

    _.merge(this.defaults, guesses, this.config.getAll().promptValues, existing);
  }

  async prompting() {
    this.log(
      yosay(
        `Welcome to the ${chalk.red(
          'dev-standards'
        )} generator version ${GENERATOR_VERSION}!`
      )
    );

    var prompts = [
      {
        type: 'input',
        name: 'packageName',
        message: 'Package Name:',
        default: this.defaults.packageName
      },
      {
        type: 'input',
        name: 'authorName',
        message: 'Package author name',
        default: this.defaults.authorName,
        filter: escapeQuotes
      },
      {
        type: 'input',
        name: 'email',
        message: 'Package author email',
        default: this.defaults.email
      },
      {
        type: 'input',
        name: 'version',
        message: 'Package version',
        default: this.defaults.version
      },
      {
        type: 'input',
        name: 'description',
        message: 'Package description:',
        default: this.defaults.description,
        filter: escapeQuotes
      },
      {
        type: 'input',
        name: 'keywords',
        message: 'Package keywords (space separated keywords):',
        default: this.defaults.keywords,
        filter: escapeQuotes
      },
      {
        type: 'input',
        name: 'url',
        message: 'Package url:',
        default: this.defaults.url
      },
      {
        type: 'input',
        name: 'license',
        message: 'Package license:',
        default: this.defaults.license,
        filter: escapeQuotes
      }
    ];

    if (this.options.upgrade) {
      prompts = _.filter(prompts, function(p) {
        return p.default === undefined;
      });

      this.answers = _.merge(await this.prompt(prompts), this.defaults);
    } else {
      this.answers = await this.prompt(prompts);
    }
  }

  writing() {
    const versionrc = loadYaml('_versionrc', this);

    if (!(this.answers.language === 'None of the above')) {
      this.composeWith(require.resolve('generator-version-file/generators/app'), {
        language: this.answers.language
      });
      // eslint-disable-next-line no-unused-expressions
      !('scripts' in versionrc) && (versionrc.scripts = {});
      versionrc.scripts.postbump = 'yo version-file --force --git';
    }

    this.fs.writeJSON('.versionrc', versionrc);

    if (this.answers.serverless) {
      this.answers.main = 'serverless deploy';
      this.answers.test = 'serverless config';
    }

    this.pythonPackageName = this.answers.packageName.replace(/(\s|-)+/g, '_');

    const files = [
      { source: '_editorconfig', dest: '.editorconfig' },
      // { source: '_gitignore', dest: '.gitignore' },
      { source: '_lintstagedrc', dest: '.lintstagedrc' },
      { source: '_huskyrc.json', dest: '.huskyrc.json' },
      { source: '_eslintrc.yml', dest: '.eslintrc.yml' },
      { source: '_commitlint.config.js', dest: 'commitlint.config.js' }
    ];

    files.forEach(element => {
      template(this, element.source, element.dest);
    });

  }

  install() {
    updatePackageJson(this)
  }

  end() {
    this.config.set('generator_version', GENERATOR_VERSION);
    this.config.save();
  }
};

function updatePackageJson(context) {
  const packageAnswers = {
    name: context.answers.packageName,
    version: context.answers.version,
    description: context.answers.description,
    main: context.answers.main || 'echo "unknown"',
    repository: {
      type: 'git',
      url: context.answers.url
    },
    keywords: context.answers.keywords.split(' ').filter(function(e) {
      return e;
    }),
    author: context.answers.authorName,
    email: context.answers.email,
    license: context.answers.license,
    scripts: {
      test: context.answers.test || null
    }
  };
  const packageDefaults = context.fs.readJSON(context.templatePath('_package.defaults.json'));
  const updatedPackageJson = _.merge(packageAnswers, context.packageJson, packageDefaults);

  ncu
  .run({
    packageData: JSON.stringify(updatedPackageJson),
    upgrade: true,
    jsonAll: true,
    silent: true
  })
  .then(output => {
    context.packageJson = output;
    // Delete objects from package.json that have been moved into separate files
    delete context.packageJson['lint-staged'];
    delete context.packageJson.scripts.precommit;
    delete context.packageJson.scripts.prebump;
    delete context.packageJson.scripts['pre-commit'];
    delete context.packageJson.scripts['commit-msg'];
  }).then(() => {
    context.fs.writeJSON(context.destinationPath('package.json'), context.packageJson);
  }).then(()=> {
    context.installDependencies({ bower: false });
  });
}

function guessPackageURL(answers) {
  var existingGitUrl = oneLineCommand('git remote get-url origin');
  if (existingGitUrl.length > 0) {
    return existingGitUrl;
  }

  var emailParts = answers.email.split('@');
  if (emailParts.length > 1) {
    return 'https://github.com/' + emailParts[0] + '/' + answers.packageName;
  }

  return 'https://github.com/someuser/' + answers.packageName;
}

function escapeQuotes(answer) {
  /* eslint-disable no-control-regex */
  return answer.replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
  /* eslint-enable no-control-regex */
}

function oneLineCommand(command) {
  var args = command.split(/\s+/);
  var cmd = args[0];
  var opts = args.slice(1, args.length);
  var proc = spawn(cmd, opts);
  var line = proc.stdout.toString('utf8').replace(/(\r\n|\n|\r)/gm, '');
  return line;
}

function template(gen, source, dest) {
  gen.fs.copyTpl(gen.templatePath(source), gen.destinationPath(dest), gen);
}

function loadYaml(name, ctx) {
  return yaml.safeLoad(ctx.fs.read(ctx.templatePath(name)));
}

module.exports.version = GENERATOR_VERSION;
