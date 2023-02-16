import * as core from 'aws-cdk-lib';
import { StackProps, aws_ssm as ssm } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { esbIAMMule } from './iam-structs/esb-mule-struct';
import { statics } from './statics';


export class esbIamStack extends core.Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    const esbSqsArn = ssm.StringParameter.valueForStringParameter(this, statics.ssmName_esbSqsArn);
    const esfMailNotificationSqsArn = ssm.StringParameter.valueForStringParameter(this, statics.ssmName_esfMailNotificationArn);

    /**
     * IAM Construct for mule
     */
    new esbIAMMule(this, 'esbMule', {
      iamAccountPrincipal: statics.AWS_ACCOUNT_IAM,
      esbSqsArn: esbSqsArn,
      esfMailNotificationSqsArn: esfMailNotificationSqsArn,
    });
  }
}