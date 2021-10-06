import * as codecommit from '@aws-cdk/aws-codecommit';
import * as core from '@aws-cdk/core';
import * as cdkpipelines from '@aws-cdk/pipelines';

export class EmptyStack extends core.Stack {}

export class EmptyyStack extends core.Stack {}

class emptyStage extends core.Stage {

  constructor(scope: core.Construct, id: string, props: core.StageProps) {
    super(scope, id, props);

    new EmptyStack(this, 'empty');
  }
}

class emptyyStage extends core.Stage {

  constructor(scope: core.Construct, id: string, props: core.StageProps) {
    super(scope, id, props);

    new EmptyyStack(this, 'emptyy');
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

    const pipeline = new cdkpipelines.CodePipeline(this, 'pipeline', {
      pipelineName: 'esb-pipeline',
      crossAccountKeys: true,
      synth: new cdkpipelines.ShellStep('Synth', {
        input: cdkpipelines.CodePipelineSource.codeCommit(repository, 'main'),
        commands: [
          'yarn install --frozen-lockfile', //nodig om projen geinstalleerd te krijgen
          'npx projen build',
          'npx projen synth',
        ],
      }),
    });

    pipeline.addStage( new emptyStage(this, 'empty', {}),
    );

    pipeline.addStage( new emptyyStage(this, 'emptyy', {}),
    );
  }
}