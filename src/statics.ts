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

  /**
   * Pipeline values
   */
  static readonly codeStarConnectionArn: string = 'arn:aws:codestar-connections:eu-west-1:418648875085:connection/4f647929-c982-4f30-94f4-24ff7dbf9766';
  static readonly projectRepo : string = 'GemeenteNijmegen/esb-queue';

  /**
   * SSM Parameters
   */
  static readonly ssmName_esbSqsArn: string = '/cdk/esb/queue/arn';
  static readonly ssmNmae_esfMailNotificationArn: string = '/cdk/esb/esf/notificationMail/arn';

}