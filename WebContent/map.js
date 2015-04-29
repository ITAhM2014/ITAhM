;"use strict";

(function (window, undefined) {
	var xhr = new JSONRequest("local.itahm.com:2014", onResponse),
		form = document.getElementById("form"),
		dialog = document.getElementById("dialog"),
		iconMap = {},
		deviceList = {},
		lineList = {},
		lineIndex = {},
		scale = 1,
		linkWrapper = link.bind(this),
		canvas,
		deviceLayer,
		lineLayer,
		selected;
	
	form.addEventListener("submit", onSubmit, false);
	form.elements["save"].addEventListener("click", onSave, false);
	form.elements["zoomin"].addEventListener("click", function (e) {
		canvas.zoom(scale *=1.2);
	}, false);
	form.elements["zoomout"].addEventListener("click", function (e) {
		canvas.zoom(scale /=1.2);
	}, false);
	form.elements["link"].addEventListener("click", onLink, false);
	window.addEventListener("load", onLoad, false);
	window.addEventListener("message", onMessage, false);
	
	function onLoad(e) {
		xhr.request({
			command: "echo"
		});
		
		/*
		lineLayer.context({
			strokeStyle: "#282",
			lineWidth: 3,
			font: "10pt arial, \"맑은 고딕\"",
			textAlign: "center",
			textBaseline: "middle",
			fillStyle: "#999"
		});
		*/
		
		//canvas.on("mousemove", onMouseMove);
	}
	
	function load(map) {
		iconMap = map;
		canvas = new Canvas("map");
		
		canvas.on("select", onSelect);
		
		lineLayer = canvas.layer(drawLine);
		deviceLayer = canvas.layer(drawDevice);
		
		deviceLayer.context({
			font: "bold 15px arial, \"맑은 고딕\"",
			textBaseline:  "bottom",
		});
	
		xhr.request({
			database: "device",
			command: "get",
			data: null
		});
		
		xhr.request({
			database: "line",
			command: "get",
			data: null
		});
	}
	
	function onSubmit(e) {
		e.preventDefault();
	}
	
	function onSave(e) {
		var request = {
				database: "device",
				command: "put",
				data: deviceList
			};
		
		xhr.request(request);
	}
	
	function onSelect(node) {
		var result;
		
		if (tryLink(node)) {
			result = false;
		}
		else {
			selected = node;
		}
		
		tryLink = function () {return false};
		
		return result;
	}
	
	function onLink(e) {
		tryLink = link.bind(this, selected);
	}
	
	function tryLink() {
		return false;
	}
	
	function link(from, to) {
		if (from == to || !from || !to) {
			return false;
		}
		
		(showLineDialog = _showLineDialog.bind(this, from, to))();
		
		return true;
	}
	
	function showLineDialog() {
	}

	function _showLineDialog(from, to) {
		var line = getLine(from, to);
		
		dialog.contentWindow.postMessage({
			message: "line",
			deviceFrom: from,
			deviceTo: to,
			line: line
		}, "*");
		
		dialog.classList.add("show");
	}
	
	function closeLineDialog() {
		dialog.classList.remove("show");
	}
	
	function getLine(from, to) {
		var index = lineIndex[from.id];
		
		if (index) {
			var id = index[to.id];
			
			if (id) {
				return lineList[id];
			}
		}
	}
	
	function loadDevice() {
		var device;
		
		for (var id in deviceList) {
			device = deviceList[id];
			
			deviceLayer.add(device);
		}
		
		deviceLayer.invalidate();
	}
	
	function loadLine() {
		var line;
		
		for (var id in lineList) {
			line = lineList[id];
			
			lineLayer.add(line);
			
			if (!lineIndex[line.from]) {
				lineIndex[line.from] = {};
			}
			lineIndex[line.from][line.to] = id;
			
			if (!lineIndex[line.to]) {
				lineIndex[line.to] = {};
			}
			lineIndex[line.to][line.from] = id;
		}
		
		lineLayer.invalidate();
	}
	
	function reLoadLine() {
		xhr.request({
			database: "line",
			command: "get",
			data: null
		});
	}
	
	/*draw = {
	 *     node: device
	 *     context: canvas context
	 *     shadow: shadow context
	 *     color: shadow color
	 */
	
	function drawDevice(draw) {
		var device = draw.node,
			icon = iconMap[device.type],
			width = icon.width,
			height = icon.height,
			x = device.x - Math.round(width/2),
			y = device.y - Math.round(height/2),
			context = draw.context,
			radius = Math.round(Math.max(width, height) *.5 *1.5),
			shadow;
		
		if (device == selected) {
			context.save();
			context.globalAlpha = .2;
			context.beginPath();
			context.arc(device.x, device.y, Math.max(width, height), 0, Math.PI *2);
			context.fill();
			context.restore();
		}
		
		context.drawImage(icon, x, y, width, height);
		context.fillText(device.name, x, y)
		
		if (shadow = draw.shadow) {
			shadow.fillStyle = draw.color;
			shadow.fillRect(x, y, width, height);
		}
	}
	
	function drawLine(draw) {
		var context = draw.context,
			line = draw.node,
			from = deviceList[line.from],
			to = deviceList[line.to];
		
		context.beginPath();
		context.moveTo(from.x, from.y);
		context.lineTo(to.x, to.y);
		context.stroke();
	}
	
	function onMessage(e) {
		var data = e.data;
		
		if (!data) {
			return;
		}
		
		switch(data.message) {
		case "reLoadLine":
			reLoadLine();
			
			break;
		case "showLineDialog":
			showLineDialog();
			
			break;
		case "closeLineDialog":
			closeLineDialog();
			
			break;
		}
	}
	
	function onResponse(response) {
		if ("error" in response) {
			var status = response.error.status;
			
			if (status == 401) {
				location.href = "signin.html";
			}
		}
		else if ("json" in response) {
			var json = response.json;
			
			switch (json.command) {
			case "get":
				if (json.database == "device") {
					deviceList = json.data;
					
					loadDevice();
				}
				else if (json.database == "line") {
					lineList = json.data;
					
					loadLine();
				}
				
				break;
		
			case "put":
				location.reload();
				
				break;
				
			case "echo":
				new IconLoader(load);
				
				break;
			}
		}
		else {
			throw "fatal error";
		}
	}
}) (window);