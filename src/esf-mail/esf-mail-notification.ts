import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { Construct } from 'constructs';

/**
 * Sends email notifications to mailbox (Nijmegenaar) when certain ESF is ready to be filled in
 */
export function setupEsfNotificationMail(
  scope: Construct,
  domainName: string,
  esfMailRole: iam.Role,
) {

  const esfMailNotificationLambda = new lambda.Function(scope, 'esf-mail-notification-lambda', {
    description: 'Lambda to send email notifications to mailbox when a specific ESF is available',
    runtime: lambda.Runtime.PYTHON_3_9,
    handler: 'index.lambda_handler',
    code: lambda.Code.fromAsset('src/esf-mail/esf-mail-notification-lambda'),
    logRetention: RetentionDays.ONE_MONTH,
    timeout: core.Duration.seconds(120),
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
  const fnUrl = esfMailNotificationLambda.addFunctionUrl();
  fnUrl.grantInvokeUrl(esfMailRole);

  const esfMailNotificationSQSqueue = new sqs.Queue(scope, 'esf-mail-notification-sqs', {
    //TODO settings
  });
  esfMailNotificationSQSqueue.grantConsumeMessages(esfMailNotificationLambda);
}