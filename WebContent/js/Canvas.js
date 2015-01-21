;"use strict";

function numToRGBString(n) {
	return "#"+ (1 << 24 | n).toString(16).substring(1);
}

function arrayToNumber(array) {
	if (array[3] === 255) {
		return array[0]<<16 | array[1]<<8 | array[2];
	} 
	
	return 0;
}

function getPos(map, e) {
	var rect = map.getBoundingClientRect();
	
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

function hitTest(layers, x, y) {
	var length = layers.length,
		node= undefined;
	
	while (length-- > 0) {
		if (node = layers[length].hitTest(x, y)) {
			break;
		}
	}
	
	return node;
}

function clear(canvas) {
	var context = canvas.getContext("2d"),
		width = canvas.width,
		height = canvas.height;
	
	context.save();
	
	context.setTransform(1, 0, 0, 1, 0, 0);
	context.clearRect(0, 0, width, height);
	
	context.restore();
}

function select(layer, node, toggle) {
	if (toggle && layer.find(node)) {
		layer.remove(node);
	}
	else {
		layer.add(node);
	}
	
	layer.invalidate();
}

function move(array, x, y) {
	var length = array.length;
	
	while (length-- > 0) {
		array[length].move(x, y);
	}
}

function size(canvas, width, height) {
	canvas.width = width;
	canvas.height = height;
}

function align(canvas, scale, factor) {
	canvas.getContext("2d").setTransform(scale, 0, 0, scale, Math.round(canvas.width * factor), Math.round(canvas.height * factor));
}

function batch(array, context, func) {
	var length = array.length;
	
	for (var index = 0; index < length; index++) {
		array[index][func](context);
	}
}

function Canvas() {
	this.init(arguments);
}

function Layer() {
	this.init(arguments);
}

function Node() {
	this.init(arguments);
}

function Icon() {
	this.init(arguments);
}

/**************************************************************************************************
 * Canvas
 **************************************************************************************************/

(function(window, undefined) {
	
	function init(map) {
		this.map = map;
		this.scale = 1;
		this.layers = [];
		this.maskLayer = Layer.create("mask");
		this.selectLayer = Layer.create("select");
		this.fragLayer = document.createDocumentFragment();
		this.userLayer = document.createElement("div");
		
		this.eventHandler = {};
		this.mouseMove = mouseMove;
		
		this.map.appendChild(this.userLayer);
		this.map.appendChild(this.selectLayer.canvas);
		this.map.appendChild(this.maskLayer.canvas);
		
		this.resize();
		
		map.addEventListener("mousemove", onMouseMove.bind(this), false);
		map.addEventListener("mousedown", onMouseDown.bind(this), false);
		map.addEventListener("mouseup", onMouseUp.bind(this), false);
		//map.addEventListener("mouseout", onMouseUp.bind(this), false);
		
		window.addEventListener("resize", this.resize.bind(this), false);
	}
	
	function fire(eventHandler, event) {
		var index, length;
		
		if (eventHandler) {
			index = 0;
			length = eventHandler.length;
			
			while (index < length) {
				eventHandler[index++](event);
			}
		}
	}
	
	function onMouseMove(e) {
		var pos = getPos(this.map, e);
		
		this.mouseMove(pos.x, pos.y);
	}
	
	function onMouseDown(e) {
		if (e.button != 0) {
			//e.preventDefault();
			
			return;
		}
		
		var ctrlKey = e.ctrlKey,
			shiftKey = e.shiftKey,
			pos = getPos(this.map, e),
			x = pos.x,
			y = pos.y,
			node = hitTest(this.layers, x, y);
		
		this.mouseUp = click.bind(this, node, ctrlKey, shiftKey);
		
		this.mouseMove = ctrlKey || shiftKey? mouseMove: dragStart.bind(this, node, x, y);
	}
	
	function onMouseUp(e) {
		var pos = getPos(this.map, e),
			x = pos.x,
			y = pos.y;
		
		this.mouseUp(hitTest(this.layers, x, y), x, y, e.ctrlKey, e.shiftKey);
		
		this.mouseMove = mouseMove;
	}
	
	function click(node, ctrlKey, shiftKey, node2, x, y, ctrlKey2, shiftKey2) {
		if (node !== node2) {
			return;
		}
		
		var layer = this.selectLayer;

		if (node) {
			if (ctrlKey && ctrlKey2) {
				select(layer, node, true);
			}
			else {
				if (!(shiftKey && shiftKey2)) {
					layer.empty();
				}

				select(layer, node, false);
			}
		}
		else {
			layer.empty();
		}
		
		fire(this.eventHandler["select"], layer.count() == 1? layer.node(0): undefined);
		
		layer.invalidate();
	}
	
	function dragStart(node, x, y, x2, y2) {
		var layer = this.selectLayer,
			cache = Layer.create(),
			context = cache.context(),
			target = undefined;
		
		cache.size(this.width *3, this.height *3);
		cache.zoom(this.scale);
		
		if (node && layer.find(node)) {
			target = layer.zIndex;
			
			context.globalAlpha = .5;
			
			batch(target, context, "draw");
		}
		else {
			this.layers.map(function (layer) {
				batch(layer.zIndex, context, "draw");
			});
			
			clear(layer.canvas);
			batch(layer.zIndex, context, "select");
			
			this.fragLayer.appendChild(this.userLayer);
		}
		
		this.mouseMove = dragMove.bind(this, cache.canvas, x, y);
		this.mouseUp = dragEnd.bind(this, target, x, y);
		
		this.mouseMove(x2, y2);
	}
	
	function mouseMove (x, y) {
		fire(this.eventHandler["mousemove"], {x: x - Math.round(this.width /2), y: y - Math.round(this.height /2)});
	}
	
	function dragMove (cache, x, y, x2, y2) {
		var layer = this.maskLayer;
		
		clear(layer.canvas);

		layer.context().drawImage(cache, x2 - x, y2 - y);
	}
	
	function dragEnd(nodes, x1, y1, na, x2, y2) {
		var scale = this.scale,
			x = Math.round((x2 - x1) / scale),
			y = Math.round((y2 - y1) / scale);
		
		clear(this.maskLayer.canvas);
		
		if (nodes) {
			move(nodes, x, y);
		}
		else {
			this.layers.map(function (layer) {
				move(layer.zIndex, x, y);

			});
			
			this.map.appendChild(this.fragLayer, this.map.firstChild);
		}
		
		this.layers.map(function (layer) {
			layer.invalidate();
		});
		
		this.selectLayer.invalidate();
	}
	
	Canvas.prototype = {
		init: function (args) {
			var id = args && args[0];
			
			if (id) {
				init.call(this, document.getElementById(id));
			}
		},
		
		add: function (layer) {
			var layers = this.layers,
				length = layers.length;
			
			layers[length] = layer;
			
			layer.size(this.width, this.height);
			
			this.userLayer.appendChild(layer.canvas);
			
			return layer;
		},
		
		zoom: function (scale) {
			this.scale = scale;
			
			this.layers.map(function (layer) {
				layer.zoom(scale);
				layer.invalidate();
			});
			
			this.selectLayer.zoom(scale);
			this.selectLayer.invalidate();
			
			//this.maskLayer.zoom(scale);
		},
	
		resize: function() {
			var rect = this.map.getBoundingClientRect(),
				width = rect.width,
				height = rect.height;
			
			this.width = width;
			this.height = height;
			
			this.layers.map(function (layer) {
				layer.size(width, height);
			});
			
			this.selectLayer.size(width, height);
			this.maskLayer.size(width, height);
			
			this.invalidate();
		},
		
		empty: function () {
			this.layers.map(function (layer) {
				layer.empty();
			});
			
			this.selectLayer.empty();
		},
		
		invalidate: function () {	
			this.layers.map(function (layer) {
				layer.invalidate();
			});
			
			this.selectLayer.invalidate();
		},
		
		select: function () {
			this.selectLayer.empty();
			
			this.selectLayer.invalidate();
		},
		
		on: function (type, handler) {
			var eventHandler = this.eventHandler;
			
			if (!eventHandler[type]) {
				eventHandler[type] = [];
			}
			
			eventHandler[type].push(handler);
		}
	};
	
})(window);













/**************************************************************************************************
 * Layer
 **************************************************************************************************/

(function( window, undefined ) {

	Layer.create = function (type) {
		switch (type) {
		case "draggable":
			return new Draggable();
		
		case "select":
			return new Select();
			
		case "mask":
			return new Mask();
			
		default:
			return new Layer();	
		}
	};
	
	function add(layer, node, draw) {
		var index = layer.index,
			zIndex = layer.zIndex,
			id = node.id();
		
		if (index[id]) {
			return;
		}
		
		index[id] = node;
		zIndex[zIndex.length] = node;
		
		if (draw === true) {
			node.draw(this.canvas.getContext("2d"));
		}
	}
	
	function init() {
		this.zIndex = [];
		this.index = {};
		this.canvas = document.createElement("canvas");
		this.scale = 1;
		this.width = 0;
		this.height = 0;
	}
	
	Layer.prototype = {
		init: function (args) {
			init.call(this);
		},
		
		context: function (attrs) {
			var context = this.canvas.getContext("2d");
			
			if (!attrs) {
				return context;
			}
			
			var keys = Object.keys(attrs),
				length = keys.length,
				name;
			
			while (length-- > 0) {
				name = keys[length];
				
				context[name] = attrs[name];
			}
		},
		
		add: function (node, draw) {
			add(this, node, draw);
		},
		
		remove: function (node) {
			var zIndex = this.zIndex;
			
			delete this.index[node.id()];
			zIndex.splice(zIndex.indexOf(node), 1);
		},
		
		clear: function () {
			clear(this.canvas);
		},
		
		empty: function () {
			this.zIndex = [];
			this.index = {};
			
			clear(this.canvas);
		},
		
		find: function (node) {
			return this.index[node.id()]? true: false;
		},
		
		zoom: function (scale) {
			align(this.canvas, this.scale = scale, .5);
		},
		
		size: function (width, height) {
			var canvas = this.canvas;
			
			size(canvas, width, height);
			
			align(canvas, this.scale, .5);
		},
		
		top: function(node) {
			var zIndex = this.zIndex,
				index = zIndex.indexOf(node);
			
			for (var i=index; i >0; i--) {
				zIndex[i] = zIndex[i -1];
			}
			
			zIndex[0] = node;
		},
		
		bottom: function(node) {
			var zIndex = this.zIndex,
				index = zIndex.indexOf(node),
				length = zIndex.length;
			
			for (var i=index; i < length; i++) {
				zIndex[i] = zIndex[i +1];
			}
			
			zIndex[length] = node;
		},
		
		move: function (x, y) {
			//move(this.zIndex, x, y);
		},
		
		invalidate: function () {
			clear(this.canvas);

			batch(this.zIndex, this.canvas.getContext("2d"), "draw");
		},
		
		hitTest: function () {
			
		},
		
		count: function () {
			return this.zIndex.length;
		},
		
		node: function (index) {
			return this.zIndex[index];
		},
		
		each: function (func) {
			this.zIndex.map(func);
		}
		
	};
	
	function Draggable() {
		init.call(this);
		
		this.draggable = document.createElement("canvas");
		
		this.draggable.className = "test";
	}
	
	Draggable.prototype.constructor = Draggable;
	Draggable.prototype = new Layer();
	
	Draggable.prototype.hitTest = function (x, y) {
		var id = numToRGBString(arrayToNumber(this.draggable.getContext("2d").getImageData(x, y, 1, 1).data));
		
		return this.index[id];
	};
	
	Draggable.prototype.add = function (node, draw) {
		Layer.prototype.add.call(this, node, draw);
		
		if (draw) {
			node.shadow(this.draggable.getContext("2d"));
		}
	};
	
	Draggable.prototype.clear = function () {
		Layer.prototype.clear.call(this);
		
		clear(this.draggable);
	};
	
	Draggable.prototype.empty = function (scale) {
		Layer.prototype.empty.call(this);
		
		clear(this.draggable);
	};
	
	Draggable.prototype.zoom = function (scale) {
		Layer.prototype.zoom.call(this, scale);
		
		align(this.draggable, this.scale, .5);
	};

	Draggable.prototype.size = function (width, height) {
		Layer.prototype.size.call(this, width, height);
		
		var canvas = this.draggable;
		
		size(canvas, width, height);
		
		align(canvas, this.scale, .5);
	};
	
	Draggable.prototype.invalidate = function () {
		Layer.prototype.invalidate.call(this);
		
		var canvas = this.draggable;
		
		clear(canvas);

		batch(this.zIndex, canvas.getContext("2d"), "shadow");
	};
	
	function Mask() {
		init.call(this);
	}
	
	Mask.prototype.constructor = Mask;
	Mask.prototype = new Layer();
	
	Mask.prototype.zoom = function (scale) {
		align(this.canvas, this.scale = scale, -1);
	};
	
	Mask.prototype.size = function (width, height) {
		var canvas = this.canvas;
		
		size(canvas, width, height);
		
		align(canvas, this.scale, -1);
	};
	
	function Select() {
		init.call(this);
	}
	
	Select.prototype.constructor = Select;
	Select.prototype = new Layer();
	
	Select.prototype.invalidate = function () {
		clear(this.canvas);

		batch(this.zIndex, this.canvas.getContext("2d"), "select");
	};
	
}) (window);













/**************************************************************************************************
 * Node
 **************************************************************************************************/

(function( window, undefined ) {
	Node.create = function (type, node) {
		switch (type) {
		case "device":
			return new Device(node, arguments[2]);
		
		case "line":
			return new Line(node, arguments[2] /*device from*/, arguments[3] /*device to*/);
		
		default:
			return new Node(node);	
		}
	};
	
	function init(node) {
		this.node = node;
	}
	
	function drawLine(context, pos1, pos2, label1, label2, pos) {
		var x1 = pos1.x,
			y1 = pos1.y,
			x2 = pos2.x,
			y2 = pos2.y,
			cpX, 	cpY;
			
		context.beginPath();
		
		context.moveTo(x1, y1);
		
		if (pos) {
			cpX = pos.x;
			cpY = pos.y;
			
			context.quadraticCurveTo(x1, y1, x2, y2);
		}
		else {
			cpX = (x1 + x2) /2;
			cpY = (y1 + y2) /2;
			
			context.lineTo(x2, y2);
		}
		
		context.stroke();
		
		if (label1) {
			context.fillText(label1, (x1 + cpX)/ 2, (y1 + cpY) /2);
		}
		
		if (label2) {
			context.fillText(label2, (x2 + cpX)/ 2, (y2 + cpY) /2);
		}
	}
	
	Node.prototype = {
		init: function (args) {
			var node = args && args[0];
			
			if (node) {
				init.call(this, node);
			}
		},
		
		id: function () {
			return this.node.id;
		},
		
		draw: function (context) {
			
		},
		
		shadow: function (context) {
			
		},
		
		select: function (context) {
			
		},
		
		move: function (x, y) {
			this.node.x += x;
			this.node.y += y;
		},
	};
	
	/* device
	*  {
	*     x: 198,
	*     y: -234,
	*     name": "ISP",
	*     type: "router",
	*     address": "192.168.0.1",
	*     id: "#000001"
	* }
	*/
	
	function Device(device, icon) {
		init.call(this, device);
		
		this.icon = icon;
	}
	
	Device.prototype = new Node();
	
	Device.prototype.constructor = Device;
	
	Device.prototype.pos = function () {
		return {
			x: this.node.x,
			y: this.node.y
		};
	},
	
	Device.prototype.size = function () {
		var icon = this.icon;
		
		return icon? {
			width: icon.width,
			height: icon.height
		}:{
			width: 0,
			height: 0
		};
	};
	
	Device.prototype.draw = function (context) {
		var device = this.node,
			icon = this.icon,
			name = device.name,
			address = device.address,
			x = device.x,
			y = device.y,
			width = icon.width,
			height = icon.height,
			offsetX = Math.round(width /2),
			offsetY = Math.round(height /2);
		
		if (icon) {
			context.drawImage(icon, x - offsetX, y - offsetY, width, height);
		}
		
		if (name) {
			context.font = "bold 10pt arial, \"맑은 고딕\"";
			context.textAlign="center";
			context.textBaseline = "top";
			context.fillStyle = "#000";
			context.fillText(name, x, y -12);
		}
		
		if (address) {
			context.fillStyle = "#008";
			context.font = "10pt arial, \"맑은 고딕\"";
			context.fillText(address, x, y + offsetY);
		}
	};
	
	Device.prototype.shadow = function (context) {
		var device = this.node,
			icon = this.icon,
			width = icon.width,
			height = icon.height;

		context.fillStyle = device.id;

		context.fillRect(device.x - Math.round(width /2), device.y - Math.round(height /2), width, height);
	};
	
	Device.prototype.select = function (context) {
		var device = this.node,
			icon = this.icon,
			width = icon.width,
			height = icon.height,
			lineWidth = 3;
		
		context.strokeStyle = "rgba(0, 255, 0, .8)";
		context.lineWidth = lineWidth;

		context.beginPath();
		context.rect(device.x - Math.round((width + lineWidth) /2),
				device.y - Math.round((height + lineWidth) /2),
				width + lineWidth,
				height + lineWidth);
		
		context.stroke();
	};
	
	/* line
	 * {
	 *     from: #000001,
	 *     to: #000002,
	 *     link: [
	 *         {
	 *             from: "eth1",
	 *             to: "fastethernet0/1",
	 *             bandwidth: 100000000
	 *         }, , ,
	 *     ]
	 * }
	 */
	
	function Line(line, from, to) {
		init.call(this, line);
		
		this.from = from;
		this.to = to;
	}
	
	Line.prototype = new Node();
	
	Line.prototype.constructor = Line;
	
	Line.prototype.draw = function (context) {
		var link = this.node.link,
			from = this.from,
			to = this.to,
			pos1 = from.pos(),
			pos2 = to.pos(),
			cpX = (pos1.x + pos2.x) /2,
			cpY = (pos1.y + pos2.y) /2,
			index = 0,
			length = link.length, 
			angle = Math.atan2(pos2.y - pos1.y, pos2.x - pos1.x) + Math.PI/2;
/*
		context.strokeStyle = "#282";
		context.lineWidth = "1";
		context.font = "10pt arial, \"맑은 고딕\"";
		context.textAlign= "center";
		context.textBaseline = "middle";
		context.fillStyle = "#999";
	*/	
		if (length %2 > 0) {
			drawLine(context, pos1, pos2, link[0].from, link[0].to);
			
			index++;
		}
		
		for (; index < length; index++, angle += Math.PI) {
			drawLine(context, pos1, pos2, link[index].from, link[index].to, {
				x: cpX + index * 20 * Math.cos(angle),
				Y: cpY + index * 20 * Math.sin(angle),
			});
		}
	};
	
}) (window);




/**************************************************************************************************
 * Icon
 **************************************************************************************************/

(function( window, undefined ) {
	
	function init(doc) {
		var library = doc.getElementsByTagName("IMG"),
			index = library.length,
			icon;
		
		this.library = {};
		
		while (index-- > 0) {
			icon = library[index];
			
			this.library[icon.alt] = icon;
		}
		
	}
	
	Icon.prototype = {
		init: function (args) {
			var id = args && args[0];
			
			if (id) {
				init.call(this, document.getElementById(id));
			}
		},
		
		get: function (name) {
			return this.library[name];
		}
	};
	
}) (window);