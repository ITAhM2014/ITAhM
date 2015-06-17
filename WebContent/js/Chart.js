;"use strict";

function Chart(id, height, max, onreset) {
	switch(arguments.length) {
	case 4:
		this.init(id, height, max, onreset);
		
		break;
	default:
		throw "IllegalArgumentException";	
	}
	
}

(function (window, undefined) {
	var marginTop = 10,
		marginRight = 10,
		marginBottom = 60,
		marginLeft = 60;
	
	function resize() {
		var rect = this.client.getBoundingClientRect(),
			width = this.width || 0;
		
		this.width = Math.floor(Math.max(0, rect.width - marginLeft - marginRight));
		
		if (this.width == width || this.width == 0) {
			return;
		}
		
		this.chart.width = this.width + marginLeft + marginRight;
		this.chart.height = this.height + marginTop + marginBottom;
	
		if (!this.base) {
			this.base = Math.floor(new Date().getTime() /60000) *60000;
		}
		else {
			this.base += (width - this.width) *60000;
		}
		
		this.onreset(this.base, this.width, this.scale);
	}
	
	function onResize() {
		clearTimeout(this.resize);
		
		this.resize = setTimeout(resize.bind(this), 300);
	}
	
	function onDrag(x, scroll, e) {
		var context = this.context,
			width = this.width,
			height = this.height,
			base = this.base,
			from = base - (width -1) *60000;
		
		scroll += (e.clientX - x);
		
		Chart.clear(this.chart);
		
		context.putImageData(this.background, 0, 0);
		drawTimeScale(context, width, height, from - scroll *60000, base - scroll *60000);
		
		//context.drawImage(this.graph, -Math.min(scroll, 0), 0, width - scroll, height, marginLeft + Math.max(0, scroll), marginTop, width - scroll, height);
		context.drawImage(this.graph,
				-Math.min(scroll, 0),
				0,
				width - scroll,
				height,
				marginLeft + Math.max(0, scroll),
				marginTop,
				width - scroll,
				height);
		
		this.scroll = scroll;
	}
	
	function onMouseDown(e) {
		this.chart.onmousemove= onDrag.bind(this, e.clientX, this.scroll);
	}
	
	function onMouseUp(e) {
		if (this.chart.onmousemove) {
	
			this.base -= this.scroll * 60000;
			this.onreset(this.base, this.width, this.scale);
			
			this.scroll = 0;
		}
		
		this.chart.onmousemove = undefined;
	}

	function onMouseWheel(e) {
		e.preventDefault();
		
		var scale;
		if (e.wheelDelta > 0) {
			// 확대
			
			scale = Math.max(1, this.scale -1);
		}
		else {
			// 축소
			
			scale = Math.min(3, this.scale +1);
		}
		
		if (scale != this.scale) {
			this.scale = scale;
			
			this.onreset(this.base, this.width, this.scale);
		}
	}
	
	function drawTimeScale(context, width, height, from, base) {
		context.save();
		
		context.fillStyle = "#eee";
		
		context.translate(width + marginLeft, height + marginTop);
		context.rotate(Math.PI /2);
		
		for (var x=base, gap=0; x > from; x -= 3600000, gap += 60) {
			context.fillText(getTimeString(x), 5, gap);
		}
		
		context.restore();
	}
	
	function getTimeString(time) {
		var date = new Date(time);
		
		return date.getDate() +", "+ date.getHours() +":"+ date.getMinutes();
	}
	
	Chart.prototype = {
		init: function (id, height, max, onreset) {
			this.client = document.getElementById(id);
			
			this.chart = document.createElement("canvas");
			this.context = this.chart.getContext("2d");
			this.graph = document.createElement("canvas");
			this.graphContext = this.graph.getContext("2d");
			
			this.height = Math.floor(height);
			this.max = max;
			this.scale =1;
			this.scroll = 0;
			this.onreset = onreset;
			
			while (this.client.firstChild) {
				this.client.removeChild(this.client.firstChild);
			}
			
			this.client.appendChild(this.chart);
			
			this.chart.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.chart.addEventListener("mouseup", onMouseUp.bind(this), false);
			this.chart.addEventListener("mouseout", onMouseUp.bind(this), false);
			this.chart.addEventListener("mousewheel", onMouseWheel.bind(this), false);
			
			window.addEventListener("resize", onResize.bind(this), false);
			
			resize.call(this);
		},
		
		draw: function (data, color) {
			var size = this.width,
				context = this.graphContext,
				from = this.base - (size -1) *60000;
			
			context.beginPath();
			context.strokeStyle = color;
			
			for (var x=from, i=0; i<size; i++) {
				if (typeof data[x] == "number") {
					context.lineTo((x - from) /60000, Math.round(data[x] /this.max *this.height));
				}
				else {
					context.stroke();
					
					context.beginPath();
				}
				
				x += 60000;
			}
			
			context.stroke();
		},
		
		begin: function (label) {
			var context = this.context;
			
			this.graph.width = this.width;
			this.graph.height = this.height;
			this.graphContext.setTransform(1, 0, 0, -1, 0, this.height);
			
			context.save();
			
			Chart.clear(this.chart);
			
			context.strokeStyle = "#eee";
			context.lineWidth = .5;
			context.strokeRect(marginLeft -.5, marginTop -.5, this.width +1, this.height +1);
			
			context.fillStyle = "#eee";
			context.textBaseline = "middle";
			context.textAlign = "right";
			context.setTransform(1, 0, 0, 1, marginLeft -5, marginTop);
			context.fillText(label, 0, 0);
			
			context.restore();
			
			this.background = context.getImageData(0, 0, this.chart.width, this.chart.height);
		},
		
		end: function () {
			var context = this.context,
				width = this.width,
				height = this.height,
				base = this.base,
				from = base - (width -1) *60000;
			
			Chart.clear(this.chart);
			context.putImageData(this.background, 0, 0);
			context.drawImage(this.graph, marginLeft, marginTop);
			
			drawTimeScale(context, width, height, from, base);
		}
		
	};

	Chart.clear = function (canvas) {
		var context = canvas.getContext("2d");
		
		context.save();
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		context.restore();
	}
	
}) (window);