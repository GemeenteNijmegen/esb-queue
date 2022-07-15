import { App } from 'aws-cdk-lib';
import { PipelineStack } from './pipeline-stack';

const deploymentAccount = {
  account: '418648875085', // gemeentenijmegen-deployment
  region: 'eu-west-1',
};

const app = new App();

new PipelineStack(app, 'esb-pipeline', { env: deploymentAccount });

app.synth();