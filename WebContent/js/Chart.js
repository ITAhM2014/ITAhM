;"use strict";

function Chart(id, height, max, label, onreset) {
	switch(arguments.length) {
	case 5:
		this.init(id, height, max, label, onreset);
		
		break;
	default:
		throw "IllegalArgumentException";	
	}
	
}

(function (window, undefined) {
	var MINUTE = 60000,
		MINUTE5 = 300000,
		HOUR6 = 21600000,
		marginTop = 10,
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
			this.base = Math.floor(new Date().getTime() /MINUTE) *MINUTE;
		}
		else {
			this.base += (width - this.width) *MINUTE;
		}
		
		reset.call(this);
	}
	
	function reset() {
		Chart.clear(this.graph);
		
		this.onreset(this.base, this.width, this.scale);
	}
	
	function getStep(scale) {
		switch(scale) {
		case 1:
			return MINUTE;
		case 2:
			return MINUTE5;
		case 3:
			return HOUR6;
		default:
			throw "IllegalArgumentException";
		}
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
			from, step = getStep(this.scale);
		
		scroll += (e.clientX - x);
		
		from = base - (width -1) * step;
		
		Chart.clear(this.chart);
		
		context.putImageData(this.background, 0, 0);
		drawTimeScale(context, width, height, from - scroll * step, base - scroll * step, this.scale);
		
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
	
			this.base -= this.scroll * getStep(this.scale);
			this.scroll = 0;
			
			reset.call(this);
		}
		
		this.chart.onmousemove = undefined;
	}
	
	function zoom(zoom) {
		var scale;
		if (zoom) {
			// 확대
			
			scale = Math.max(1, this.scale -1);
		}
		else {
			// 축소
			
			scale = Math.min(3, this.scale +1);
		}
		
		if (scale != this.scale) {
			this.scale = scale;
			
			reset.call(this);
		}
	}
	
	function onMouseWheel(e) {
		e.preventDefault();
		
		zoom.call(this, e.wheelDelta > 0);
	}
	
	function drawTimeScale(context, width, height, from, base, scale) {
		var step;
		
		switch(scale) {
		case 1:
			step = MINUTE;
			break;
		case 2:
			step = MINUTE5;
			break;
		case 3:
			step = HOUR6;
			break;
		}
		
		context.save();
		
		context.fillStyle = "#eee";
		context.font = "10px arial, '맑은 고딕'";
		
		context.translate(width + marginLeft, height + marginTop);
		context.rotate(Math.PI /2);
		
		for (var x=base, gap=0; gap < width; x -= step * 60, gap += 60) {
			context.fillText(getTimeString(x, scale), 5, gap);
		}
		
		context.restore();
	}
	
	function getTimeString(time, scale) {
		var date = new Date(time);
		
		switch (scale) {
		case 1:
		case 2:
			var day = date.getDate();
			var hour = date.getHours();
			var munite = date.getMinutes();
			
			return (day > 9? day: "0" + day) +"d "+(hour > 9? hour: "0" + hour) +":"+ (munite > 9? munite: "0" + munite);
		case 3:
			var month = date.getMonth();
			var day = date.getDate();
			var hour = date.getHours();
			
			return date.getFullYear() +"-"+ (month > 9? month: "0"+ month) +"-"+ (day > 9? day: "0"+ day) +" "+ hour +"h";
		}
		if (scale)
		return date.getDate() +", "+ date.getHours() +":"+ date.getMinutes();
	}
	
	Chart.prototype = {
		init: function (id, height, max, label, onreset) {
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
			
			this.begin(label);
		},
		
		draw: function (data, color) {
			var context = this.graphContext,
				width = this.width,
				height = this.height,
				base = new Date(this.base),
				from, step;
			
			context.beginPath();
			context.strokeStyle = color;
			
			switch(this.scale) {
			case 1:
				step = MINUTE;
			
				break;
			
			case 2:
				step = MINUTE5;
				base.setMinutes(Math.floor(base.getMinutes() /5) *5);
				
				break;
				
			case 3:
				step = HOUR6;
				base.setHours(Math.floor(base.getHours() /6) *6);
				base.setMinutes(0);
				break;
			}
			
			base = base.getTime();
			from = base - (width -1) * step;
			for (var x=from, i=0; i<width; i++, x += step) {
				if (typeof data[x] == "number") {
					context.lineTo(i, Math.round(data[x] /this.max *this.height));
				}
				else {
					context.stroke();
					
					context.beginPath();
				}
			}
			
			context.stroke();
			
			context = this.context;
			
			Chart.clear(this.chart);
			context.putImageData(this.background, 0, 0);
			drawTimeScale(context, width, height, base - (width -1) *MINUTE, base, this.scale);
			context.drawImage(this.graph, marginLeft, marginTop);
		},
		
		begin: function (label) {
			var context = this.context,
				width = this.width,
				height = this.height,
				base = this.base;
			
			this.graph.width = width;
			this.graph.height = height;
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
			
			drawTimeScale(context, width, height, base - (width -1) *MINUTE, base, this.scale);
		},
		
		end: function () {
			var context = this.context,
				width = this.width,
				height = this.height,
				base = this.base,
				from = base - (width -1) *MINUTE;
			
			//Chart.clear(this.chart);
			//context.putImageData(this.background, 0, 0);
			//context.drawImage(this.graph, marginLeft, marginTop);
			
			//drawTimeScale(context, width, height, from, base);
			
			//context.drawImage(this.graph, marginLeft, marginTop);
		},
		
		tmp: function (zoomIn) {
			zoom.call(this, zoomIn);
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