import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface esbIAMMuleProps extends core.StackProps {
  esbSqsArn: string;
  esfMailNotificationSqsArn: string;
  iamAccountPrincipal: string;
  isInNewLandingzone?: boolean;
};

export class esbIAMMule extends Construct {
  constructor(scope: Construct, id: string, props: esbIAMMuleProps) {
    super(scope, id);

    let esbSqsMuleRole = undefined;
    if (props.isInNewLandingzone) {
      // In the new lz the iam user lives in the account
      const user = new iam.User(this, 'esb-sqs-mule-user');
      const key = new iam.AccessKey(this, 'esb-sqs-mule-user-key', { user });
      new Secret(this, 'esb-sqs-mule-user-secret', {
        description: 'Secret key for ESB mule user to poll the esb-queue',
        secretStringValue: key.secretAccessKey,
      });
      esbSqsMuleRole = new iam.Role(this, 'esb-sqs-mule-role', {
        roleName: 'esb-sqs-mule',
        assumedBy: user,
        description: 'assumable role for Mule to get access to sqs queue',
      });
    } else {
      // Role: wordt gebruikt door system accounts (Mule), dus geen MFA eisen
      esbSqsMuleRole = new iam.Role(this, 'esb-sqs-mule-role', {
        roleName: 'esb-sqs-mule',
        assumedBy: new iam.AccountPrincipal(props.iamAccountPrincipal),
        description: 'assumable role for Mule to get access to sqs queue',
      });
    }

    const policy = new iam.ManagedPolicy(this, 'esb-sqs-poll', {
      managedPolicyName: 'esb-sqs-poll',
      description: 'custom access rights to poll from sqs',
    });

    const sqs_pull_statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:Get*',
        'sqs:List*',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage'],
      resources: [props.esbSqsArn],
    });

    const sqs_push_statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:Get*',
        'sqs:List*',
        'sqs:SendMessage'],
      resources: [props.esfMailNotificationSqsArn],
    });

    policy.addStatements(sqs_pull_statement);
    policy.addStatements(sqs_push_statement);
    policy.attachToRole(esbSqsMuleRole);
  }
}