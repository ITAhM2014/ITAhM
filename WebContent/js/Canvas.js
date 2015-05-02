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
	
	function fire(eventHandler, event) {
		var index, length;
		
		if (eventHandler) {
			for (var i=0, _i=eventHandler.length; i<_i; i++) {
				if (eventHandler[i](event) === false) {
					return false;
				}
			}
		}
		
		return true;
	}
	
	function onMouseMove(e) {
		var pos = getPos(this.canvas, e);
		
		this.mouseMove(pos.x, pos.y);
	}
	
	function onMouseDown(e) {
		if (e.button != 0) {
			//e.preventDefault();
			
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
		var pos = getPos(this.canvas, e),
			x = pos.x,
			y = pos.y;
		
		this.mouseUp(x, y);
		
		this.mouseMove = mouseMove;
	}
	
	function click(binding, x, y) {
		var hit = this.hitTest(x, y),
			node = hit.node;
		
		if (binding.node !== node) {
			return;
		}
		
		if (node != this.selected) {
			if (fire(this.eventHandler["select"], node)) {
				if (node) {
					hit.layer.top(node);
				}
				
				this.invalidate();
				
				this.selected = node;
			}
		}
	}
	
	function dragStart(binding, x, y) {
		var node = binding.node;
		
		for (var i=1, _i=this.layers.length; i<_i; i++) {
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
	
	function mouseMove (x, y) {
		fire(this.eventHandler["mousemove"], {
			x: Math.round((x - this.width /2) / this.scale),
			y: Math.round((y - this.height /2) / this.scale)
		});
	}
	
	function dragMove (binding, x, y) {
		var canvas = this.mask.canvas,
			context = this.mask.context();
		
		clear(canvas);
		
		x -= (binding.x + canvas.width);
		y -= (binding.y + canvas.height);
		
		for (var i=1, _i=this.layers.length; i<_i; i++) {
			context.drawImage(this.layers[i].canvas,
				binding.capture? - canvas.width: x,
				binding.capture? - canvas.height: y);
		}
		
		if (binding.capture) {
			context.drawImage(binding.capture, x, y);
		}
	}
	
	function dragEnd(binding, x, y) {
		var x = Math.round((x - binding.x) / this.scale),
			y = Math.round((y - binding.y) / this.scale),
			array;
		
		clear(this.mask.canvas);
		
		if (binding.capture) {
			binding.node.x += x;
			binding.node.y += y;
			binding.layer.invalidate();
		}
		else {
			array = this.layers;
			
			var layer, node;
			for (var i=1, _i=array.length; i<_i; i++) {
				layer = array[i]; 
				
				for (var j=0, _j=layer.zIndex.length; j<_j; j++) {
					node = layer.zIndex[j];
					
					move(node, x, y);
				}
			}
		}
		
		this.invalidate();
		
		this.canvas.insertBefore(this.fragment, this.mask.canvas);
	}
	
	function move(node, x, y) {
		if (node.x && node.y) {
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
			
			this.mask = new Layer();
			this.mask.canvas.width = this.width;
			this.mask.canvas.height = this.height;
			
			this.layers[0] = this.mask;
			
			this.canvas.appendChild(this.mask.canvas);
			
			this.canvas.addEventListener("mousemove", onMouseMove.bind(this), false);
			this.canvas.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.canvas.addEventListener("mouseup", onMouseUp.bind(this), false);
			//map.addEventListener("mouseout", onMouseUp.bind(this), false);
			
			window.addEventListener("resize", this.resize.bind(this), false);
		},
		
		layer: function (draw) {
			var layer = new Layer(draw);
			
			layer.size(this.width, this.height);
			
			this.layers[this.layers.length] = layer;
			
			this.canvas.insertBefore(layer.canvas, this.mask.canvas);
			
			return layer;
		},
		
		zoom: function (scale) {
			var layer;
			
			this.scale = scale;
			
			for (var i=1, _i=this.layers.length; i<_i; i++) {
				layer = this.layers[i];
				
				clear(layer.canvas);
				clear(layer.shadow);
				
				layer.context().setTransform(scale, 0, 0, scale, Math.round(layer.canvas.width *.5), Math.round(layer.canvas.height *.5));
				layer.shadow.getContext("2d").setTransform(scale, 0, 0, scale, Math.round(layer.shadow.width *.5), Math.round(layer.shadow.height *.5));
				
				layer.invalidate();
			}
		},
	
		resize: function(e) {
			var rect = this.canvas.getBoundingClientRect(),
				width = rect.width,
				height = rect.height,
				layer, x, y;
			
			this.width = width;
			this.height = height;
			
			x = Math.round(width /2);
			y = Math.round(height /2);
			
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				layer = this.layers[i];
				
				layer.size(width, height);
				layer.invalidate();
			}
			
			//this.mask.size(width, height);
		},
		
		empty: function () {
			for (var i=0, _i=this.layers.length; i<_i; i++) {
				this.layers[i].empty();
			}
		},
		
		hitTest: function (x, y) {
			var result = {};
			
			for (var i=1, _i=this.layers.length; i<_i; i++) {
				if (result["node"] = this.layers[i].hitTest(x, y)) {
					result["layer"] = this.layers[i];
					
					break;
				}
			}
			
			return result;
		},
		
		invalidate: function () {	
			for (var i=1, _i=this.layers.length; i<_i; i++) {
				this.layers[i].invalidate();
			}
		},
		
		/*
		select: function (node, toggle) {
			var index = this.selected.indexOf(node);
			
			if (index != -1) {
				if (toggle) {
					this.selected.splice(index, 1);
				}
			}
			else {
				this.selected[this.selected.length] = node;
			}
		},
		*/
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
		/*
		find: function (node) {
			return this.index[node.id()]? true: false;
		},
		*/
		zoom: function (scale) {
			this.scale = scale;
			
			scale(this.canvas, scale);
			scale(this.shadow, scale);
		},
		
		size: function (width, height) {
			this.canvas.width = width *3;
			this.canvas.height = height *3;
			
			this.shadow.width = width;
			this.shadow.height = height;
			
			this.canvas.style.top = (height *-1) +"px";
			this.canvas.style.left = (width *-1) +"px";
			
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
		}
		
	};
	
}) (window);
