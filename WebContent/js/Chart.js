;"use strict";

var SECOND = 1000,
	MINUTE = 60000,
	MINUTE5 = 300000,
	HOUR6 = 21600000,
	MARGIN_TOP = 20,
	MARGIN_RIGHT = 15,
	MARGIN_BOTTOM = 90,
	MARGIN_LEFT = 15,
	SCALE_SPACE = 60;

function Chart(config) {
	if (typeof config !== "object" || !config.id) {
		throw "InvalidArgumentException";
	}
	
	this.init(config);
}

(function (window, undefined) {	
	
	function resize() {
		var rect = this.client.getBoundingClientRect(),
			width = this.width,
			height = this.height,
			timeUnit = getTimeUnit(this.scale);
		
		this.width = Math.max(0, rect.width - MARGIN_LEFT - MARGIN_RIGHT);
		this.height = Math.max(0, rect.height - MARGIN_TOP - MARGIN_BOTTOM);
		
		if (this.width == width && this.height == height || this.width == 0) {
			return;
		}
		
		if (!this.base) {
			this.base = Chart.trim(new Date().getTime(), this.scale);
		}
		
		this.origin = this.base - Math.floor((this.width -1) / this.space)* timeUnit;
		
		this.chart.width = this.width + MARGIN_LEFT + MARGIN_RIGHT;
		this.chart.height = this.height + MARGIN_TOP + MARGIN_BOTTOM;
	
		this.graph.width = this.width;
		this.graph.height = this.height;
		
		this.onchange(this.origin, this.base);
		
		invalidate.call(this);
	}
	
	/**
	 * invalidate 발생하는 경우
	 * 1. resize
	 * 2. dragend
	 * 3. zoom
	 * 4. user의 clear 요청
	 */
	function invalidate() {
		/**
		 * chart clear
		 */
		Chart.clear(this.chart);
		Chart.clear(this.graph);
		
		/**
		 * background 다시 그리기
		 */
		//context.save();
		
		this.context.strokeStyle = this.color;
		this.context.lineWidth = .5;
		this.context.strokeRect(MARGIN_LEFT -.5, MARGIN_TOP -5.5, this.width +1, this.height +11);
		
		this.context.save();
		this.context.globalAlpha = .7;
		
		var x1 = MARGIN_LEFT -10,
			x2 = MARGIN_LEFT + this.width +10,
			y = MARGIN_TOP +.5;
		
		for (var i=0; i<3; i++, y += this.height /2) {
			this.context.beginPath();
			this.context.moveTo(x1, y);
			this.context.lineTo(x2, y);
			this.context.stroke();
		}
		
		this.context.restore();
		
		this.background = this.context.getImageData(0, 0, this.chart.width, this.chart.height);
		
		drawTimeScale.call(this);
	
		this.graphContext.setTransform(1, 0, 0, -1, 0, this.height);
		
		this.onreset(this.origin, this.base, this.width, this.scale);
	}
	
	function adjust(scale) {
		this.base = Chart.trim(scale === 0? new Date().getTime(): this.base, scale);
		this.origin = this.base - Math.floor((this.width -1) / this.space) * getTimeUnit(scale);
	}
	
	function getTimeUnit(scale) {
		return scale === 1? MINUTE: scale === 2? MINUTE5: scale === 3? HOUR6: SECOND;
	}
	
	function onResize() {
		clearTimeout(this.resize);
		
		this.resize = setTimeout(resize.bind(this), 300);
	}
	
	function onDrag(x, scroll, e) {
		var move;
		
		scroll += (e.clientX - x);
		
		Chart.clear(this.chart);
		
		this.context.putImageData(this.background, 0, 0);

		this.context.drawImage(this.graph,
				Math.max(-scroll, 0),
				0,
				this.width - Math.abs(scroll),
				this.height,
				MARGIN_LEFT + Math.max(0, scroll),
				MARGIN_TOP,
				this.width - Math.abs(scroll),
				this.height);
	
		move = Math.round(scroll / this.space) * getTimeUnit(this.scale);
		
		this.onchange(this.origin - move, this.base - move);
		
		this.scroll = scroll;
	}
	
	function onMouseDown(e) {
		if (this.scale !== 0) {
			this.chart.onmousemove= onDrag.bind(this, e.clientX, this.scroll);
		}
	}
	
	function onMouseUp(e) {
		var onDrag = !!this.chart.onmousemove,
			scroll = this.scroll,
			move;
		
		this.chart.onmousemove = undefined;
		this.scroll = 0;
		
		if (!onDrag || scroll === 0) {
			return;
		}
		
		move = Math.round(scroll / this.space) * getTimeUnit(this.scale);
		
		this.base -= move;
		this.origin -= move;
			
		invalidate.call(this);
		
		drawTimeScale.call(this);
	}
	
	function onWheel(e) {
		if (this.scale === 0) {
			return;
		}
		
		e.stopPropagation();
		
		this.zoom(e.wheelDelta > 0);
	}
	
	/**
	 * draw, invalidate, mouseup
	 */
	function drawTimeScale() {
		var timeUnit = getTimeUnit(this.scale);
		
		this.context.save();
		
		this.context.fillStyle = this.color;
		this.context.font = "10px tahoma, arial, '맑은 고딕'";
		
		this.context.translate(this.width + MARGIN_LEFT, this.height + MARGIN_TOP);
		this.context.rotate(Math.PI /2);
		
		/**
		 * @param x graph의 x축, 1눈금이 scale에 따라 1분, 5분, 6시간을 의미한다.
		 */
		var date, year, month, day, hour, minute, second,
			time = this.base,
			space = this.space,
			x = 0;
		
		/**
		 * 분(minute) 값이 0일때까지 x를 움직인다.
		 * scale3에서는 항상 x === 0 이다. (그렇지 않다면 오류)
		 * scale0 제외
		 */
		if (this.scale === 1 || this.scale === 2) {
			do {
				date = new Date(time);
				
				minute = date.getMinutes();
				if (minute === 0) {
					break;
				}
				
				time -= timeUnit;
			}
			while (x += space < this.width);
		}
		
		for (; x < this.width; time -= timeUnit * SCALE_SPACE * space, x += SCALE_SPACE * space) {
			date = new Date(time);
			
			month = date.getMonth() +1;
			day = date.getDate();
			hour = date.getHours();
			minute = date.getMinutes();
			second = date.getSeconds();
			
			this.context.fillText(
				this.scale === 0?
				(month > 9? month: "0"+ month) +"-"+ (day > 9? day: "0"+ day) +" "+ (hour > 9? hour: "0" + hour) +":"+(minute > 9? minute: "0" + minute) +":"+(second > 9? second: "0" + second):
				date.getFullYear() +"-"+ (month > 9? month: "0"+ month) +"-"+ (day > 9? day: "0"+ day) +" "+ (hour > 9? hour: "0" + hour) +":00",
				10, x);
		}
		
		this.context.restore();
	}
	
	function drawMax(context, x, y, max) {
		context.save();
		
		context.globalAlpha = .2;
		context.beginPath();
		context.moveTo(x, 0);
		context.lineTo(x, y);
		context.stroke();
		
		context.restore();
		
		context.beginPath();
		context.arc(x, max, 5, 0, Math.PI *2);
		context.stroke();
	}
	
	Chart.prototype = {
		
		/**
		 * @param id chart가 그려질 부모 element의 id
		 * @param onreset optional chart가 다시 그려져야 하는 경우 callback
		 * @param onchange optional drag에 의해 base가 변경되는 경우 callback
		 * @param zoom optional auto인 경우 wheel event에 반응하여 자동 zoom
		 * @param space x축 눈금 간격 px
		 */	
		//init: function (id, height, label, onreset) {
		init: function (config) {
			/**
			 * configuration
			 */
			var client = document.getElementById(config.id);
			
			this.client = client;
			this.color = config.color || "#000";
			this.onreset = config.onreset || new Function();
			this.onchange = config.onchange || new Function();
			this.onempty = config.onempty || function () {
				return false;
			}
			this.space = config.space || 1;
			
			if (config.zoom === "auto") {
				client.addEventListener("mousewheel", onWheel.bind(this), false);
			}
			
			/**
			 * initialize
			 */
			this.chart = document.createElement("canvas");
			this.context = this.chart.getContext("2d");
			this.graph = document.createElement("canvas");
			this.graphContext = this.graph.getContext("2d");
			
			this.scale = 1;
			this.scroll = 0;
			
			// TODO what is this code?
			while (client.firstChild) {
				client.removeChild(this.client.firstChild);
			}
			
			client.appendChild(this.chart);
			
			window.addEventListener("resize", onResize.bind(this), false);
			this.chart.addEventListener("mousedown", onMouseDown.bind(this), false);
			this.chart.addEventListener("mouseup", onMouseUp.bind(this), false);
			this.chart.addEventListener("mouseout", onMouseUp.bind(this), false);
			
			resize.call(this);
		},
		
		draw: function (data, color, fill) {
			if (typeof data !== "object") {
				throw "InvalidArgumentException: "+ typeof data;
			}
			
			var result = {},
				value, 
				maxX = -1, maxValue = -1,
				context = this.graphContext,
				width = this.width,
				height = this.height,
				timeUnit = getTimeUnit(this.scale);
			
			context.beginPath();
			context.strokeStyle = color || "#000";
			
			for (var time=this.origin, x=0, space=this.space; x<width; x+=space, time += timeUnit) {
				value = data[time];
				
				if (typeof value === "number") {
					result[time] = value;
					
					context.lineTo(x -.5, value = Math.round(value /100 * height) -.5);
					
					if (maxValue <= value) {
						maxValue = value;
						maxX = x;
					}
				}
				else if (!fill) {
					context.stroke();
				
					context.beginPath();
				}
			}
			
			context.stroke();
			
			if (maxX > -1) {
				drawMax(context, maxX -.5, height, maxValue);
				
				context.stroke();
			}
			
			context = this.context;
			
			Chart.clear(this.chart);
			context.putImageData(this.background, 0, 0);
			drawTimeScale.call(this);
			context.drawImage(this.graph, MARGIN_LEFT, MARGIN_TOP);
			
			return result;
		},
		
		clear: function () {
			if (this.scale === 0) {
				adjust.call(this, 0);
			}
			
			invalidate.call(this);
		},
		
		zoom: function (zoom) {
			var scale;
			
			if (zoom === true) {
				// 확대
				
				scale = Math.max(1, this.scale -1);
			}
			else if (zoom === false){
				// 축소
				
				scale = Math.min(3, this.scale +1);
			}
			
			if (scale == this.scale) {
				return;
			}
			
			this.setScale(scale);
				
			invalidate.call(this);
		},
		
		setBase: function (base) {
			var count = Math.floor(this.width -1 / this.space);
			
			this.base = base;
			this.origin = this.base - count * getTimeUnit(this.scale);
		},
		
		setScale: function (scale) {
			adjust.call(this, scale);
			
			this.scale = scale;
		},
		
		
	};

	Chart.clear = function (canvas) {
		var context = canvas.getContext("2d");
		
		context.save();
		
		context.setTransform(1, 0, 0, 1, 0, 0);
		context.clearRect(0, 0, canvas.width, canvas.height);
		
		context.restore();
	};
	
	Chart.trim = function (time, scale) {
		var date = new Date(time);
		
		date.setMilliseconds(0);
		
		if (scale == 1) {
			date.setSeconds(0);
		}
		if (scale == 2) {
			var minutes = date.getMinutes();
			
			date.setMinutes(minutes - minutes %5);
		}
		else if (scale == 3) {
			var hours = date.getHours();
			
			date.setMinutes(0);
			date.setHours(hours - hours %6);
		}
		
		return date.getTime();
	}
	
	Chart.getMarginWidth = function () {
		return MARGIN_RIGHT + MARGIN_LEFT;
	};
	
	Chart.getMarginHeight = function () {
		return MARGIN_TOP + MARGIN_BOTTOM;
	};
	
}) (window);