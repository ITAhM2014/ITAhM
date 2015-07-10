;"use strict";

var MINUTE = 60000,
	MINUTE5 = 300000,
	HOUR6 = 21600000,
	MARGIN_TOP = 15,
	MARGIN_RIGHT = 15,
	MARGIN_BOTTOM = 90,
	MARGIN_LEFT = 60,
	SCALE_SPACE = 60;

function Chart(id, height, label, onreset) {
	switch(arguments.length) {
	case 4:
		this.init(id, height, label, onreset);
		
		break;
	default:
		throw "IllegalArgumentException";	
	}
	
}

(function (window, undefined) {	
	
	function resize() {
		var rect = this.client.getBoundingClientRect(),
			width = this.width || 0;
		
		this.width = Math.floor(Math.max(0, rect.width - MARGIN_LEFT - MARGIN_RIGHT));
		
		if (this.width == width || this.width == 0) {
			return;
		}
		
		this.chart.width = this.width + MARGIN_LEFT + MARGIN_RIGHT;
		this.chart.height = this.height + MARGIN_TOP + MARGIN_BOTTOM;
	
		if (!this.base) {
			this.base = Math.floor(new Date().getTime() /MINUTE) *MINUTE;
		}
		else {
			this.base += (width - this.width) *MINUTE;
		}
		
		reset.call(this);
	}
	
	function reset() {
		var context = this.context,
			width = this.width,
			height = this.height;
		
		Chart.clear(this.chart);
		Chart.clear(this.graph);
		
		drawBackground(context, width, height, this.label);
		
		this.background = context.getImageData(0, 0, this.chart.width, this.chart.height);
		
		this.onreset(this.base, width, this.scale);
	}
	
	function getTimeUnit(scale) {
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
			from, timeUnit = getTimeUnit(this.scale);
		
		scroll += (e.clientX - x);
		
		from = base - (width -1) * timeUnit;
		
		Chart.clear(this.chart);
		
		context.putImageData(this.background, 0, 0);
		drawTimeScale(context, width, height, from - scroll * timeUnit, base - scroll * timeUnit, this.scale);
		
		//context.drawImage(this.graph, -Math.min(scroll, 0), 0, width - scroll, height, MARGIN_LEFT + Math.max(0, scroll), MARGIN_TOP, width - scroll, height);
		context.drawImage(this.graph,
				-Math.min(scroll, 0),
				0,
				width - scroll,
				height,
				MARGIN_LEFT + Math.max(0, scroll),
				MARGIN_TOP,
				width - scroll,
				height);
		
		this.scroll = scroll;
	}
	
	function onMouseDown(e) {
		this.chart.onmousemove= onDrag.bind(this, e.clientX, this.scroll);
	}
	
	function onMouseUp(e) {
		if (this.chart.onmousemove && this.scroll != 0) {
			this.base -= this.scroll * getTimeUnit(this.scale);
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
	
	function drawBackground(context, width, height, label) {
		context.save();
		
		context.strokeStyle = "#eee";
		context.lineWidth = .5;
		context.strokeRect(MARGIN_LEFT -.5, MARGIN_TOP -5.5, width +1, height +11);
		
		context.save();
		context.globalAlpha = .7;
		
		var x1 = MARGIN_LEFT -10,
			x2 = MARGIN_LEFT + width +10,
			y = MARGIN_TOP +.5;
		
		for (var i=0; i<3; i++, y += height /2) {
			context.beginPath();
			context.moveTo(x1, y);
			context.lineTo(x2, y);
			context.stroke();
		}
		
		context.restore();
		
		context.fillStyle = "#eee";
		context.textBaseline = "middle";
		context.textAlign = "right";
		context.setTransform(1, 0, 0, 1, MARGIN_LEFT -5, MARGIN_TOP);
		context.fillText(label, -10, 0);
		context.fillText("0", -10, height);
		
		context.restore();
	}
	
	function drawTimeScale(context, width, height, from, base, scale) {
		var timeUnit = MINUTE;
		
		if (scale == 2) {
			timeUnit = MINUTE5;
		}
		else if (scale == 3) {
			timeUnit = HOUR6;
		}
		
		context.save();
		
		context.fillStyle = "#eee";
		context.font = "10px tahoma, arial, '맑은 고딕'";
		
		context.translate(width + MARGIN_LEFT, height + MARGIN_TOP);
		context.rotate(Math.PI /2);
		
		/**
		 * @param x graph의 x축, 1눈금이 scale에 따라 1분, 5분, 6시간을 의미한다.
		 */
		var date, year, month, day, hour, minute,
			time = base,
			x = 0;
		
		/**
		 * 분(minute) 값이 0일때까지 x를 움직인다. scale3에서는 항상 x === 0 이다. (그렇지 않다면 오류)
		 */
		do {
			date = new Date(time);
			
			minute = date.getMinutes();
			if (minute === 0) {
				break;
			}
			
			time -= timeUnit;
		}
		while (x++ < width);
		
		for (; x < width; time -= timeUnit * SCALE_SPACE, x += SCALE_SPACE) {
			date = new Date(time);
			
			month = date.getMonth();
			day = date.getDate();
			hour = date.getHours();
			
			context.fillText(date.getFullYear() +"-"+ (month > 9? month: "0"+ month) +"-"+ (day > 9? day: "0"+ day) +" "+ (hour > 9? hour: "0" + hour), 10, x);
		}
		
		context.restore();
	}
	
	Chart.prototype = {
		
		/**
		 * @param id chart가 그려질 부모 element의 id
		 * @param height chart의 graph 높이
		 * @param label Y축 최대값의 label
		 * @param onreset chart가 다시 그려져야 하는 경우 callback
		 */	
		init: function (id, height, label, onreset) {
			this.client = document.getElementById(id);
			
			this.chart = document.createElement("canvas");
			this.context = this.chart.getContext("2d");
			this.graph = document.createElement("canvas");
			this.graphContext = this.graph.getContext("2d");
			this.label = label;
			this.height = Math.floor(height);
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
			
			window.addEventListener("resize", onResize.bind(this), false);
			
			resize.call(this);
			
			this.begin();
		},
		
		draw: function (data, color) {
			var context = this.graphContext,
				width = this.width,
				height = this.height,
				base = new Date(this.base),
				from, timeUnit;
			
			context.beginPath();
			context.strokeStyle = color;
			
			switch(this.scale) {
			case 1:
				timeUnit = MINUTE;
			
				break;
			
			case 2:
				timeUnit = MINUTE5;
				base.setMinutes(Math.floor(base.getMinutes() /5) *5);
				
				break;
				
			case 3:
				timeUnit = HOUR6;
				base.setHours(Math.floor(base.getHours() /6) *6);
				base.setMinutes(0);
				break;
			}
			
			base = base.getTime();
			from = base - (width -1) * timeUnit;
			for (var x=from, i=0; i<width; i++, x += timeUnit) {
				if (typeof data[x] == "number") {
					context.lineTo(i, Math.round(data[x] /100 *this.height));
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
			context.drawImage(this.graph, MARGIN_LEFT, MARGIN_TOP);
		},
		
		begin: function () {
			var context = this.context,
				width = this.width,
				height = this.height,
				base = this.base;
			
			this.graph.width = width;
			this.graph.height = height;
			this.graphContext.setTransform(1, 0, 0, -1, 0, this.height);
			
			Chart.clear(this.chart);
			
			drawBackground(context, width, height, this.label);
			
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
			//context.drawImage(this.graph, MARGIN_LEFT, MARGIN_TOP);
			
			//drawTimeScale(context, width, height, from, base);
			
			//context.drawImage(this.graph, MARGIN_LEFT, MARGIN_TOP);
		},
		
		zoom: function (zoomIn) {
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