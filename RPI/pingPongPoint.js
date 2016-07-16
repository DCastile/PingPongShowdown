
var sys = require('sys')
var exec = require('child_process').exec;
var PythonShell = require('python-shell');
var child;

var fliclib = require("./fliclibNodeJs");
var FlicClient = fliclib.FlicClient;
var FlicConnectionChannel = fliclib.FlicConnectionChannel;
var FlicScanner = fliclib.FlicScanner;

var client = new FlicClient("localhost", 5551);

function listenToButton(bdAddr) {
		var cc = new FlicConnectionChannel(bdAddr);
		client.addConnectionChannel(cc);
		cc.on("buttonSingleOrDoubleClickOrHold", function(clickType, wasQueued, timeDiff) {
				console.log(bdAddr + " " + clickType + " " + (wasQueued ? "wasQueued" : "notQueued") + " " + timeDiff + " seconds ago");
				if (clickType == 'ButtonSingleClick' && bdAddr == '80:e4:da:71:30:f0'){
					// run the pointRed shell script
					PythonShell.run('pointRed.py', function (err) {
					  if (err) throw err;
					  console.log('black single clicked')
					});
						
				} else if (clickType == 'ButtonDoubleClick' && bdAddr == '80:e4:da:71:30:f0'){
					// run the pointBlue shell script
					child = exec("python pointBlue.py", function (error, stdout, stderr) {
						console.log('black double clicked')
						sys.print('stdout: ' + stdout);
						sys.print('stderr: ' + stderr);				  
						if (error !== null) {
							console.log('exec error running pointBlue.sh: ' + error);
						}
					});	
				} else{
						// Longclick not used
				}
		});
		cc.on("connectionStatusChanged", function(connectionStatus, disconnectReason) {
				console.log(bdAddr + " " + connectionStatus + (connectionStatus == "Disconnected" ? " " + disconnectReason : ""));
		});
}

client.once("ready", function() {
	console.log("Connected to daemon!");
	client.getInfo(function(info) {
		info.bdAddrOfVerifiedButtons.forEach(function(bdAddr) {
			listenToButton(bdAddr);
		});
	});
});

client.on("bluetoothControllerStateChange", function(state) {
	console.log("Bluetooth controller state change: " + state);
});

client.on("newVerifiedButton", function(bdAddr) {
	console.log("A new button was added: " + bdAddr);
	listenToButton(bdAddr);
});

client.on("error", function(error) {
	console.log("Daemon connection error: " + error);
});

client.on("close", function(hadError) {
	console.log("Connection to daemon is now closed");
});	
