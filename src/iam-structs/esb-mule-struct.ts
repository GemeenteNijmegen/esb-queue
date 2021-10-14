import * as iam from '@aws-cdk/aws-iam';
import * as core from '@aws-cdk/core';

export interface esbIAMMuleProps extends core.StackProps {
  esbSqsArn: string;
  iamAccountPrincipal: string;
};

export class esbIAMMule extends core.Construct {
  constructor(scope: core.Construct, id: string, props: esbIAMMuleProps) {
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
      actions: ['sqs:*'], //TODO scope actions
      resources: [props.esbSqsArn],
    });

    policy.addStatements(sqs_statement);
    policy.attachToRole(esbSqsMuleRole);
  }
}