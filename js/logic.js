var EMPTY_TILE = -1;

function Move(tileFrom, tileTo, playerID)
{
	return {
		tileFrom: tileFrom,
		tileTo: tileTo,
		playerID: playerID
	};
}

function Logic(board)
{
	this.board = board;
	this.moves = [];
	this.button = document.getElementById("loadMove");
	this.button.addEventListener("mousedown", this.clickEvent.bind(this), false);
}

Logic.prototype.playMove = function(move)
{
	this.moves.push(move);
	var distance = hex_distance(move.tileFrom, move.tileTo);
	this.board.setHexOwner(move.tileTo, move.playerID);
	if(distance == 1){// duplication
	}else if(distance == 2){// translation
		this.board.setHexOwner(move.tileFrom, EMPTY_TILE);
	}
	this.propagate(move.tileTo);
};

Logic.prototype.propagate = function(center)
{
	console.log(center);
	var ring = b.getRing(center, 1);
	for(var i = 0; i < ring.length; i++){
		if(this.board.getHexOwner(ring[i]) != EMPTY_TILE){
			var playerID = this.board.getHexOwner(center);
			this.board.setHexOwner(ring[i], playerID);
		}
	}
}

Logic.prototype.clickEvent = function(e){
	var textInput = document.getElementById("moveDefinition");
	var move = JSON.parse(textInput.value);
	this.playMove(move);
	b.drawGrid();
}