import * as codecommit from '@aws-cdk/aws-codecommit';
import * as core from '@aws-cdk/core';
import * as cdkpipelines from '@aws-cdk/pipelines';

class emptyStage extends core.Stage {

  constructor(scope: core.Construct, id: string, props: core.StageProps) {
    super(scope, id, props);

  }
}

class emptyyStage extends core.Stage {

  constructor(scope: core.Construct, id: string, props: core.StageProps) {
    super(scope, id, props);

  }
}

export class PipelineStack extends core.Stack {

  constructor(scope: core.Construct, id: string, props?: core.StackProps) {
    super (scope, id, props);
    core.Tags.of(this).add('cdkManaged', 'yes');
    core.Tags.of(this).add('project', 'esb');

    /**
         * Main repository
         */
    const repository = new codecommit.Repository(this, 'repository', {
      repositoryName: 'esb-repository',
    });

    if (process.env.BRANCH_NAME === 'acceptance') {
      const acceptancePipeline = new cdkpipelines.CodePipeline(this, 'acceptancePipeline', {
        pipelineName: 'esb-pipeline-acceptance',
        crossAccountKeys: true,
        synth: new cdkpipelines.ShellStep('Synth', {
          input: cdkpipelines.CodePipelineSource.codeCommit(repository, 'acceptance'),
          env: {
            BRANCH_NAME: '#{SourceVariables.BranchName}',
          },
          commands: [
            'yarn install --frozen-lockfile', //nodig om projen geinstalleerd te krijgen
            'npx projen build',
            'npx projen synth',
          ],
        }),
      });

      acceptancePipeline.addStage( new emptyStage(this, 'empty', {

      }),
      );

      acceptancePipeline.addStage( new emptyyStage(this, 'emptyy', {

      }),
      );
    }

    if (process.env.BRANCH_NAME === 'production') {
      const productionPipeline = new cdkpipelines.CodePipeline(this, 'productionPipeline', {
        pipelineName: 'esb-pipeline-production',
        crossAccountKeys: true,
        synth: new cdkpipelines.ShellStep('Synth', {
          input: cdkpipelines.CodePipelineSource.codeCommit(repository, 'production'),
          env: {
            BRANCH_NAME: '#{SourceVariables.BranchName}',
          },
          commands: [
            'yarn install --frozen-lockfile', //nodig om projen geinstalleerd te krijgen
            'npx projen build',
            'npx projen synth',
          ],
        }),
      });

      productionPipeline.addStage( new emptyStage(this, 'empty', {

      }),
      );

      productionPipeline.addStage( new emptyyStage(this, 'emptyy', {

      }),
      );
    }
  }
}