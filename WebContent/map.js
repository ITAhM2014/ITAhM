;"use strict";

/**
 * elements 는 global variable
 */
var elements = {}, dialog;

(function (window, undefined) {
	var xhr,
		iconMap = {},
		deviceList = {},
		lineList = {},
		lineIndex = {},
		canvas,
		deviceLayer,
		lineLayer;
	
	window.addEventListener("load", onLoad, false);
	
	window.load = load;
	
	/**
	 * elements 초기화
	 */
	function onLoad(e) {
		dialog = document.getElementById("dialog");
		
		elements["body"] = document.getElementsByTagName("body")[0];
		elements["zoomin"] = document.getElementById("zoomin");
		elements["zoomout"] = document.getElementById("zoomout");
		elements["capture"] = document.getElementById("capture");
		elements["edit"] = document.getElementById("edit");
		
		xhr = new JSONRequest(top.server, onResponse);
	}
	
	function load() {
		new IconLoader(init);
	}
	
	function init(map) {
		elements["zoomin"].addEventListener("click", function (e) {
			canvas.zoom(true);
		}, false);
		elements["zoomout"].addEventListener("click", function (e) {
			canvas.zoom(false);
		}, false);
		elements["capture"].addEventListener("click", onCapture, false);
		elements["edit"].addEventListener("click", onEdit, false);
		
		iconMap = map;
		canvas = new Canvas("map");
		
		canvas.on("select", onSelect);
		canvas.on("mousemove", onMouseMove);
		
		lineLayer = canvas.layer(drawLine);
		deviceLayer = canvas.layer(drawDevice);
		
		deviceLayer.context({
			font: "bold 12px tahoma, arial, \"맑은 고딕\"",
			textBaseline:  "bottom",
		});
	
		lineLayer.context({
			font: "normal 12px tahoma, arial, \"맑은 고딕\"",
			//textBaseline:  "bottom",
			fillStyle: "#777",
			textAlign: "center",
			strokeStyle: "#777"
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
	
	function onSave(e) {
		var request = {
				database: "device",
				command: "put",
				data: deviceList
			};
		
		xhr.request(request);
	}
	
	function onCapture(e) {
		window.open(canvas.capture());
	}
	
	function onEdit(e) {
		location.href = "map_edit.html";
	}
	
	function onSelect(e) {
		var device = e.node;
		
		if (device && device["address"] && device["profile"]) {
			top.openContent("monitor.html", device["address"]);
		}
		return false;
	}
	
	function onMouseMove(e) {
		var device = e.node;
		
		elements["body"].style.cursor = device && device["address"] && device["profile"]? "pointer": "default";
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
			x = device.x,
			y = device.y,
			context = draw.context,
			radius = Math.round(Math.max(width, height) *.5 *1.5),
			shadow;
		
		if (x === undefined || y === undefined) {
			return;
		}
		
		x -= Math.round(width/2);
		y -= Math.round(height/2);
		
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
			link = line.link,
			from = deviceList[line.from],
			to = deviceList[line.to],
			x1 = from.x,
			y1 = from.y,
			x2 = to.x,
			y2 = to.y,
			x = (x1 + x2) /2,
			y = (y1 + y2) /2,
			index = 0,
			length = link.length,
			angle = Math.atan2(y2 - y1, x2 - x1) + Math.PI *.5,
			cpX, cpY;

		if (length %2 > 0) {
			context.beginPath();
			context.moveTo(x1, y1);
			context.lineTo(x2, y2);
			context.stroke();
			
			context.fillText(link[index].from, (x2 + x1 *3) /4, (y2 + y1 *3) /4);
			context.fillText(link[index].to, (x2 *3 + x1) /4, (y2 *3 + y1) /4);
			
			index++;
		}
		
		for (var half = 1; index < length; index++, half += .5, angle += Math.PI) {
			cpX = x + (Math.floor(half)) * 40 * Math.cos(angle);
			cpY = y + (Math.floor(half)) * 40 * Math.sin(angle);
			
			context.beginPath();
			context.moveTo(x1, y1);
			context.quadraticCurveTo(cpX, cpY, x2, y2);
			context.stroke();
			
			context.fillText(link[index].from, (cpX + x1) /2, (cpY + y1) /2);
			context.fillText(link[index].to, (x2 + cpX) /2, (y2 + cpY) /2);
		}
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
			}
		}
		else {
			throw "fatal error";
		}
	}
}) (window);