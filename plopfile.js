// eslint-disable-next-line func-names
module.exports = function (plop) {
  plop.setGenerator('package', {
    description: 'Create a package',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'What is the package name ?',
        default: 'new-package',
        validate: (name) => {
          if (/\s/g.test(name)) {
            return 'Package name cannot contain spaces';
          }
          return true;
        },
        transformer: (name) => name.toLowerCase(),
      },
      {
        type: 'input',
        name: 'description',
        message: 'What is the package description ?',
        default: '@composite-fetcher package',
      },
      {
        type: 'input',
        name: 'maintainer',
        message: 'Who is the package maintainer ?',
        default: 'Teofanis Papadopulos',
      },
    ],
    actions: [
      {
        type: 'addMany',
        base: 'stubs/package/',
        description: 'Create package files',
        destination: 'packages/{{name}}',
        templateFiles: 'stubs/package',
      },
      function installDependencies() {
        const { spawn } = require('child_process');
        const pnpmInstall = spawn('pnpm', ['install']);
        pnpmInstall.stdout.pipe(process.stdout);
        pnpmInstall.stderr.pipe(process.stderr);
      },
    ],
  });
};
