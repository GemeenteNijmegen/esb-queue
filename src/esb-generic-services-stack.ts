import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as sqs from '@aws-cdk/aws-sqs';
import * as core from '@aws-cdk/core';

export class esbGenericServicesStack extends core.Stack {
  public readonly eformSqsArn: string; //used in IAM policy,

  constructor(scope: core.Construct, id: string, props: core.StackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    // Custom KMS neccessary: The required permissions aren't included in the default key policy of the AWS managed KMS key for Amazon SQS, and you can't modify this policy.
    const kmsKey = new kms.Key(this, 'esb-eform-sqs-key', {
      alias: 'nijmegen/esb/sqs',
      enableKeyRotation: true,
      description: 'Custom KMS key for publishing messages from eform-submissions sns topic to the esb sqs queue.',
    });

    kmsKey.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'Allow esb SQS Queue to receive messages from the eform-submissions SNS topic.',
      effect: iam.Effect.ALLOW,
      principals: [new iam.AnyPrincipal],
      actions: [
        'kms:Encrypt',
        'kms:Decrypt',
        'kms:GenerateDataKey',
      ],
      resources: ['*'],
    }));

    const eformSqsDlq = new sqs.Queue(this, 'esb-eform-submissions-dlq', {
      queueName: 'esb-eform-submissions-dlq',
      encryption: sqs.QueueEncryption.KMS,
    });

    const eformSqs = new sqs.Queue(this, 'esb-eform-submissions-queue', {
      queueName: 'esb-eform-submissions-queue',
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      deadLetterQueue: {
        queue: eformSqsDlq,
        maxReceiveCount: 1,
      },
    });

    this.eformSqsArn = eformSqs.queueArn;

    //TODO add parameters
  }
}