;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, server;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("keydown", onKeyDown, false);
	window.load = load;
	
	function onLoad() {
		elements.body = document.querySelector("body");
		elements.ip = document.getElementById("ip");
		elements.tcp = document.getElementById("tcp");
		elements.user = document.getElementById("username");
		elements.password = document.getElementById("password");
		
		document.getElementById("server").addEventListener("submit", onSendEcho, false);
		document.getElementById("sign_in").addEventListener("submit", onSignIn, false);
	}
	
	function load(data) {
		if (top.server) {
			elements.body.className = "sign_in";
			
			xhr = new JSONRequest(top.server, onResponse); 
		}
		
		top.clearScreen();
	}
	
	function onSendEcho(e) {
		e.preventDefault();
		
		server = elements.ip.value +":"+ elements.tcp.value;
		
		xhr = new JSONRequest(server, onResponse);
		xhr.request({
			command: "echo"
		});
		
		// session은 유효하고 server 재입력인 경우 top에 server값이 없으므로 항상 넘겨줘야 한다
		top.server = server;
	}
	
	function onSignIn(e) {
		e.preventDefault();
		
		var request = {
				command: "signin",
				username: elements.user.value,
				password: elements.password.value
			};
		
		xhr.request(request);
	}
	
	function onKeyDown(e) {
		var keyCode = e.keyCode;
		
		if (keyCode == 27) {
			//top.closeDialog()();
		}
		else if (keyCode == 13) {
			//onSignIn();
		}
	}
	
	function onError() {
		if (elements.body.className === "server") {
			// server 변경 또는 최초 입력 성공
			elements.body.className = "sign_in";
		}
		else {
			//signin 실패
			alert("invalid USERNAME or PASSWORD");
		}
		
		elements.user.select();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			// server 변경, signin 실패
			if (status == 401) {
				onError();
			}
		}
		else if ("json" in response) {
			top.signIn();
			top.closeDialog();
		}
		else {
			throw response;
		}
	}
	
}) (window);