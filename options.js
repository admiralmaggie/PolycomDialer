// show status message
function show_status(displayClass, message) {
	var status = document.getElementById('formStatus');
	
	status.setAttribute('class','alert ' + displayClass);
	status.style.visibility = '';
    status.textContent = message;
    setTimeout(function() {
      status.textContent = '';
	  status.style.visibility = 'hidden';
    }, 3000);	
}

// validate address
function validate_address(address) { 
  // make sure address is specified
  if (!address || (!/^https?:\/\//.test(address))  ) {
    show_status('alert-danger', 'Please specificy a valid HTTP/HTTPS endpoint.');
	return false;
  }
  return true;
}  


// saves options to chrome.storage
function save_options() {
  var address = document.getElementById('formAddress').value;
  var username = document.getElementById('formUsername').value;
  var password = document.getElementById('formPassword').value;
  var line = document.getElementById('formLine').value;
  var prefix = document.getElementById('formPrefix').value;
  var DTMF = document.getElementById('formDTMF').checked;
  var singletone = document.getElementById('formSingletone').checked;
  
  if (!validate_address(address))
	return;

  chrome.storage.sync.set({
    address: address,
    username: username,
	password: password,
	line: line,
	prefix: prefix,
	DTMF: DTMF,
	singletone: singletone
  }, function() {    
    show_status('alert-success', 'Options saved.');
  });
  
  // notify content script that options may have changed 
  chrome.runtime.sendMessage({action: "optionsSaved"});
}

// restore options
function restore_options() {
  chrome.storage.sync.get({
    address: "",
    username: "",
	password: "",
	line: "1",
	prefix : "",
	DTMF: false,
	singletone: false
	}, function(items) {
	if (items) {
		document.getElementById('formAddress').value = items.address;
		document.getElementById('formUsername').value = items.username;
		document.getElementById('formPassword').value = items.password;		
		document.getElementById('formLine').value = items.line;
		document.getElementById('formPrefix').value = items.prefix;		
		document.getElementById('formDTMF').checked = items.DTMF;
		document.getElementById('formSingletone').checked = items.singletone;
	}
  });
}

// test connectivity
function test_connectivity() {
	var address = document.getElementById('formAddress').value;
	var username = document.getElementById('formUsername').value;
    var password = document.getElementById('formPassword').value;
	var button = document.getElementById('test');
	var request = new XMLHttpRequest();
		
	if (!validate_address(address))
		return;
	
	// setup spinner
	button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
	button.disabled = true;
		
	// show success message
	request.onload = function() {
		var obj = JSON.parse(request.response);	
		
		if (!obj.data.FirmwareRelease)
			show_status('alert-danger', 'Invalid response received:' + request.response);
		else	
			show_status('alert-success', 'Success! Phone Model:' + obj.data.ModelNumber + ' Firmware: ' + obj.data.FirmwareRelease);
				
		button.innerHTML = 'Test';
		button.disabled = false;
	};	
	
	request.onerror = function() { // only triggers if the request couldn't be made at all
		show_status('alert-danger', 'Unable to connect to end point.');
				
		button.innerHTML = 'Test';
		button.disabled = false;		
	};
	
	request.ontimeout = function() { // only triggers if the request couldn't be made at all
		show_status('alert-danger', 'Timeout occurred.');
				
		button.innerHTML = 'Test';
		button.disabled = false;		
	};
	
	// build URL
	var endpoint = address + '/api/v1/mgmt/device/info';
	
	// try connecting
	try {
		request.open('GET', endpoint, true);
		request.timeout = 5000;
	}
	catch(error) {
		show_status('alert-danger', 'Unable to connect to end point.');
		
		button.innerHTML = 'Test';
		button.disabled = false;
		return;		
	}
	    	
	request.setRequestHeader('Content-Type', 'application/json');
	if (username || password)
		request.setRequestHeader('Authorization', 'Basic ' + btoa( username + ':' + password));
    request.send(null);	
}

document.addEventListener('DOMContentLoaded', restore_options);
document.getElementById('save').addEventListener('click',save_options);
document.getElementById('test').addEventListener('click',test_connectivity);