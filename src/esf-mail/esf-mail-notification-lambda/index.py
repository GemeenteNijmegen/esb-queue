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

        # From metadata
        metadata = handler.get_metadata(msg)
        correlationId = metadata.get('correlationId')

        # Process entries from the esb
        data = handler.get_data(msg)
        if (data != None and metadata != None and len(data) > 0):
            for value in data:
                mail_address = value.get('e-mailadres')
                inleverdatum = value.get('inleverdatum')
                draaidatum = value.get('draaidatum')
                klantnummer = value.get('klantnummer')
                print('Trying to send mail to: ' + mail_address)
                message = handler.create_email_message(inleverdatum, draaidatum)
                recipients = [mail_address]
                handler.send_message(client, recipients, message, sender, s3, klantnummer, correlationId, backupBucketName)
    
    # Throw error if first part fails
    except ClientError as e:
        print(e.response['Error']['Message'])
    except KeyError as e:
        print('KeyError - reason "%s"' % str(e))
    else:
        print('Function completed!')