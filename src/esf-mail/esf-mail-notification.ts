import { DeadLetterQueue, ErrorMonitoringAlarm } from '@gemeentenijmegen/aws-constructs';
import * as core from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { Configuration } from '../Configuration';
import { statics } from '../statics';

/**
 * Sends email notifications to mailbox (Nijmegenaar) when certain ESF is ready to be filled in
 */
export function setupEsfNotificationMail(
  scope: Construct,
  configuration: Configuration,
) {

  const domainName = configuration.domainName;

  /**
   * Bucket to backup all SES messages
   */
  const backupBucket = new s3.Bucket(scope, 'ses-mail-s3-backup-bucket', {
    removalPolicy: RemovalPolicy.DESTROY,
    lifecycleRules: [
      {
        id: 'delete objects after 180 days',
        enabled: true,
        expiration: core.Duration.days(180),
      },
    ],
  });

  new ssm.StringParameter(scope, 'ses-mail-backup-bucket-arn', {
    stringValue: backupBucket.bucketArn,
    parameterName: statics.ssmName_sesMailBackupBucketArn,
  });

  const esfMailNotificationLambda = new lambda.Function(scope, 'esf-mail-notification-lambda', {
    description: 'Lambda to send email notifications to mailbox when a specific ESF is available',
    runtime: lambda.Runtime.PYTHON_3_9,
    handler: 'index.lambda_handler',
    code: lambda.Code.fromAsset('src/esf-mail/esf-mail-notification-lambda'),
    logRetention: RetentionDays.SIX_MONTHS,
    timeout: core.Duration.minutes(10), // This is async so it doesn't realy matter as long as it is plenty to call SES for each email
    environment: {
      SENDER_MAIL_ADRESS: 'dsf@' + domainName,
      BACKUP_BUCKET_NAME: backupBucket.bucketName,
    },
    initialPolicy: [
      new iam.PolicyStatement({
        resources: ['*'], // Wildcard '*' because it's difficult to dynamically get the ses arn.
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
          's3:PutObject',
        ],
      }),
    ],
  });

  new ErrorMonitoringAlarm(scope, 'esf-mail-notificaiton-errors-alarm', {
    criticality: configuration.criticality.toString(),
    lambda: esfMailNotificationLambda,
    errorRateProps: {
      alarmThreshold: 1,
      alarmEvaluationPeriods: 1,
      alarmEvaluationPeriod: core.Duration.minutes(15),
    },
  });

  /**
   * Sqs Dead-Letter Queue: receives 'failed' messages from the esf mail notification queue.
   */
  const esfMailNotificationDLQ = new sqs.Queue(scope, 'esf-mail-notification-dlq-fifo', {
    encryption: sqs.QueueEncryption.KMS_MANAGED,
    fifo: true,
  });

  new DeadLetterQueue(scope, 'dlq-alarm', {
    dlq: esfMailNotificationDLQ,
    alarm: true,
    alarmName: 'esf-emails-alarm',
    alarmDescription: 'Failed to send ESF emails',
    alarmCriticality: configuration.criticality,
  });

  /**
  * Sqs Queue (fifo): receives messages (CSV) from esb.
  */
  const esfMailNotificationSQSqueue = new sqs.Queue(scope, 'esf-mail-notification-sqs-fifo', {
    encryption: sqs.QueueEncryption.KMS_MANAGED,
    fifo: true, // To enable exactly-once processing
    visibilityTimeout: core.Duration.minutes(11), // Must be > function timeout
    deadLetterQueue: {
      queue: esfMailNotificationDLQ,
      maxReceiveCount: 1,
    },
  });
  esfMailNotificationSQSqueue.grantConsumeMessages(esfMailNotificationLambda);

  // Add lambda to SQS event source (lamdba trigger)
  esfMailNotificationLambda.addEventSource(new lambdaEventSources.SqsEventSource(esfMailNotificationSQSqueue));

  new ssm.StringParameter(scope, 'esf-mail-notification-sqs-arn', {
    stringValue: esfMailNotificationSQSqueue.queueArn,
    parameterName: statics.ssmName_esfMailNotificationArn,
  });
}
