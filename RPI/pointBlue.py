
import os
from creds import *
import requests
import json
import re
from memcache import Client

#Setup of device
audio = ""
servers = ["127.0.0.1:11211"]
mc = Client(servers, debug=1)                  

def gettoken(): #this is used for Amazon Alexa Voice Service
    token = mc.get("access_token")
    refresh = refresh_token
    if token:
        return token
    elif refresh:
        payload = {"client_id" : Client_ID, "client_secret" : Client_Secret, "refresh_token" : refresh, "grant_type" : "refresh_token", }
        url = "https://api.amazon.com/auth/o2/token"
        r = requests.post(url, data = payload)
        resp = json.loads(r.text)
        mc.set("access_token", resp['access_token'], 3570)
        return resp['access_token']
    else:
        return False        


def pointBlue(): #Plays pre-recorded WAV file to Alexa to triger an intent from lambda and play response overhead
    print("sending pointBlue")
    url = 'https://access-alexa-na.amazon.com/v1/avs/speechrecognizer/recognize'
    headers = {'Authorization' : 'Bearer %s' % gettoken()}
    d = {
        "messageHeader": {
            "deviceContext": [
                {
                    "name": "playbackState",
                    "namespace": "AudioPlayer",
                    "payload": {
                        "streamId": "",
                        "offsetInMilliseconds": "0",
                        "playerActivity": "IDLE"
                    }
                }
            ]
        },
        "messageBody": {
            "profile": "alexa-close-talk",
            "locale": "en-us",
            "format": "audio/L16; rate=16000; channels=1"
        }
    }
    with open('pointblue.wav') as inf: #pre-recorded WAV file
        files = [
                ('file', ('request', json.dumps(d), 'application/json; charset=UTF-8')),
                ('file', ('audio', inf, 'audio/L16; rate=16000; channels=1'))
            ]   
        r = requests.post(url, headers=headers, files=files)
    for v in r.headers['content-type'].split(";"):
        if re.match('.*boundary.*', v):
            boundary =  v.split("=")[1]
    data = r.content.split(boundary)
    for d in data:
        if (len(d) >= 1024):
            audio = d.split('\r\n\r\n')[1].rstrip('--')
    with open("response.mp3", 'wb') as f:
        f.write(audio)
    os.system('mpg123 -q 1sec.mp3 response.mp3')
 

pointBlue()	
	
