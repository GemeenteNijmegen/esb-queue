const { awscdk } = require('projen');

const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.32.0',
  projenVersion: '0.58.30',
  defaultReleaseBranch: 'main',
  name: 'esb-repository',
  scripts: {
    lint: 'cfn-lint cdk.out/**/*.template.json -i W3005 W2001',
  },
});

project.synth();