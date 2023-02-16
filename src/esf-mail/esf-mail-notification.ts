import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaEventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';
import { statics } from '../statics';

/**
 * Sends email notifications to mailbox (Nijmegenaar) when certain ESF is ready to be filled in
 */
export function setupEsfNotificationMail(
  scope: Construct,
  domainName: string,
) {

  const esfMailNotificationLambda = new lambda.Function(scope, 'esf-mail-notification-lambda', {
    description: 'Lambda to send email notifications to mailbox when a specific ESF is available',
    runtime: lambda.Runtime.PYTHON_3_9,
    handler: 'index.lambda_handler',
    code: lambda.Code.fromAsset('src/esf-mail/esf-mail-notification-lambda'),
    logRetention: RetentionDays.ONE_MONTH,
    timeout: core.Duration.seconds(30),
    environment: {
      SENDER_MAIL_ADRESS: 'uitkeringsbeheer@' + domainName,
    },
    initialPolicy: [
      new iam.PolicyStatement({
        resources: ['*'], // Wildcard '*' because it's difficult to dynamically get the ses arn.
        actions: [
          'ses:SendEmail',
          'ses:SendRawEmail',
        ],
      }),
    ],
  });

  /**
   * Sqs Dead-Letter Queue: receives 'failed' messages from the esf mail notification queue.
   */
  const esfMailNotificationDLQ = new sqs.Queue(scope, 'esf-mail-notification-dlq', {
    encryption: sqs.QueueEncryption.KMS_MANAGED,
  });

  /**
  * Sqs Queue: receives messages (CSV) from esb.
  */
  const esfMailNotificationSQSqueue = new sqs.Queue(scope, 'esf-mail-notification-sqs', {
    encryption: sqs.QueueEncryption.KMS_MANAGED,
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
