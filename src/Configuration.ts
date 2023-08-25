import { statics } from './statics';

/**
 * Custom Environment with obligatory accountId and region
 */
export interface Environment {
  account: string;
  region: string;
}

export interface Configurable {
  configuration: Configuration;
}

export interface Configuration {
  /**
     * The git branch name to which this configuration applies.
     */
  branchName: string;

  /**
     * Code star connection arn in the deployment environment
     */
  codeStarConnectionArn: string;

  /**
     * Deployment environment
     */
  deploymentEnvironment: Environment;

  /**
     * Target environment
     */
  targetEnvironment: Environment;

  /**
   * Domain name
   */
  domainName: string;

  /**
   * ESB stage name
   */
  esbStageName?: string;

  /**
   * Flag to indicate that the workload is
   * deployed to the new landingzone
   */
  isInNewLandingzone?: boolean;

}

export const configurations: { [key: string]: Configuration } = {
  'development-new-lz': {
    branchName: 'development-new-lz',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsDevEnvironment,
    domainName: 'dev.csp-nijmegen.nl',
    isInNewLandingzone: true,
  },
  'acceptance-new-lz': {
    branchName: 'acceptance-new-lz',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsAccpEnvironment,
    domainName: 'accp.csp-nijmegen.nl',
    isInNewLandingzone: true,
  },
  'main-new-lz': {
    branchName: 'main-new-lz',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsProdEnvironment,
    domainName: 'nijmegen.nl',
    isInNewLandingzone: true,
  },
  'development': {
    branchName: 'development',
    codeStarConnectionArn: statics.codeStarConnectionArn,
    deploymentEnvironment: statics.deploymentEnvironment,
    targetEnvironment: statics.sandboxEnvironment,
    domainName: 'dev.csp-nijmegen.nl',
  },
  'acceptance': {
    branchName: 'acceptance',
    codeStarConnectionArn: statics.codeStarConnectionArn,
    deploymentEnvironment: statics.deploymentEnvironment,
    targetEnvironment: statics.acceptanceEnvironment,
    domainName: 'accp.csp-nijmegen.nl',
    esbStageName: 'esbAcceptance',
  },
  'main': {
    branchName: 'main',
    codeStarConnectionArn: statics.codeStarConnectionArn,
    deploymentEnvironment: statics.deploymentEnvironment,
    targetEnvironment: statics.productionEnvironment,
    domainName: 'nijmegen.nl',
    esbStageName: 'esbProduction',
  },
};

export function getConfiguration(buildBranch: string) {
  const config = configurations[buildBranch];
  if (!config) {
    throw Error(`No configuration for branch ${buildBranch} found. Add a configuration in Configuration.ts`);
  }
  return config;
}