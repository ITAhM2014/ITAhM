;"use strict";

(function (window, undefined) {
	
	var xhr, form;
	
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	window.addEventListener("keydown", function (e) {
		if (e.keyCode == 27) {
			form.reset();
		}
	}, false);
	window.focus();
	
	window.load = load;
	
	function onLoad(e) {
		form = document.getElementById("form");
		
		form.addEventListener("submit", onApply, false);
		form.addEventListener("reset", onCancel, false);
		
		xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load(data) {
		if (data) {
			form.name.value = data.name;
			form.udp.value = data.udp;
			form.version.value = data.version;
			form.community.value = data.community;
			
			form.name.select();
		}
		else {
			form.name.focus();
		}
		
		top.clearScreen();
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch (data.message) {
		case "data":
			load(data.data);
			
			break;
		}
	}
	
	function onApply(e) {
		e.preventDefault();
		
		var request = {
			database: "profile",
			command: "put",
			data: {}
		};
		
		request.data[this.name.value] = {
			udp: this.udp.value,
			name: this.name.value,
			version: this.version.value,
			community: this.community.value
		};
		
		xhr.request(request);
	}
	
	function onCancel(e) {
		top.closeDialog();
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				top.signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "put":
				top.openContent("profile.html");
				top.closeDialog();
			}
		}
		else {
			throw "fatal error";
		}
	}
	
}) (window);