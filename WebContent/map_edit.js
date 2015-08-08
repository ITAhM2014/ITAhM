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
		scale = 1,
		canvas,
		deviceLayer,
		lineLayer,
		selected,
		func = {
			selectNode: selectNode
		};
	
	window.addEventListener("load", onLoad, false);
	
	/**
	 * elements 초기화
	 */
	function onLoad(e) {
		dialog = document.getElementById("dialog");
		
		elements["zoomin"] = document.getElementById("zoomin");
		elements["zoomout"] = document.getElementById("zoomout");
		elements["save"] = document.getElementById("save");
		elements["close"] = document.getElementById("close");
		
		xhr = new JSONRequest(parent.location.search.replace("?", ""), onResponse);
		
		xhr.request({
			command: "echo"
		});
	}
	
	function load(map) {
		elements["zoomin"].addEventListener("click", function (e) {
			canvas.zoom(true);
		}, false);
		elements["zoomout"].addEventListener("click", function (e) {
			canvas.zoom(false);
		}, false);
		elements["save"].addEventListener("click", onSave, false);
		elements["close"].addEventListener("click", onClose, false);
		
		iconMap = map;
		canvas = new Canvas("map");
		
		canvas.on("select", onSelect);
		canvas.on("mousemove", onMouseMove);
		
		lineLayer = canvas.layer(drawLine);
		deviceLayer = canvas.layer(drawDevice);
		connectLayer = canvas.layer();
		
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
		
		var context = connectLayer.context();
		if (context.setLineDash) {
			context.setLineDash([5,2]);
		}
		
		connectLayer.context({
			lineWidth: 5,
			strokeStyle: "#9e9"
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
	
	function onClose() {
		if (confirm("are you sure quit edit mode?")) {
			top.openContent("map.html");
		}
	}
	
	function onCapture(e) {
		window.open(canvas.capture());
	}
	
	function onSelect(e) {
		return func["selectNode"](e);
	}
	
	function selectNode(e) {
		var node = e.node;
		
		selected = node;
		
		return true;
	}
	
	function connectNode(e) {
		var node = e.node;
		
		connectLayer.clear();
		
		func["selectNode"] = selectNode;
		
		if (node) {
			top.showDialog("line_dialog.html", {
				line : getLine(selected, node) || Line.create(selected.id, node.id)
			});
		}
		
		return false;
	}

	function onMouseMove(e) {
		var node = e.node;
		
		if (selected) {
			if (e.ctrlKey) {
				if (func["selectNode"] == selectNode) {
					func["selectNode"] = connectNode;
				}
				
				var context = connectLayer.context();
				
				connectLayer.clear();
				
				context.beginPath();
				context.moveTo(selected.x, selected.y);
				
				if (node && node != selected) {
					context.lineTo(node.x, node.y);
				}
				else {	
					context.lineTo(e.x, e.y);
				}
				
				context.stroke();
			}
			else if(func["selectNode"] == connectNode) {
				connectLayer.clear();
				
				func["selectNode"] = selectNode;
			}
		}
	}
	
	function showLineDialog(from, to) {
		
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
		var i=0;
		for (var id in deviceList) {i++;
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
			x = 0;
			y = 0;
			device["x"] = 0;
			device["y"] = 0;
		}
		
		x -= Math.round(width/2);
		y -= Math.round(height/2);
		
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
				parent.postMessage({
					message: "unauthorized"
				}, "*");
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