import * as sqs from '@aws-cdk/aws-sqs';
import * as core from '@aws-cdk/core';
// import * as kms from '@aws-cdk/aws-kms';

export class esbGenericServicesStack extends core.Stack {
  public readonly eformSqsArn: string; //used in IAM policy,

  constructor(scope: core.Construct, id: string, props: core.StackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    //TODO do we want this kms key? (to use in sqs as masterencryptionkey)
    //const kmsKey = kms.Key.fromKeyArn(this, 'eform-kms-key', ssm.StringParameter.valueForStringParameter(this, '/cdk/eform/eform/KMSKeysArn'));

    const eformSqsDlq = new sqs.Queue(this, 'esb-eform-submissions-dlq', {
      queueName: 'esb-eform-submissions-dlq',
      encryption: sqs.QueueEncryption.KMS,
    });

    const eformSqs = new sqs.Queue(this, 'esb-eform-submissions-queue', {
      queueName: 'esb-eform-submissions-queue',
      encryption: sqs.QueueEncryption.KMS,
      deadLetterQueue: {
        queue: eformSqsDlq,
        maxReceiveCount: 1,
      },
    });

    this.eformSqsArn = eformSqs.queueArn;

    //TODO add parameters
  }
}