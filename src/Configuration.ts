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

}

export const configurations: { [key: string]: Configuration } = {
  development: {
    branchName: 'development',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsDevEnvironment,
    domainName: 'webforms-dev.csp-nijmegen.nl',
  },
  acceptance: {
    branchName: 'acceptance',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsAccpEnvironment,
    domainName: 'webforms-accp.csp-nijmegen.nl',
  },
  main: {
    branchName: 'main',
    codeStarConnectionArn: statics.gnBuildCodeStarConnectionArn,
    deploymentEnvironment: statics.gnBuildEnvironment,
    targetEnvironment: statics.gnWebformsProdEnvironment,
    domainName: 'nijmegen.nl',
  },
};

export function getConfiguration(buildBranch: string) {
  const config = configurations[buildBranch];
  if (!config) {
    throw Error(`No configuration for branch ${buildBranch} found. Add a configuration in Configuration.ts`);
  }
  return config;
}