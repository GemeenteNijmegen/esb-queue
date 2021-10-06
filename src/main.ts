import * as core from '@aws-cdk/core';
import { PipelineStack } from './pipeline-stack';

const deploymentAccount = {
  account: '418648875085', // gemeentenijmegen-deployment
  region: 'eu-west-1',
};

const app = new core.App();

new PipelineStack(app, 'esb-pipeline', { env: deploymentAccount });

app.synth();