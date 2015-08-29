; "use strict";

function Draggable(element) {
	this.init(element);
}

(function (window, undefined) {
	
	function onDragStart(e) {
		var x = e.clientX,
			y = e.clientY;
		this.onmousemove = onDragMove.bind(this);
		
		this.event = {
			x: x,
			y: y,
			lastX: x,
			lastY: y
		};
		
		fire.call(this, "dragstart", this.event);
		
		onDragMove.call(this, e);
	}
	
	function onDragMove(e) {
		var x = e.clientX,
			y = e.clientY;
		
		this.event.dragX = x - this.event.x;
		this.event.dragY = y - this.event.y;
		this.event.moveX = x - this.event.lastX;
		this.event.moveY = y - this.event.lastY;
		this.event.lastX = x;
		this.event.lastY = y;
		
		fire.call(this, "dragmove", this.event);
	}
	
	function onMouseDown(e) {
		this.onmousemove = onDragStart.bind(this);
	}
	
	function onMouseMove(e) {
		if (this.onmousemove) {
			this.onmousemove(e);
		}
	}
	
	function onMouseUp(e) {
		var x = e.clientX,
			y = e.clientY;
		
		if (this.event) {
			if (this.event.x !== x && this.event.y != y) {
				this.event.dragX = x - this.event.x;
				this.event.dragY = y - this.event.y;
				this.event.lastX = x;
				this.event.lastY = y;
				
				fire.call(this, "dragend", this.event);
			}
			
			this.event = undefined;
		}
		
		this.onmousemove = undefined;
	}
	
	function fire(name, event) {
		var eventHandler = this.eventHandler[name],
			index, length;
		
		if (eventHandler) {
			for (var i=0, _i=eventHandler.length; i<_i; i++) {
				eventHandler[i](event);
			}
		}
	}
	
	Draggable.prototype = {
		init: function (element) {
			this.graggable = element;
			this.onmousemove = undefined;
			this.eventHandler = {};
			
			element.addEventListener("mousedown", onMouseDown.bind(this), false);
			element.addEventListener("mousemove", onMouseMove.bind(this), false);
			element.addEventListener("mouseup", onMouseUp.bind(this), false);
			element.addEventListener("mouseout", onMouseUp.bind(this), false);
		},
		
		on: function (type, handler) {
			var eventHandler = this.eventHandler[type];
			
			if (!eventHandler) {
				this.eventHandler[type] = eventHandler = [];
			}
			
			eventHandler[eventHandler.length] = handler;
		}
};

}) (window);
