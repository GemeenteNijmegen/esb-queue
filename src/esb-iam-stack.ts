import * as core from '@aws-cdk/core';
import { esbIAMMule } from './iam-structs/esb-mule-struct';
import { statics } from './statics';

export interface iamStackProps extends core.StackProps {
  esbSqsArn: string;
};

export class esbIamStack extends core.Stack {
  constructor(scope: core.Construct, id: string, props: iamStackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    /**
     * IAM Construct for mule
     */
    new esbIAMMule(this, 'esbMule', {
      iamAccountPrincipal: statics.AWS_ACCOUNT_IAM,
      esbSqsArn: props.esbSqsArn,
    });
  }
}