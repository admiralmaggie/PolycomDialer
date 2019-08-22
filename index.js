var options = {address:"", 
               username:"", 
			   password:"",
			   line: "1",
			   prefix: "",
			   DTMF: false,
			   singletone: false};

var currentDigit = 0,
    digitsToSend = "";

// init
init_extension();

// click event handler
chrome.contextMenus.onClicked.addListener(function(info, tab){  	

	if (!options.address ) {
		alert('Please define Polycom phone endpoint address and authentication settings under chrome://extensions/ > Details > Extension Options.');
		return;
	}
	if (tab) {
        if (info.menuItemId === "dialNumber"){
			dial_number(info.selectionText.replace(/\D/g,''));

        }
        if (info.menuItemId === "DTMF"){
			send_DTMF(info.selectionText.replace(/\D/g,''));
        }
    }
});

// message handler
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.action == "optionsSaved")
      init_extension();
  });

// ini extension options
function init_extension() {
	// read options
	chrome.storage.sync.get({
		address: "",
		username: "",
		password: "",
		line: "1",
		prefix: "",
		DTMF: false,
		singletone: false
		}, function(items) {
			options = items;
	});
	
	// setup context menu
	chrome.contextMenus.removeAll(function() {
	  chrome.contextMenus.create({
		title: "Dial with PolyCom",
		id: 'dialNumber',
		contexts: ["selection"]
	  });
	  if (options.DTMF) {
		  chrome.contextMenus.create({
			title: "Send DTMF with PolyCom",
			id: 'DTMF',
			contexts: ["selection"]
		  });  
	  }
	});	
}

// dial number
function dial_number(numberToDial = '') {
	json={ data:{ Dest: options.prefix + numberToDial, Line: options.line, Type:"TEL" } };
	post_data(url='/api/v1/callctrl/dial', data=JSON.stringify(json));
}

// send DTMF
function send_DTMF(numberToDial = '') {	
	digitsToSend = numberToDial
	currentDigit = 0;
	if (options.singletone) 
		send_next_digit();
	else {
		json={ data:{ Digits: digitsToSend } };
		post_data(url='/api/v1/callctrl/sendDTMF', data=JSON.stringify(json));
	}
}

// one digit at a time
function send_next_digit() {	
	if (currentDigit >= digitsToSend.length)
		return;
	json={ data:{ Digits: digitsToSend.charAt(currentDigit) } };
	post_data(url='/api/v1/callctrl/sendDTMF', data=JSON.stringify(json), callback=true);		
	currentDigit++;
}

// post data to end point
function post_data(url = '', data = {}, callback=false) {
	var request = new XMLHttpRequest();
	
	// build URL
	var endpoint = options.address + url;
	
	request.open('POST', endpoint, true);
    request.setRequestHeader('Content-Type', 'application/json');
	if (options.username || options.password)
		request.setRequestHeader('Authorization', 'Basic ' + btoa( options.username + ':' + options.password));
	
	if (callback) {
		request.onreadystatechange = function () {
			if(request.readyState === 4 && request.status === 200) {
				send_next_digit();
			}
		};
	}
	
    request.send(data);
}
