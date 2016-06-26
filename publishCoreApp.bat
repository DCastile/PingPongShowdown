del coreApp.zip 
cd lambda/coreApp 
7z a -r ../../coreApp.zip * 
cd ../.. 
aws lambda update-function-code --function-name PingPongMatchManager-Dev --zip-file fileb://coreApp.zip
