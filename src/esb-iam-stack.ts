import * as core from 'aws-cdk-lib';
import { StackProps, aws_ssm as ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { esbIAMMule } from './iam-structs/esb-mule-struct';
import { statics } from './statics';

export interface EsbIamStackProps extends StackProps, Configurable { }

export class EsbIamStack extends core.Stack {
  constructor(scope: Construct, id: string, props: EsbIamStackProps) {
    super(scope, id, props);

    const esbSqsArn = ssm.StringParameter.valueForStringParameter(this, statics.ssmName_esbSqsArn);
    const esfMailNotificationSqsArn = ssm.StringParameter.valueForStringParameter(this, statics.ssmName_esfMailNotificationArn);

    /**
     * IAM Construct for mule
     */
    new esbIAMMule(this, 'esbMule', {
      iamAccountPrincipal: statics.AWS_ACCOUNT_IAM,
      esbSqsArn: esbSqsArn,
      esfMailNotificationSqsArn: esfMailNotificationSqsArn,
      isInNewLandingzone: props.configuration.isInNewLandingzone,
    });
  }
}