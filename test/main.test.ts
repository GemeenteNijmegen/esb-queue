import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { PipelineStack } from '../src/pipeline-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test', {
    env: {
      account: '418648875085',
      region: 'eu-west-1',
    },
  });

  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});