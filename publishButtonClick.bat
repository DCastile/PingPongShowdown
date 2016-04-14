del buttonClick.zip 
cd lambda/buttonClick 
7z a -r ../../buttonClick.zip * 
cd ../.. 
aws lambda update-function-code --function-name TennisMatchManager-Dev --zip-file fileb://buttonClick.zip
