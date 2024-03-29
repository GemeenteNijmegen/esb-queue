import { Stage, StageProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Configurable } from './Configuration';
import { esbGenericServicesStack } from './esb-generic-services-stack';
import { EsbIamStack } from './esb-iam-stack';

export interface EsbStageProps extends StageProps, Configurable {}

export class EsbStage extends Stage {

  constructor(scope: Construct, id: string, props: EsbStageProps) {
    super(scope, id, props);

    /**
       * Stack: esb generic services
       */
    const queues = new esbGenericServicesStack(this, 'esbGenericServices', {
      env: props.configuration.targetEnvironment,
      configuration: props.configuration,
    });

    /**
       * Stack: esb iam
       * Depends on GenericServicesStack
       */
    const iam = new EsbIamStack(this, 'esbIam', {
      env: props.configuration.targetEnvironment,
      configuration: props.configuration,
    });
    iam.addDependency(queues);

  }
}