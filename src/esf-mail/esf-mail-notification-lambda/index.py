import os
import boto3
from botocore.exceptions import ClientError

import handler

def lambda_handler(event, context):
    try:
        # Environment variables
        senderMailAdress = os.environ['SENDER_MAIL_ADRESS']

        msg = handler.get_encoded_msg(event)

        ##############################################
        ## Configure the email notification service ##
        ## and send the email.                      ##
        ##############################################
        sender = f"Formulier Notificatie <{senderMailAdress}>"
        recipients = handler.get_recipients(msg)
        if (recipients != None):        
            message = handler.create_email_message()   
            
            # The AWS Region used for Amazon SES.
            aws_region = os.environ['AWS_REGION']
            client = boto3.client('ses',region_name=aws_region)
            handler.send_message(client, recipients, message, sender)
    
    # Throw error if first part fails
    except ClientError as e:
        print(e.response['Error']['Message'])
    except KeyError as e:
        print('KeyError - reason "%s"' % str(e))
    else:
        print('Function completed!')