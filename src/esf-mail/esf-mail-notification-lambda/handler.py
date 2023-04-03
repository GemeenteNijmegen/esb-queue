import json
import boto3
import os
from botocore.exceptions import ClientError

def get_encoded_msg(event):
    """Get the (JSON) message as a python object from the SQS message,
    """
    msg = event['Records'][0]['body']
    return json.loads(msg)

def get_data(msg):
    data_list = msg.get('data')
    if(data_list != None and len(data_list) > 0):
        return data_list
    else:
        return None

def get_metadata(msg):
    metadata_list = msg.get('metadata')
    if(metadata_list != None and len(metadata_list) > 0):
        return metadata_list
    else:
        return None

def get_recipients(msg):
    """Get recipients from the received SQS message.
    It always returns a list of recipients, or None
    """
    recipient_list = msg.get('e-mailadressen')
    if(recipient_list != None and len(recipient_list) > 0):
        return recipient_list
    else:
        return None

def backup_message(s3, messageId, klantnummer, correlationId, backupBucketName):
    """Backup the message (including messageId, klantnummer and correlationID)
    to use when mail is bounced. CorrelationId is het ID generated by the ESB and
    it refers to the id of the batch (CSV).
    """
    try:
        # Create JSON object
        json_object = {"messageId": messageId, "klantnummer": klantnummer, "correlationId": correlationId}

        # Write to s3
        s3.put_object(
            Body=json.dumps(json_object), # Alternative: bytes(json_object).encode('UTF-8')
            Bucket=backupBucketName,
            Key=messageId,
            ContentType='application/json'
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return e
    else:
        print("Message backup to S3 using key:")
        print(messageId)


def send_message(client, recipients, message, sender, s3, klantnummer, correlationId, backupBucketName):
    """Send an email message via SES, using the provided
    values. Returns the SES response.
    """
    try:
        # Send mail
        response = client.send_email(
            Destination={
                'ToAddresses': recipients,
            },
            Message=message,
            Source=sender,
        )
        if (response != None):
            print("Message backup to S3. S3 Object ID:"),
            print(response['MessageId'])
            backup_message(s3, response['MessageId'], klantnummer, correlationId, backupBucketName)
    # Throw error if mail fails
    except ClientError as e:
        print(e.response['Error']['Message'])
        return e
    except KeyError as e:
        print('KeyError - reason "%s"' % str(e))
        return e
    else:
        if (response != None):
            print("Email sent! Message ID:"),
            print(response['MessageId'])
        else:
            print("No email send, recipients empty.")

def create_email_message(inleverdatum, draaidatum):
    """ Create the email body and subject in a format suitable for use
    in SES.
    """
    # The subject line for the email.
    subject = f"Notificatie formulier"
    
    # The email body for recipients with non-HTML email clients.
    body_text = ("Beste lezer,\r\n" 
                 "\r\n"
                 f"Het statusformulier van {draaidatum} staat voor u klaar.\r\n"
                 "\r\n"
                 f"Vul het formulier in vóór {inleverdatum}. Vult u het formulier later dan {inleverdatum} in, dan krijgt u uw uitkering later."
                )
                
    # The HTML body of the email.
    body_html = f"""<html>
    <body>
        <p>Beste lezer,</p>
        <p>Het statusformulier van {draaidatum} staat voor u klaar.</p>
        <p>Vul het formulier in vóór {inleverdatum}. Vult u het formulier later dan {inleverdatum} in, dan krijgt u uw uitkering later.</p>
        <p>Heeft u een partner, vul het formulier dan voor u en uw partner in.</p>
        <p>http://app6-accp.nijmegen.nl/#/form/ontwikkel/statusformulier</p>
    </body>
    </html>
                """

    charset = "UTF-8"
    return {
        'Body': {
            'Html': {
                'Charset': charset,
                'Data': body_html,
            },
            'Text': {
                'Charset': charset,
                'Data': body_text,
            },
        },
        'Subject': {
            'Charset': charset,
            'Data': subject,
        },
    }