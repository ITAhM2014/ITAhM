;"use strict";

var elements = {};

(function (window, undefined) {
	var xhr, eventListener, eventMode = false;
	
	window.addEventListener("load", onLoad, false);
	
	window.showDialog = showDialog;
	window.closeDialog = closeDialog;
	window.signOut = signOut;
	window.clearScreen = clearScreen;
	window.openContent = openContent;
	window.home = home;

	function onLoad(e) {
		window.server = location.search.replace("?", "");
		
		elements["dialog"] = document.getElementById("dialog");
		elements["content"] = document.getElementById("content");
		elements["event"] = document.getElementById("event_list");
		elements["alarm"] = document.getElementById("alarm");
		elements["body"] = document.getElementsByTagName("body")[0];
		
		document.getElementById("btn_signout").addEventListener("click", onSignOut, false);
		document.getElementById("home").onclick = openContent.bind(window, "monitor.html", "127.0.0.1");
		document.getElementById("test").onclick = openContent.bind(window, "monitor2.html", "127.0.0.1");
		document.getElementById("map").onclick = openContent.bind(window, "map.html");
		document.getElementById("device").onclick = openContent.bind(window, "device_list.html");
		document.getElementById("line").onclick = openContent.bind(window, "line_list.html");
		document.getElementById("address").onclick = openContent.bind(window, "address.html");
		document.getElementById("account").onclick = openContent.bind(window, "account.html");
		document.getElementById("profile").onclick = openContent.bind(window, "profile.html");
		document.getElementById("icon").onclick = openContent.bind(window, "icon.html");
		document.getElementById("event").onclick = onShowEvent;
		document.getElementById("close").onclick = onCloseEvent;
		
		if (server == "") {
			location.href = "ITAhM.html?"+ prompt("server address[:tcp port]");
			
			return;
		}
		
		xhr = new JSONRequest(server, onResponse);
		
		eventListener = new JSONRequest(server, onEvent);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function load() {
		home();
		/*
		eventListener.request({
			command: "event",
			index: -1
		});
		*/
		clearScreen();
	}
	
	function home() {
		openContent("monitor2.html", "127.0.0.1");
	}
	
	function writeEvent(data) {
		var event,
			line,
			index,
			list = elements["event"];
		
		for (index in data) {
			event = data[index];
			
			line = document.createElement("div");
			line.appendChild(document.createElement("span")).textContent = new Date(event["timeStamp"]).toLocaleString();
			line.appendChild(document.createElement("span")).textContent = event["sysName"];
			line.appendChild(document.createElement("span")).textContent = event["ipAddr"];
			line.appendChild(document.createElement("span")).textContent = getEventResource(event["resource"], event["index"]);
			line.appendChild(document.createElement("span")).textContent = event["lastStatus"];
			line.appendChild(document.createElement("span")).textContent = event["currentStatus"];
			line.appendChild(document.createElement("span")).textContent = event["text"];
			
			list.appendChild(line);
		}
		
		list.scrollTop = list.scrollHeight;
		
		eventListener.request({
			command: "event",
			index: index
		});
		
		if (!eventMode) {
			elements["alarm"].classList.add("active");
		}
	}
	
	function getEventResource(resource, index) {
		if (!index) {
			return resource;
		}
		
		if (resource === "hrProcessorLoad") {
			return "processor load ."+ index;
		}
		else if (resource === "ifAdminStatus") {
			return "interface ."+ index;
		}
		else if (resource.indexOf("hrStorageUsed")) {
			var type = Number(resource.replace("hrStorageUsed/", ""));
			
			if (type === 2) {
				// memory
				
				return "physical memory ."+ index;
			}
			else if (type == 4) {
				// disk
				return "storage ."+ index;
			}
		}
	}
	
	function onSignOut(e) {
		xhr.request({command: "signout"});
	}
	
	function signOut() {
		elements["content"].src = "about:blank";
		
		showDialog("signin.html");
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				
				signOut();
			}
		}
		else if ("json" in response) {
			var json = response.json,
				command = json.command;
			
			if (json === null) {
				return;
			}
			
			if (command === "echo") {
				load();
			}
		}
	}
	
	function onEvent(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				signOut();
			}
			else {
				throw response.error;
			}
			
			setTimeout(eventListener.request.bind(undefined, {
				command: "event",
				index: -1
			}), 3000);
			
			return;
		}
		else if ("json" in response) {
			var json = response.json;
			if (json === null) {
				return;
			}
			
			writeEvent(json.data);
		}
		else {
			throw "what is this?";
		}
	}
	
	function openContent(html, data) {
		elements["content"].onload = onOpenContent.bind(undefined, data);
		elements["content"].src = html;
	}
	
	function onOpenContent(data) {
		elements["content"].contentWindow.load(data);
		elements["content"].onload = undefined;
	}
	
	function onShowEvent(e) {
		eventMode = true;
		
		elements["alarm"].classList.remove("active");
		
		elements["body"].classList.add("event");
	}
	
	function onCloseEvent(e) {
		eventMode = false;
		
		elements["body"].classList.remove("event");
	}
	
	/**
	 * dialog가 완전히 load 될때까지 loading중임을 보여줌(class=loading)
	 */
	function showDialog(html, data) {
		elements["body"].classList.add("loading");
		
		elements["dialog"].onload = onPopUp.bind(elements["dialog"], data);
		elements["dialog"].src = html;
	}
	
	function closeDialog() {
		elements["body"].classList.remove("dialog");
	}

	function clearScreen() {
		elements["body"].classList.remove("loading");
	}
	
	function reload(html) {
		elements["content"].src = html || "about:blank";
		
		elements["body"].classList.remove("dialog");
	}

	function onPopUp(data, e) {
		var load = elements["dialog"].contentWindow.load;
		
		if (load) {
			load(data);
			
			elements["body"].classList.add("dialog");
		}
		else {
			closeDialog();
			
			throw "dialog must have 'load' method";
		}
	}
	
})(window);



