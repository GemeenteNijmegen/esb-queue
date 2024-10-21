const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/projen-project-type');

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.35.0',
  defaultReleaseBranch: 'main',
  depsUpgradeOptions: { // Override from GemeenteNijmegenCdkApp as we only use the main branch
    workflowOptions: {
      branches: ['development'],
    },
  },
  name: 'esb-queue',
  deps: [
    '@gemeentenijmegen/projen-project-type',
    '@gemeentenijmegen/aws-constructs',
  ],
});

project.synth();