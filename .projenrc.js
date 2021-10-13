const { AwsCdkTypeScriptApp } = require('projen');
const project = new AwsCdkTypeScriptApp({
  cdkVersion: '1.121.0',
  projenVersion: '0.27.50',
  cdkVersionPinning: true,
  defaultReleaseBranch: 'main',
  jsiiFqn: 'projen.AwsCdkTypeScriptApp',
  name: 'esb-repository',

  cdkDependencies: [
    '@aws-cdk/core',
    '@aws-cdk/aws-codecommit',
    '@aws-cdk/pipelines',
    '@aws-cdk/aws-sqs',
    '@aws-cdk/aws-iam',
    '@aws-cdk/aws-ssm',
    '@aws-cdk/aws-kms',
  ], /* Which AWS CDK modules (those that start with "@aws-cdk/") this app uses. */
  context: {
    '@aws-cdk/core:newStyleStackSynthesis': true,
  },
  dependabotOptions: {
    scheduleInterval: 'weekly',
    autoMerge: false,
  },
  jest: true,
  scripts: {
    lint: 'cfn-lint cdk.out/**/*.template.json -i W3005 W2001',
  },
  // deps: [],                    /* Runtime dependencies of this module. */
  // description: undefined,      /* The description is just a string that helps people understand the purpose of the package. */
  // devDeps: [],                 /* Build dependencies for this module. */
  // packageName: undefined,      /* The "name" in package.json. */
  // release: undefined,          /* Add release management to this project. */
});

project.testTask.reset();
project.testTask.exec('rm -fr lib/');
project.testTask.spawn(project.testCompileTask);
project.testTask.exec('jest --passWithNoTests --all');
project.testTask.exec('eslint --ext .ts,.tsx --fix --no-error-on-unmatched-pattern src test build-tools .projenrc.js');

project.synth();