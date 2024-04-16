const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/modules-projen');

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.35.0',
  defaultReleaseBranch: 'main-new-lz',
  depsUpgradeOptions: { // Override from GemeenteNijmegenCdkApp as we only use the main branch
    workflowOptions: {
      branches: ['main-new-lz'],
    },
  },
  name: 'esb-queue',
  deps: [
    '@gemeentenijmegen/modules-projen',
    '@gemeentenijmegen/aws-constructs',
  ],
  enableCfnLintOnGithub: true,
  enableCfnDiffWorkflow: false,
  enableEmergencyProcedure: false,
});

project.synth();