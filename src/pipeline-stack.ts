import { PermissionsBoundaryAspect } from '@gemeentenijmegen/aws-constructs';
import {
  Aspects,
  Stack,
  StackProps,
  Tags,
  pipelines,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { EsbStage } from './EsbStage';
import { statics } from './statics';


export interface PipelineStackProps extends StackProps, Configurable{}

export class PipelineStack extends Stack {

  branchName: string;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super (scope, id, props);
    Tags.of(this).add('cdkManaged', 'yes');
    Tags.of(this).add('project', statics.projectName);
    if (props.configuration.isInNewLandingzone) {
      Aspects.of(this).add(new PermissionsBoundaryAspect());
    }

    this.branchName = props.configuration.branchName;

    const pipeline = this.pipeline(props);

    // **Stages**
    pipeline.addStage( new EsbStage(this, props.configuration.esbStageName??'esb-stage', {
      env: props.configuration.targetEnvironment,
      configuration: props.configuration,
    }));
  }

  pipeline(props: PipelineStackProps): pipelines.CodePipeline {
    const source = pipelines.CodePipelineSource.connection('GemeenteNijmegen/esb-queue', this.branchName, {
      connectionArn: props.configuration.codeStarConnectionArn,
    });

    const pipeline = new pipelines.CodePipeline(this, `esb-pipeline-${this.branchName}`, {
      pipelineName: `esb-${this.branchName}`,
      crossAccountKeys: true,
      synth: new pipelines.ShellStep('Synth', {
        input: source,
        env: {
          BRANCH_NAME: this.branchName,
        },
        commands: [
          'yarn install --frozen-lockfile',
          'yarn build',
        ],
      }),
    });
    return pipeline;
  }
}