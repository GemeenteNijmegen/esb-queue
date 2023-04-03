import os
import boto3
from botocore.exceptions import ClientError

import handler

def lambda_handler(event, context):
    try:
        # Environment variables
        senderMailAdress = os.environ['SENDER_MAIL_ADRESS']
        backupBucketName = os.environ['BACKUP_BUCKET_NAME']

        msg = handler.get_encoded_msg(event)

        ##############################################
        ## Configure the email notification service ##
        ## and send the email.                      ##
        ##############################################
        # The AWS Region used for Amazon SES.
        aws_region = os.environ['AWS_REGION']
        client = boto3.client('ses',region_name=aws_region)
        s3 = boto3.client('s3')
        sender = f"Formulier Notificatie <{senderMailAdress}>"
        data = handler.get_data(msg)
        metadata = handler.get_metadata(msg)

        if (data != None and metadata != None and len(data) > 0):
            for value in data:
                mail_address = value.get('e-mailadres')
                print('Trying to send mail to: ' + mail_address)
                message = handler.create_email_message(value.get('inleverdatum'), value.get('draaidatum'))
                recipients = [mail_address]
                handler.send_message(client, recipients, message, sender, s3, value.get('klantnummer'), metadata.get('correlationId'), backupBucketName)
    
    # Throw error if first part fails
    except ClientError as e:
        print(e.response['Error']['Message'])
    except KeyError as e:
        print('KeyError - reason "%s"' % str(e))
    else:
        print('Function completed!')