const { GemeenteNijmegenCdkApp } = require('@gemeentenijmegen/modules-projen');

const project = new GemeenteNijmegenCdkApp({
  cdkVersion: '2.35.0',
  defaultReleaseBranch: 'main',
  depsUpgradeOptions: { // Override from GemeenteNijmegenCdkApp as we only use the main branch
    workflowOptions: {
      branches: ['main'],
    },
  },
  name: 'esb-queue',
  deps: [
    '@gemeentenijmegen/modules-projen',
  ],
  enableCfnLintOnGithub: true,
  enableCfnDiffWorkflow: false,
  enableEmergencyProcedure: false,
});

project.synth();