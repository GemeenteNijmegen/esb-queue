import json
import boto3
import os
from botocore.exceptions import ClientError

def get_encoded_msg(event):
    """Get the (JSON) message as a python object from the SQS message,
    """
    msg = event['Records'][0]['body']
    return json.loads(msg)

def get_recipients(msg):
    """Get recipients from the received SQS message.
    It always returns a list of recipients, or None
    """
    recipient_list = msg.get('e-mailadressen')
    if(recipient_list != None and len(recipient_list) > 0):
        return recipient_list
    else:
        return None



def send_message(client, recipients, message, sender):
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

def create_email_message():
    """ Create the email body and subject in a format suitable for use
    in SES.
    """
    # The subject line for the email.
    subject = f"Notificatie formulier"
    
    # The email body for recipients with non-HTML email clients.
    body_text = ("Beste lezer,\r\n" 
                 "\r\n"
                 f"Het statusformulier van [maand, jaartal] staat voor u klaar.\r\n"
                 "\r\n"
                 f"Vul het formulier in vóór [1 maand, jaartal]. Vult u het formulier later dan [1 maand, jaartal] in, dan krijgt u uw uitkering later."
                )
                
    # The HTML body of the email.
    body_html = f"""<html>
    <body>
        <p>Beste lezer,</p>
        <p>Het statusformulier van [maand, jaartal] staat voor u klaar.</p>
        <p>Vul het formulier in vóór [1 maand, jaartal]. Vult u het formulier later dan [1 maand, jaartal] in, dan krijgt u uw uitkering later.</p>
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