import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { statics } from '../statics';

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

      // Allow a user from webformulieren access as well so that the ESB only has to use one user.
      const accountId = core.Stack.of(this).account;
      const webformsEsbUserArn = `arn:aws:iam::${accountId}:user/${statics.WEBFORMS_ESB_USER_NAME}`;

      // Note: uses condition to prevent hard dependency on webforms project (keep this project deployable without webforms)
      //       as webforms already has a dependency on this project do not make it circular!
      esbSqsMuleRole = new iam.Role(this, 'esb-sqs-mule-role', {
        roleName: 'esb-sqs-mule',
        assumedBy: new iam.PrincipalWithConditions(new iam.AnyPrincipal(), {
          ArnEquals: {
            'aws:PrincipalArn': webformsEsbUserArn,
          },
        }),
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