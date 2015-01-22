;"use strict";

function Map () {
	this.init();
}

(function (window, undefined) {
	
	var doc = document,
		map = undefined,
		navigation = undefined,
		iconLibrary = undefined,
		deviceLayer = undefined,
		lineLayer = undefined,
		connector = undefined,
		showDeviceForm = new Function();
	
	Map.prototype = {
		init: function () {
			navigation = doc.getElementById("map_nav");
			map = new Canvas("map");
			iconLibrary = new Icon("icon");
			deviceLayer = Layer.create("draggable");
			lineLayer = Layer.create();
			connector = new Connector();
			
			map.add(lineLayer);
			map.add(deviceLayer);
			
			lineLayer.context({
				strokeStyle: "#282",
				lineWidth: 3,
				font: "10pt arial, \"맑은 고딕\"",
				textAlign: "center",
				textBaseline: "middle",
				fillStyle: "#999"
			});
			
			doc.getElementById("save_map").addEventListener("click", onSave, false);
			navigation.info.addEventListener("click", onInfo, false);
			navigation.link.addEventListener("click", onLink, false);
			map.on("select", onSelect);
			map.on("mousemove", onMouseMove);
		},
		
		set: function (name, list) {
			switch (name) {
			case "device":
				var device;
				
				deviceLayer.empty();
				
				for (var id in list) {
					device = list[id];
					
					deviceLayer.add(Node.create("device", device,  iconLibrary.get(device.type) || iconLibrary.get("unknown")));
				}
				
				deviceLayer.invalidate();
				
				break;
			case "line":
				var line;
				
				lineLayer.empty();
				
				for (var id in list) {
					line = list[id];
					
					lineLayer.add(Node.create("line", line, itahm.getDevice(line.from), itahm.getDevice(line.to)));
				}
				
				lineLayer.invalidate();
				
				break;
			}
		},
		
		reloadDevice: function (deviceList) {
			var device;
			
			navigation.classList.remove("show");
			
			map.empty();
			
			for (var key in deviceList) {
				device = deviceList[key];
				
				deviceLayer.add(Node.create("device", device,  iconLibrary.get(device.type) || iconLibrary.get("unknown")));
			}
			
			map.invalidate();
		},
		
		reloadLine: function (lineList) {
			var line;
			
			navigation.classList.remove("show");
			
			map.empty();
			
			for (var id in lineList) {
				line = lineList[id];
				lineLayer.add(Node.create("line", line, itahm.getDevice(line.from), itahm.getDevice(line.to)));
			}
			
			map.invalidate();
		},
		
		invalidate: function () {
			map.invalidate();
		}
	};
	
	function Connector() {
		var layer = Layer.create(),
			dummy = {
				x: 0,
				y: 0
			},
			ready = false,
			node = Node.create("line", {link: [{}]}, null, dummy);
			
		map.add(layer);
		
		layer.context({
			lineWidth: 5,
			strokeStyle: "#777",
			lineCap: "round"
		});
		
		layer.context().setLineDash([10, 10]);
		
		this.draw = function (x, y) {
			if (ready) {
				dummy.x = x;
				dummy.y = y;
				
				layer.invalidate();
			}
		};
		
		this.ready = function (b) {
			if (b === true) {
				ready = true;
				
				layer.add(node);
			}
			else if (b === false) {
				ready = false;
				
				layer.empty();
			}
			else {
				return ready;
			}
		};
		
		this.from = function (device) {
			if (device) {
				node.from = device;
			}
			else {
				return node.from;
			}
		};
		
		/*
		 * device: device object (Node.device)
		 */
		this.get = function (device) {
			return itahm.getLine(node.from.id, device.node.id);
		};
		
		this.node = function () {
			return node;
		};
	}
	
	function onSave(e) {
		var data = {},
			device;
		
		/*deviceLayer.zIndex.map(function (deviceObject) {
			device = deviceObject.node;
			data[device.id] = device;
		});*/
		deviceLayer.each(function (deviceObject) {
			device = deviceObject.node;
			data[device.id] = device;
		});
		
		itahm.request({
			device: {
				set: data
			}
		});
	}
	
	function onSelect(device) {
		if (connector.ready()) {
			if (device) {
				var from = connector.from(),
					to = device.node;
				
				itahm.popup("line", from.name, to.name, connector.get(device));
				
				map.select();
			}
			
			connector.ready(false);
		}
		else {
			if (device) {
				var node = device.node;
				
				navigation.classList.add("show");
				
				connector.from(node);
				
				showDeviceForm = itahm.popup.bind(itahm, "device", node);
			}
			else {
				navigation.classList.remove("show");
			}
		}
	}
	
	function onMouseMove(pos) {
		connector.draw(pos.x, pos.y);
	}
	
	function onInfo() {
		showDeviceForm();
	}
	
	function onLink() {
		navigation.classList.remove("show");
		
		connector.ready(true);
	}

}) (window);