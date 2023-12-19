/**
 * Class with only static strings for naming of ssm paramaters
 * and re-use in stacks and constructs
 */
export class statics {
  //Statics for accountnames and numbers
  static readonly AWS_ACCOUNT_AUTH_ACCP: string = '315037222840';
  static readonly AWS_ACCCOUNT_AUTH_PROD: string = '196212984627';
  static readonly AWS_ACCOUNT_DEPLOYMENT: string = '418648875085';
  static readonly AWS_ACCOUNT_IAM: string = '098799052470';
  // New lz
  static readonly AWS_ACCOUNT_GN_BUILD: string = '836443378780';
  static readonly AWS_ACCOUNT_WEBFORMS_DEV: string = '033598396027';
  static readonly AWS_ACCOUNT_WEBFORMS_ACCP: string = '338472043295';
  static readonly AWS_ACCOUNT_WEBFORMS_PROD: string = '147064197580';

  static readonly projectName: string = 'esb-queue';

  // User in the webformulieren project has a name
  static readonly WEBFORMS_ESB_USER_NAME = 'webforms-esb-user';


  static readonly eformSubmissionsSnsTopicName = 'eform-submissions';

  /**
   * Pipeline values
   */
  static readonly codeStarConnectionArn: string = 'arn:aws:codestar-connections:eu-west-1:418648875085:connection/4f647929-c982-4f30-94f4-24ff7dbf9766';
  static readonly gnBuildCodeStarConnectionArn = 'arn:aws:codestar-connections:eu-central-1:836443378780:connection/9d20671d-91bc-49e2-8680-59ff96e2ab11';
  static readonly projectRepo: string = 'GemeenteNijmegen/esb-queue';

  /**
   * SSM Parameters
   */
  static readonly ssmName_esbSqsArn: string = '/cdk/esb/queue/arn';
  static readonly ssmName_esfMailNotificationArn: string = '/cdk/esb/esf/notificationMail/arn';
  static readonly ssmName_sesMailBackupBucketArn: string = '/cdk/esb/sesMailBackupBucketArn/arn';

  /**
   * Environment variables
   */
  static readonly deploymentEnvironment = {
    account: '418648875085',
    region: 'eu-west-1',
  };

  static readonly sandboxEnvironment = {
    account: '122467643252',
    region: 'eu-west-1',
  };

  static readonly acceptanceEnvironment = {
    account: '315037222840',
    region: 'eu-west-1',
  };

  static readonly productionEnvironment = {
    account: '196212984627',
    region: 'eu-west-1',
  };

  static readonly gnBuildEnvironment = {
    account: statics.AWS_ACCOUNT_GN_BUILD,
    region: 'eu-central-1',
  };

  static readonly gnWebformsDevEnvironment = {
    account: statics.AWS_ACCOUNT_WEBFORMS_DEV,
    region: 'eu-central-1',
  };

  static readonly gnWebformsAccpEnvironment = {
    account: statics.AWS_ACCOUNT_WEBFORMS_ACCP,
    region: 'eu-central-1',
  };

  static readonly gnWebformsProdEnvironment = {
    account: statics.AWS_ACCOUNT_WEBFORMS_PROD,
    region: 'eu-central-1',
  };


}