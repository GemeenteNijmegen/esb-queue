import * as core from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { setupEsfNotificationMail } from './esf-mail/esf-mail-notification';
import { statics } from './statics';

export interface esbGenericServicesStackProps extends core.StackProps, Configurable {}

export class esbGenericServicesStack extends core.Stack {

  constructor(scope: Construct, id: string, props: esbGenericServicesStackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    /**
     * Custom KMS key for esb eform sqs connection.
     * Neccessary because the required permissions aren't included in the default key policy of the AWS managed KMS key for Amazon SQS, and you can't modify this policy.
     */
    const kmsKey = new kms.Key(this, 'esb-eform-sqs-key', {
      alias: 'esb/eform/sqs',
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

    /**
     * Sns Topic from eform project: eform submissions sns topic.
     */
    const region = core.Stack.of(this).region;
    const account = core.Stack.of(this).account;
    const eformSubmissionsSnsTopicArn = `arn:aws:sns:${region}:${account}:${statics.eformSubmissionsSnsTopicName}`;

    /**
     * Sqs Dead-Letter Queue: receives 'failed' messages to the esb eform submissions queue.
     */
    const eformSqsDlq = new sqs.Queue(this, 'esb-eform-submissions-dlq', {
      queueName: 'esb-eform-submissions-dlq',
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
    });

    /**
     * Sqs Queue: receives messages from eform submissions.
     */
    const eformSqs = new sqs.Queue(this, 'esb-eform-submissions-queue', {
      queueName: 'esb-eform-submissions-queue',
      encryption: sqs.QueueEncryption.KMS,
      encryptionMasterKey: kmsKey,
      deadLetterQueue: {
        queue: eformSqsDlq,
        maxReceiveCount: 1,
      },
    });

    new ssm.StringParameter(this, 'esb-eform-submissions-queue-arn', {
      parameterName: statics.ssmName_esbSqsArn,
      stringValue: eformSqs.queueArn,
    });

    /**
     * Policy document: custom access policy for eform sqs.
     */
    const eformSqsPolicyDocument = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          actions: ['sqs:sendMessage'],
          effect: iam.Effect.ALLOW,
          conditions: {
            ArnEquals: {
              'aws:SourceArn': eformSubmissionsSnsTopicArn,
            },
          },
          principals: [
            new iam.ServicePrincipal('sns.amazonaws.com'),
          ],
          resources: [
            eformSqs.queueArn,
          ],
        }),
      ],
    });
    new sqs.CfnQueuePolicy(this, 'eformSqsPolicyDocument', {
      queues: [eformSqs.queueUrl, eformSqsDlq.queueUrl],
      policyDocument: eformSqsPolicyDocument.toJSON(),
    });

    /**
     * Cloudwatch Alarm that triggers when message from eform submissions is delivered to the esb dlq.
     * Alarms are automatically picked up by aws-monitoring
     */
    new cloudwatch.Alarm(this, 'cloudwatch-alarm-esb-sqs-dlq', {
      metric: eformSqsDlq.metricNumberOfMessagesReceived({
        period: core.Duration.minutes(1), //TODO change to 30 sec because polling takes this amount of time?
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmName: 'esb-eform-sqs-dlq-alarm',
      alarmDescription: 'CloudWatch alarm that triggers when number of messages returned by calls to the ReceiveMessage action exceeds 0 on esb sqs dlq.',
    });

    /**
     * Configure the ESF notification mail.
     */
    setupEsfNotificationMail(this, props.configuration.domainName);

  }
}