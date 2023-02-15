import pytest
import os
import sys
import boto3
import json

from moto import mock_s3, mock_ses

sys.path.append(os.path.join(os.path.dirname(
    os.path.realpath(__file__)), "../../email-notification-lambda"))
import handler

@mock_s3
def test_formconfig(sample_config):
    """Test getting formconfig from bucket
    """
    os.environ['FORM_CONFIG_BUCKET_NAME'] = 'mybucket'
    mock_s3_bucket(sample_config)
    config = handler.get_formconfig('testform')
    assert config.get('formName') == 'testForm'

@mock_s3
def test_recipients(sample_config):
    """Test getting recipients from formconfig
    """
    os.environ['FORM_CONFIG_BUCKET_NAME'] = 'mybucket'
    mock_s3_bucket(sample_config)
    config = handler.get_formconfig('testform')
    recipients = handler.get_recipients(config, {})
    assert len(recipients) > 0
    assert isinstance(recipients[0], str)
    assert recipients == ['test@example.com']



def test_msg_from_event(sns_event):
    """Test parsing and validation of events
    """
    msg = handler.get_encoded_msg(sns_event)
    form_name = msg["formTypeId"]
    assert form_name == 'testForm'


def test_sharelocation(sample_config, sns_event):
    msg = handler.get_encoded_msg(sns_event)
    url = handler.get_shareurl(sample_config, msg)
    assert url == 'file:\\\\\\//test/testForm-APV13.022'

def test_sharelocation_multiple_appids(sample_config_multiple_appids, sns_event):
    msg = handler.get_encoded_msg(sns_event)
    url = handler.get_shareurl(sample_config_multiple_appids, msg)
    assert url == 'file:\\\\\\//test2/testForm-APV13.022'

@mock_s3
def test_recipients_multiple_appids(sample_config_multiple_appids, sns_event):
    """Test getting recipients from formconfig for multiple appids
    """
    os.environ['FORM_CONFIG_BUCKET_NAME'] = 'mybucket'
    mock_s3_bucket(sample_config_multiple_appids)
    config = handler.get_formconfig('testform')
    msg = handler.get_encoded_msg(sns_event)
    recipients = handler.get_recipients(config, msg)
    assert len(recipients) > 0
    assert isinstance(recipients[0], str)
    assert recipients == ['tst12@example.com']


@mock_ses
def test_email_message(sns_event):
    msg = handler.get_encoded_msg(sns_event)
    reference = msg["reference"]
    msg = handler.create_email_message('testForm', reference, 'file:\\\test')
    assert "aanvraag 'testForm' ingediend" in msg['Body']['Html']['Data']

    # Send the email (mocked)
    sender = f"Formulier Notificatie <other@example.com>"
    client = boto3.client('ses', region_name='eu-west-1')
    client.verify_email_identity(EmailAddress='other@example.com')
    response = handler.send_message(client, ['me@example.com'], msg, sender)
    assert response['ResponseMetadata']['HTTPStatusCode'] == 200


@mock_s3
def mock_s3_bucket(sample_config):
    client = boto3.client('s3')
    conn = boto3.resource('s3', region_name='us-east-1')
    # We need to create the bucket since this is all in Moto's 'virtual' AWS account
    bucket = conn.create_bucket(Bucket='mybucket')
    client.put_object(
        Bucket="mybucket", Key='form-config/json/testform', Body=json.dumps(sample_config))

    return bucket


@pytest.fixture
def sample_config():
    return {
        "formName": "testForm",
        "loginTypes": [
            {
                "authMethod": "digid",
                "authLevel": "default",
                "authAttributes": [
                    "/Persoon/Persoonsgegevens/Naam",
                    "/Persoon/BSN/BSN",
                    "/Persoon/Persoonsgegevens/Voorletters",
                    "/Persoon/Persoonsgegevens/Voorvoegsel",
                    "/Persoon/Persoonsgegevens/Voornamen",
                    "/Persoon/Persoonsgegevens/Achternaam",
                    "/Persoon/Persoonsgegevens/Geslachtsnaam",
                    "/Persoon/Persoonsgegevens/Geboortedatum",
                    "/Persoon/Persoonsgegevens/Geslacht",
                    "/Persoon/Persoonsgegevens/Geboorteland",
                    "/Persoon/Adres/Straat",
                    "/Persoon/Adres/Huisnummer",
                    "/Persoon/Adres/Postcode",
                    "/Persoon/Adres/Gemeente",
                    "/Persoon/Adres/Woonplaats"
                ]
            },
            {
                "authMethod": "eherkenning",
                "authLevel": "LOA3",
                "authAttributes": [
                    "/naam",
                    "/_embedded/hoofdvestiging/adressen/0/straatnaam",
                    "/_embedded/hoofdvestiging/adressen/0/huisnummer",
                    "/_embedded/hoofdvestiging/adressen/0/postcode",
                    "/_embedded/hoofdvestiging/adressen/0/plaats"
                ]
            }
        ],
        "callBackUrl": "https://nijmegen.nl/",
        "provisionalSavingAllowed": False,
        "appId": "test",
        "shareLocation": {
            "root": "//test/",
            "folder": "{formTypeId}-{reference}"
        },
        "recipients": ["test@example.com"]
    }


@pytest.fixture
def sample_config_multiple_appids():
    return {
        "formName": "testForm",
        "loginTypes": [
            {
                "authMethod": "digid",
                "authLevel": "default",
                "authAttributes": [
                    "/Persoon/Persoonsgegevens/Naam",
                    "/Persoon/BSN/BSN",
                    "/Persoon/Persoonsgegevens/Voorletters",
                    "/Persoon/Persoonsgegevens/Voorvoegsel",
                    "/Persoon/Persoonsgegevens/Voornamen",
                    "/Persoon/Persoonsgegevens/Achternaam",
                    "/Persoon/Persoonsgegevens/Geslachtsnaam",
                    "/Persoon/Persoonsgegevens/Geboortedatum",
                    "/Persoon/Persoonsgegevens/Geslacht",
                    "/Persoon/Persoonsgegevens/Geboorteland",
                    "/Persoon/Adres/Straat",
                    "/Persoon/Adres/Huisnummer",
                    "/Persoon/Adres/Postcode",
                    "/Persoon/Adres/Gemeente",
                    "/Persoon/Adres/Woonplaats"
                ]
            },
            {
                "authMethod": "eherkenning",
                "authLevel": "LOA3",
                "authAttributes": [
                    "/naam",
                    "/_embedded/hoofdvestiging/adressen/0/straatnaam",
                    "/_embedded/hoofdvestiging/adressen/0/huisnummer",
                    "/_embedded/hoofdvestiging/adressen/0/postcode",
                    "/_embedded/hoofdvestiging/adressen/0/plaats"
                ]
            }
        ],
        "callBackUrl": "https://nijmegen.nl/",
        "provisionalSavingAllowed": False,
        "appId": "test",
        "shareLocation": {
            "TS2": {
                "root": "//test/",
                "folder": "{formTypeId}-{reference}"
            },
            "TST": {
                "root": "//test2/",
                "folder": "{formTypeId}-{reference}"
            }
        },
        "recipients": {
            "TS2": ["testmultiple@example.com"], 
            "TST": ["tst12@example.com"]
        }
    }


@pytest.fixture
def sns_event():
    return {
        "Records": [
            {
                "EventSource": "aws:sns",
                "EventVersion": "1.0",
                "EventSubscriptionArn": "test",
                "Sns": {
                    "Type": "Notification",
                    "MessageId": "ac23f311-afbf-595b-8724-a9cbb820ba82",
                    "TopicArn": "submission",
                    "Subject": "",
                    "Message": "{\"formId\":\"Uoqt0IfsElCXYhzZX_xRHK_kXKU\",\"formTypeId\":\"testForm\",\"appId\":\"TST\",\"reference\":\"APV13.022\",\"data\":{}}",
                    "Timestamp": "2022-04-20T14:14:55.954Z",
                    "SignatureVersion": "1",
                    "Signature": "iucOxhsGTBL/goRAZBqcgYGT6A99JOdE/kTVSvlg0ZDNzWthyjyGWnKPuVTPXAIMb+YBgcXDL56s+hSAI967hzMM6sku5BF9bBBLA8L6l9azKMbH3AlM0+McYMTaEHhOXTuv/it6OWOoutTAimkkoONPDeACeQHqgyfaALO1D8+AoNuRknTLKsKUJzvBXPQWUxJwQBRIVP6tOoatyHtl4v6YlZzlmsAglnG1cVZIb7yF5xKO3hUkbZVdDMt9jkG/o6XScoBhgXys1fyZSdwcaPIWBymAha3gsERl2GdXgQunSpTNnWW+rRbChtQrtwtpFOHi3kYqEB74fqZbfBTVWw==",
                    "SigningCertUrl": "https://sns.eu-west-1.amazonaws.com",
                    "UnsubscribeUrl": "https://sns.eu-west-1.amazonaws.com",
                    "MessageAttributes": {
                        "BRP_data": {
                            "Type": "String",
                            "Value": "false"
                        },
                        "AppId": {
                            "Type": "String",
                            "Value": "APV"
                        },
                        "KVK_data": {
                            "Type": "String",
                            "Value": "false"
                        }
                    }
                }
            }
        ]
    }
