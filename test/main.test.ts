import '@aws-cdk/assert/jest';
import { App } from '@aws-cdk/core';
import { PipelineStack } from '../src/pipeline-stack';

test('Snapshot', () => {
  const app = new App();
  const stack = new PipelineStack(app, 'test');

  expect(stack).not.toHaveResource('AWS::S3::Bucket');
  expect(app.synth().getStackArtifact(stack.artifactId).template).toMatchSnapshot();
});