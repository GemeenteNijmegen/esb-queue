import * as core from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface esbIAMMuleProps extends core.StackProps {
  esbSqsArn: string;
  iamAccountPrincipal: string;
};

export class esbIAMMule extends Construct {
  constructor(scope: Construct, id: string, props: esbIAMMuleProps) {
    super(scope, id);

    /**
     * Role: wordt gebruikt door system accounts (Mule), dus geen MFA eisen
     */
    const esbSqsMuleRole = new iam.Role(this, 'esb-sqs-mule-role', {
      roleName: 'esb-sqs-mule',
      assumedBy: new iam.AccountPrincipal(props.iamAccountPrincipal),
      description: 'assumable role for Mule to get access to sqs queue',
    });

    const policy = new iam.ManagedPolicy(this, 'esb-sqs-poll', {
      managedPolicyName: 'esb-sqs-poll',
      description: 'custom access rights to poll from sqs',
    });

    const sqs_statement = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['sqs:Get*',
        'sqs:List*',
        'sqs:ReceiveMessage',
        'sqs:DeleteMessage'],
      resources: [props.esbSqsArn],
    });

    policy.addStatements(sqs_statement);
    policy.attachToRole(esbSqsMuleRole);
  }
}