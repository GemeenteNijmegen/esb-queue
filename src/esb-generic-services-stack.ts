import * as cloudwatch from '@aws-cdk/aws-cloudwatch';
import * as cloudwatch_actions from '@aws-cdk/aws-cloudwatch-actions';
import * as iam from '@aws-cdk/aws-iam';
import * as kms from '@aws-cdk/aws-kms';
import * as sns from '@aws-cdk/aws-sns';
import * as sqs from '@aws-cdk/aws-sqs';
import * as ssm from '@aws-cdk/aws-ssm';
import * as core from '@aws-cdk/core';

export class esbGenericServicesStack extends core.Stack {
  public readonly eformSqsArn: string; //used in IAM policy,

  constructor(scope: core.Construct, id: string, props: core.StackProps) {
    super(scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('Project', 'esb');

    /**
     * Custom KMS key for esb eform sqs connection.
     * Neccessary because the required permissions aren't included in the default key policy of the AWS managed KMS key for Amazon SQS, and you can't modify this policy.
     */
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

    /**
     * Sns Topic from eform project: eform submissions sns topic.
     */
    const eformSubmissionsSnsTopic = sns.Topic.fromTopicArn(this, 'eform-submissions-sns-topic', ssm.StringParameter.valueForStringParameter(this, '/cdk/eform/SNSsubmissionsArn'));

    /**
     * Sqs Dead-Letter Queue: receives 'failed' messages to the esb eform submissions queue.
     */
    const eformSqsDlq = new sqs.Queue(this, 'esb-eform-submissions-dlq', {
      queueName: 'esb-eform-submissions-dlq',
      encryption: sqs.QueueEncryption.KMS,
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
    this.eformSqsArn = eformSqs.queueArn;

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
              'aws:SourceArn': eformSubmissionsSnsTopic.topicArn,
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
     * Sns Topic from eform project: eform submissions delivery status sns topic.
     */
    const eformSubmissionsSnsDeliveryStatusTopic = sns.Topic.fromTopicArn(this, 'eform-submissions-sns-deliverystatus-topic', ssm.StringParameter.valueForStringParameter(this, '/cdk/eform/SnsSubmissionsDeliveryStatusArn'));

    /**
     * Cloudwatch Alarm that triggers when message from eform submissions is delivered to the esb dlq.
     */
    const cloudWatchAlarmEsbSqsDlq = new cloudwatch.Alarm(this, 'cloudwatch-alarm-esb-sqs-dlq', {
      metric: eformSqsDlq.metricNumberOfMessagesReceived({
        period: core.Duration.minutes(1), //TODO change to 30 sec because polling takes this amount of time?
      }),
      threshold: 0,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      alarmName: 'esb-eform-sqs-dlq-alarm',
      alarmDescription: 'CloudWatch alarm that triggers when number of messages returned by calls to the ReceiveMessage action exceeds 0 on esb sqs dlq.',
    });
    // Send alarm action to eform submissions delivery status sns topic, sends a message to the Teams channel.
    cloudWatchAlarmEsbSqsDlq.addAlarmAction(new cloudwatch_actions.SnsAction(eformSubmissionsSnsDeliveryStatusTopic));

    //TODO add parameters
  }
}