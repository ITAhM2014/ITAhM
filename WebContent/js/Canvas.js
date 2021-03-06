;"use strict";

function Canvas(id) {
	this.init(id);
}

function Layer(draw) {
	this.init(draw);
}

function numToRGBString(n) {
	return "#"+ (1 << 24 | n).toString(16).substring(1);
}

function arrayToNumber(array) {
	if (array[3] === 255) {
		return array[0]<<16 | array[1]<<8 | array[2];
	} 
	
	return 0;
}

function getPos(canvas, e) {
	var rect = canvas.getBoundingClientRect();
	
	return {
		x: e.clientX - rect.left,
		y: e.clientY - rect.top
	};
}

/**************************************************************************************************
 * Canvas
 **************************************************************************************************/

(function(window, undefined) {
	var schedule;
	
	function fire(name, event) {
		var eventHandler = this.eventHandler[name],
			index, length;
		
		if (eventHandler) {
			for (var i=0, _i=eventHandler.length; i<_i; i++) {
				if (eventHandler[i](event) === false) {
					return false;
				}
			}
		}
		
		return true;
	}
	
	/**
	 * this.mouseMove = dragStart or dragMove or mouseMove
	 */
	function onMouseMove(e) {
		var pos = getPos(this.canvas, e),
			x = pos.x,
			y = pos.y;
		
		this.mouseMove(x, y, e.ctrlKey);
	}
	
	function onMouseDown(e) {
		if (e.button != 0) {
			e.preventDefault();
			
			return;
		}
		
		var pos = getPos(this.canvas, e),
			x = pos.x,
			y = pos.y,
			hit = this.hitTest(x, y);
		
		this.mouseUp = click.bind(this, {
				node: hit.node,
			});
		
		this.mouseMove = dragStart.bind(this, {
				node: hit.node,
				layer: hit.layer,
				x: x,
				y: y
			});
	}
	
	function onMouseUp(e) {
		if (e.button != 0) {
			e.preventDefault();
			
			return;
		}
		
		var pos = getPos(this.canvas, e),
			x = pos.x,
			y = pos.y;
		
		this.mouseUp(x, y);
		
		this.mouseMove = mouseMove;
	}
	
	function onMouseWheel(e) {
		e.preventDefault();
		
		clearTimeout(schedule);
		
		schedule = setTimeout(function () {
			var scale = e.wheelDelta > 0? this.scale *1.2: this.scale /1.2;
			
			zoom.call(this, scale);
		}.bind(this), 100);
	}
	
	function zoom(scale) {
		var layer;
		
		this.scale = scale;
		
		for (var i=0, _i=this.layers.length; i<_i; i++) {
			layer = this.layers[i];
			
			layer.scale = scale;
			
			clear(layer.canvas);
			clear(layer.shadow);
			
			layer.context().font = (10 / this.scale) +"px tahoma, arial, '맑은 고딕'";
			layer.context().setTransform(scale, 0, 0, scale, Math.round(layer.canvas.width *.5), Math.round(layer.canvas.height *.5));
			layer.shadow.getContext("2d").setTransform(scale, 0, 0, scale, Math.round(layer.shadow.width *.5), Math.round(layer.shadow.height *.5));
			
			layer.invalidate();
		}
	}
	
	function click(binding, x, y) {
		var hit = this.hitTest(x, y),
			node = hit.node;
		
		if (binding.node !== node) {
			return;
		}
		
		if (node != this.selected) {
			if (fire.call(this, "select", {
				x: Math.round((x - this.width /2) / this.scale),
				y: Math.round((y - this.height /2) / this.scale),
				canvasX: x,
				canvasY: y,
				node: node
			})) {
				if (node) {
					hit.layer.top(node);
				}
				
				this.invalidate();
				
				this.selected = node;
			}
		}
	}
	
	/**
	 * binding.node : 선택된 node or undefined
	 * binding.layer : node가 선택되었다면 node를 가진 layer
	 */
	function dragStart(binding, x, y) {
		var node = binding.node;
		
		for (var i=0, _i=this.layers.length; i<_i; i++) {
			this.fragment.appendChild(this.layers[i].canvas);
		}
		
		if (node && this.selected == node) {
			var canvas = document.createElement("canvas"),
				context = canvas.getContext("2d");
		
			canvas.width = this.width *3;
			canvas.height = this.height *3;
	
			context.globalAlpha = .5;
			
			clear(binding.layer.canvas);
			
			binding.layer.draw({
				context: binding.layer.context(),
				node: node
			});
			
			context.drawImage(binding.layer.canvas, 0, 0);
		
			binding.layer.invalidate();
			
			binding["capture"] = canvas;
		}
		
		this.mouseMove = dragMove.bind(this, binding);
		
		this.mouseUp = dragEnd.bind(this, binding);
		
		this.mouseMove(x, y);
	}
	
	function mouseMove (x, y, ctrlKey) {
		var hit = this.hitTest(x, y);
		
		fire.call(this, "mousemove", {
			x: Math.round((x - this.width /2) / this.scale),
			y: Math.round((y - this.height /2) / this.scale),
			ctrlKey: ctrlKey? true: false,
			node: hit? hit["node"]: undefined
		});
	}
	
	function dragMove (binding, x, y) {
		var context = this.mask.getContext("2d");
		
		clear(this.mask);
		
		x -= (binding.x + this.mask.width);
		y -= (binding.y + this.mask.height);
		
		for (var i=0, _i=this.layers.length; i<_i; i++) {
			context.drawImage(this.layers[i].canvas,
				binding.capture? - this.mask.width: x,
				binding.capture? - this.mask.height: y);
		}
		
		if (binding.capture) {
			context.drawImage(binding.capture, x, y);
		}
	}
	
	function dragEnd(binding, x, y) {
		var x = Math.floor(((x - binding.x) / this.scale) /5 +.5) *5,
			y = Math.floor(((y - binding.y) / this.scale) /5 +.5) *5;
		
		clear(this.mask);
		
		if (binding.capture) {
			binding.node.x += x;
			binding.node.y += y;
			binding.layer.invalidate();
		}
		else {
			var layer, node;
			for (var i=1, _i=this.layers.length; i<_i; i++) {
				layer = this.layers[i]; 
				
				for (var j=0, _j=layer.zIndex.length; j<_j; j++) {
					node = layer.zIndex[j];
					
					move(node, x, y);
				}
			}
		}
		
		this.invalidate();
		
		this.canvas.insertBefore(this.fragment, this.mask);
	}
	
	function move(node, x, y) {
		if (node.x !== undefined && node.y !== undefined) {
			node.x += x;
			node.y += y;
		}
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
	
	Canvas.prototype = {
		init: function (id) {
			this.canvas = document.getElementById(id);
			
			if (!this.canvas) {
				throw "IllegalArgumentException";
			}
			
			this.canvas.style.overflow = "hidden";
			
			this.scale = 1;
			this.layers = [];
			this.eventHandler = {};
			this.mouseMove = mouseMove;
			this.fragment = document.createDocumentFragment();
			
			this.resize();
			
			this.mask = document.createElement("canvas");
			this.mask.width = this.width;
			this.mask.height = this.height;
			this.mask.style.position = "absolute";
			this.mask.style.top = 0;
			this.mask.style.left = 0;
			this.canvas.appendChild(this.mask);
			
			this.canvas.addEventListener("mousemove", onMouseMove.bind(this), false);
			this.canvas.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.canvas.addEventListener("mouseup", onMouseUp.bind(this), false);
			//this.canvas.addEventListener("mouseout", onMouseUp.bind(this), false);
			this.canvas.addEventListener("mousewheel", onMouseWheel.bind(this), false);
			
			window.addEventListener("resize", this.resize.bind(this), false);
		},
		
		layer: function (draw) {
			var layer = new Layer(draw);
			
			layer.size(this.width, this.height);
			
			this.layers[this.layers.length] = layer;
			
			this.canvas.insertBefore(layer.canvas, this.mask);
			
			return layer;
		},
		
		zoom: function (zoonIn) {
			var scale = zoonIn? this.scale *1.2: this.scale /1.2;
			
			zoom.call(this, scale);
		},
	
		resize: function(e) {
			clearTimeout(this.schedule);
			
			this.schedule = setTimeout(function () {
				var rect = this.canvas.getBoundingClientRect(),
					width = rect.width,
					height = rect.height,
					layer;
				
				this.width = width;
				this.height = height;
				
				this.mask.width = width;
				this.mask.height = height;
				
				for (var i=0, _i=this.layers.length; i<_i; i++) {
					layer = this.layers[i];
					
					layer.size(width, height);
					layer.invalidate();
				}
			}.bind(this), 100);
		},
		
		empty: function () {
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				this.layers[i].empty();
			}
		},
		
		hitTest: function (x, y) {
			var result = {};
			
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				if (result["node"] = this.layers[i].hitTest(x, y)) {
					result["layer"] = this.layers[i];
					
					break;
				}
			}
			
			return result;
		},
		
		invalidate: function () {	
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				this.layers[i].invalidate();
			}
		},
		
		capture: function () {
			var canvas = document.createElement("canvas"),
				context = canvas.getContext("2d"),
				width = this.width,
				height = this.height;
			
			canvas.width = width;
			canvas.height = height;
			
			context.translate(-width, -height);
			
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				context.drawImage(this.layers[i].canvas, 0, 0);
			}
			
			return canvas.toDataURL();
		},
		
		on: function (type, handler) {
			var eventHandler = this.eventHandler;
			
			if (!eventHandler[type]) {
				eventHandler[type] = [];
			}
			
			eventHandler[type].push(handler);
		}
	};
	
	Canvas.clear = clear;
	
})(window);













/**************************************************************************************************
 * Layer
 **************************************************************************************************/

(function( window, undefined ) {
	
	Layer.prototype = {
		init: function (draw) {
			this.canvas = document.createElement("canvas");
			this.shadow = document.createElement("canvas");
			
			this.canvas.style.position = "absolute";
			
			/*
			 * zIndex array of node
			 */
			this.zIndex = [];
			
			/*
			 * zArray array of #code
			 */
			this.zArray = [];
			
			/*
			 * map #code with node
			 */
			this.map = {};
			this.index = 1;
			this.scale = 1;
			this.width = 0;
			this.height = 0;
			
			this.draw = typeof draw == typeof Function? draw: new Function();
		},	
		
		context: function (attrs) {
			var context = this.canvas.getContext("2d");
			
			if (!attrs) {
				return context;
			}
			
			for (var name in attrs) {
				context[name] = attrs[name];
			}
			
			context.save();
		},
		
		add: function (node) {
			if (this.zIndex.indexOf(node) != -1) {
				return;
			}
			
			var index = this.zIndex.length;
			
			this.zIndex[index] = node;
			this.map[this.zArray[index] = numToRGBString(this.index++)] = node;
		},
		
		remove: function (node) {
			var index = this.zIndex.indexOf(node);
			
			if (index == -1) {
				return;
			}
			
			delete this.map[this.zArray[index]];
			
			this.zArray.splice(index, 1);
			this.zIndex.splice(index, 1);
		},
		
		empty: function () {
			this.zIndex = [];
			this.zArray = [];
			this.map = {};
		},
		
		size: function (width, height) {
			this.canvas.width = width *3;
			this.canvas.height = height *3;
			
			this.shadow.width = width;
			this.shadow.height = height;
			
			this.canvas.style.top = (height *-1) +"px";
			this.canvas.style.left = (width *-1) +"px";
			
			this.canvas.getContext("2d").font = (10 / this.scale) +"px tahoma, arial, '맑은 고딕'";
			this.canvas.getContext("2d").setTransform(this.scale, 0, 0, this.scale, Math.round(width *1.5), Math.round(height *1.5));
			
			this.shadow.getContext("2d").setTransform(this.scale, 0, 0, this.scale, Math.round(width *.5), Math.round(height *.5));
		},
		
		bottom: function(node) {
			var index = this.zIndex.indexOf(node),
				color = this.zArray[index];
			
			for (var i=index; i >0; i--) {
				this.zIndex[i] = this.zIndex[i -1];
				this.zArray[i] = this.zArray[i -1];
			}
			
			this.zIndex[0] = node;
			this.zArray[0] = color;
		},
		
		top: function(node) {
			var index = this.zIndex.indexOf(node),
				color = this.zArray[index],
				last = this.zIndex.length -1;
			
			for (var i=index; i < last; i++) {
				this.zIndex[i] = this.zIndex[i +1];
				this.zArray[i] = this.zArray[i +1];
			}
			
			this.zIndex[last] = node;
			this.zArray[last] = color;
		},
		
		invalidate: function () {
			var draw = {};
		
			draw["context"] = this.canvas.getContext("2d");
			draw["shadow"] = this.shadow.getContext("2d");
			
			Canvas.clear(this.canvas);
			Canvas.clear(this.shadow);
			
			for (var i=0, _i=this.zIndex.length; i<_i; i++) {
				
				draw["node"] = this.zIndex[i];
				draw["color"] = this.zArray[i];
			
				this.draw(draw);
			}
		},
		
		hitTest: function (x, y) {
			var array = this.shadow.getContext("2d").getImageData(x, y, 1, 1).data;
			
			if (array[3] == 255) {
				return this.map[numToRGBString(arrayToNumber(array))];
			}
		},
		
		count: function () {
			return this.zIndex.length;
		},
		
		node: function (index) {
			return this.zIndex[index];
		},
		
		draw: function () {
			var array = this.zIndex;
			
			for (var i=0, _i=array.length; i< _i; i++) {
				array[i].draw(this.context);
			}
		},
		
		clear: function () {
			Canvas.clear(this.canvas);
			Canvas.clear(this.shadow);
		}
	};
	
}) (window);
