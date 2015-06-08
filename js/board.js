

function make_hex(q,r){
	return Hex(q,r,-q -r);
}

function Board(){
	this.flat = Layout(layout_flat, Point(37, 37), Point(500, 400));
	this.canvas = document.getElementById("scene");
	this.context = this.canvas.getContext("2d");
	this.button = document.getElementById("loadBoard");
	this.radius = 5;

	// initial coordinates
	var init_q = -this.radius;
	var init_r = -this.radius;
	// final coordinates
	var end_q = this.radius;
	var end_r = this.radius;

	this.tiles = {};
	//@TODO: generate a more interesting board
	for (var q = init_q; q <= end_q; q++){
		for (var r = init_r; r <= end_r; r++){
			if (this.hexInGrid(make_hex(q,r))) {// hexagonal board with rad = 5
				this.tiles[JSON.stringify(make_hex(q,r))] = -1;
				if (q == -this.radius && r == this.radius || q == this.radius && r == -this.radius){
					this.tiles[JSON.stringify(make_hex(q,r))] = 0;
				}
			}
		}
	}

	this.specialTiles = {};
	this.specialTiles[JSON.stringify(make_hex(-6,2))] = 0;
	this.specialTiles[JSON.stringify(make_hex(-6,4))] = 1;


	this.selectedPlayer = 0;

	this.playerColors = {
		"-1" : "rgba(50,50,50,1)",
		"0" : "rgba(0,100,0,1)",
		"1" : "rgba(0,0,100,1)"
	}

	this.canvas.addEventListener("mousemove", this.moveEvent.bind(this), false);
	this.canvas.addEventListener("mousedown", this.clickEvent.bind(this), false);
	this.button.addEventListener("mousedown", this.loadBoard.bind(this), false);
	this.drawSelectors();
}


Board.prototype.hexInGrid = function(h) {
	return hex_distance(h, Hex(0,0,0)) <= this.radius;
};

Board.prototype.drawHex = function (tile, fillColor, labels){
	this.context.strokeStyle = "#AAA";
	this.context.beginPath();
	corners = polygon_corners(this.flat, tile);
	center = hex_to_pixel(this.flat, tile);
	this.context.moveTo(corners[0].x, corners[0].y);
	for(var i = 1; i < corners.length; i++){
		this.context.lineTo(corners[i].x, corners[i].y);
	}

	if(fillColor){
		this.context.fillStyle = fillColor;
		this.context.fill();
	}

	this.context.closePath();
	this.context.stroke();

	if(labels){
		this.context.font = '20px "Lucida Console", Monaco, monospace';
		this.context.fillStyle = "#DDD";
		this.context.textAlign = "center";
		this.context.textBaseline = "middle";
		this.context.fillText(tile.q + "," +  tile.r, center.x, center.y );
	}

};


Board.prototype.getPlayerColor = function(player_id){
	return this.playerColors[player_id];
};

Board.prototype.drawGrid = function() {
	for (var key in this.tiles) {
		if (this.tiles.hasOwnProperty(key)) {
			this.drawHex(JSON.parse(key), this.getPlayerColor(this.tiles[key]), true);
		}
	}
};

Board.prototype.drawSelectors = function() {
	for (var key in this.specialTiles) {
		if (this.specialTiles.hasOwnProperty(key)) {
			this.drawHex(JSON.parse(key), this.getPlayerColor(this.specialTiles[key]), true);
		}
	}
};

Board.prototype.isSpecialHex = function(hex){
	return JSON.stringify(hex) in this.specialTiles;
}

Board.prototype.selectPLayer = function(hex){
	this.selectedPlayer =  this.specialTiles[JSON.stringify(hex)]
}

Board.prototype.getSelectedColor = function(){
	return this.playerColors[this.selectedPlayer];
}

Board.prototype.setHexOwner = function(hex, specificOwner){
	var key = JSON.stringify(hex);
	if(key in this.tiles){
		if(specificOwner){
			this.tiles[key] = specificOwner;
		}else{
			this.tiles[key] = this.selectedPlayer;
		}
	}
}

Board.prototype.getHexOwner = function(hex){
	var key = JSON.stringify(hex);
	if(key in this.tiles){
		return this.tiles[key];
	}
}

Board.prototype.getRing = function(center, radius)
{
	var q = center.q;
	var r = center.r;
	var s = center.s;

	var ring = [];

	// advance radius in every direction (clockwise)
	var north      = Hex(q - radius, r + radius, s         );
	var north_east = Hex(q         , r + radius, s - radius);
	var south_east = Hex(q + radius, r         , s - radius);
	var south      = Hex(q + radius, r - radius, s         );
	var south_west = Hex(q         , r - radius, s + radius);
	var north_west = Hex(q - radius, r         , s + radius);

	//add clockwise vertex and line to next vertex
	ring = ring.concat(hex_linedraw(north, north_east).slice(1));
	ring = ring.concat(hex_linedraw(north_east, south_east).slice(1));
	ring = ring.concat(hex_linedraw(south_east, south).slice(1));
	ring = ring.concat(hex_linedraw(south, south_west).slice(1));
	ring = ring.concat(hex_linedraw(south_west, north_west).slice(1));
	ring = ring.concat(hex_linedraw(north_west, north).slice(1));

	return ring;
}



// EVENTS

Board.prototype.getMousePosition = function(e) {
	var rect = this.canvas.getBoundingClientRect();
	return Point(
		Math.round((e.clientX - rect.left)/(rect.right - rect.left)*this.canvas.width), 
		Math.round((e.clientY - rect.top)/(rect.bottom - rect.top)*this.canvas.height)
	);
}

Board.prototype.moveEvent = function(e) {
	var hex = hex_round(pixel_to_hex(this.flat, this.getMousePosition(e)));
	this.drawGrid();
	if(this.hexInGrid(hex)){
		this.drawHex( hex, "rgba(70,85,70,1)", true);
	}
};

Board.prototype.clickEvent = function(e) {
	var hex = hex_round(pixel_to_hex(this.flat, this.getMousePosition(e)));
	if(this.isSpecialHex(hex)){
		this.selectPLayer(hex);
	}else{
		this.setHexOwner(hex);
		this.drawGrid();
		// if(this.hexInGrid(hex)){
		// 	this.drawHex( hex, "rgba(255,0,0,1)", true);
		// }
	}
};


Board.prototype.loadBoard = function(e) {
	var textInput = document.getElementById("jsonInput");
	var boardInfo = JSON.parse(textInput.value);
	for(i in boardInfo){
		key = JSON.stringify(make_hex(boardInfo[i].tile.x, boardInfo[i].tile.y));
		if(key in this.tiles){
			console.log(boardInfo[i].owner);
			this.tiles[key] = boardInfo[i].owner;
		}
	}
	this.drawGrid();
};