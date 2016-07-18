var awsIot = require('aws-iot-device-sdk');
var PythonShell = require('python-shell');

var device = awsIot.device({
   keyPath: './certs/private.pem.key',
  certPath: './certs/certificate.pem.crt',
    caPath: './certs/root-CA.crt',
  clientId: 'RPI-2',
    region: 'us-east-1'
});
 
device
  .on('connect', function() {
    console.log('connected');
	// replace the serial number below with your own AWS IoT button's SN
    device.subscribe({'iotbutton/G030JF056407W2QN':0}, function(error, result) {
      console.log(result);
    });
  });
  
device
  .on('message', function(topic, payload) {
	var parsedPayload = JSON.parse(payload);
	console.log('message topic:', topic);
    console.log('message payload:', payload.toString());
	console.log('click type = ' + parsedPayload.clickType);
	
	if (parsedPayload.clickType == 'SINGLE') {
		// run the pointRed shell script
		PythonShell.run('pointRed.py', function (err) {
		  if (err) throw err;
		});
		
	} else if (parsedPayload.clickType == 'DOUBLE') {
		// run the pointBlue shell script
		PythonShell.run('pointBlue.py', function (err) {
		  if (err) throw err;
		});		
	}	
});
 