import { 
  Stage,
  StageProps,
  Stack,
  StackProps,
  Tags,
  pipelines,
} from 'aws-cdk-lib';
import * as cdkpipelines from 'aws-cdk-lib/pipelines';
import { Construct } from 'constructs';
import { esbGenericServicesStack } from './esb-generic-services-stack';
import { esbIamStack } from './esb-iam-stack';
import { statics } from './statics';

class esbStage extends Stage {

  constructor(scope: Construct, id: string, props: StageProps) {
    super(scope, id, props);

    /**
     * Stack: esb generic services
     */
    const esbGenericsStack = new esbGenericServicesStack(this, 'esbGenericServices', {});

    /**
     * Stack: esb iam
     * Depends on GenericServicesStack
     */
    new esbIamStack(this, 'esbIam', {
      esbSqsArn: esbGenericsStack.eformSqsArn,
    });
  }
}

export class PipelineStack extends Stack {

  constructor(scope: Construct, id: string, props?: StackProps) {
    super (scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('project', 'esb');

    /**
     * Main repository
     */
    const source = pipelines.CodePipelineSource.connection(statics.projectRepo, 'main', {
      connectionArn: statics.codeStarConnectionArn,
    });

    /**
     * Main pipeline
     */
    const pipeline = new cdkpipelines.CodePipeline(this, 'pipeline', {
      pipelineName: 'esb-pipeline',
      crossAccountKeys: true,
      synth: new cdkpipelines.ShellStep('Synth', {
        input: cdkpipelines.CodePipelineSource.codeCommit(repository, 'main'),
        commands: [
          'yarn install --frozen-lockfile', //nodig om projen geinstalleerd te krijgen
          'yarn build',
        ],
      }),
    });

    pipeline.addStage( new esbStage(this, 'esbAcceptance', {
      env: {
        account: statics.AWS_ACCOUNT_AUTH_ACCP,
        region: 'eu-west-1',
      },
    }),
    );

    pipeline.addStage( new esbStage(this, 'esbProduction', {
      env: {
        account: statics.AWS_ACCCOUNT_AUTH_PROD,
        region: 'eu-west-1',
      },
    }),
    );
  }
}