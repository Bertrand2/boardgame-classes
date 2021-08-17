"use strict";

/*===========================
PAWNS COMMANDS
===========================*/

//setting a board in the container "#canvas" 23 cells wide, 16 cells in height, with each cell being a 60px square
const board = new Board(23, 16, 60, document.querySelector("#canvas"));

//set board options : what is the background image, how's the grid displayed, how do the pawns interact
board.setOptions({
    "image": "./assets/gardens.jpeg",
    "gridDisplay": false,
    "gridColor": "#000000", //"#ff0025",
    "overlap": "kill",
    "pathBlock": "block"
});

/*===========================
PAWNS COMMANDS
===========================*/

//add pegs
board.addPeg([7,7]);
board.addPeg([7,10], "#151515", "stroke");

//add tokens
board.addToken([15, 7], "./assets/syldo.png","knight");
board.addToken([15, 8], "./assets/syldo.png","jardin");
board.addToken([10, 6], "./assets/dea2.png","rook");
board.addToken([20, 8], "./assets/roluruk.png","king");
board.addToken([0, 15], "./assets/iltan.png","prince");
board.addToken([15, 13], "./assets/vordar.png","bishop");
board.addToken([10, 13], "./assets/bernard.png","queen");

//add pawn, depreciated
board.addPawn([0,0], "peg", {"color":"#00ffa5","fill":"fill"}, [
    [0,1],
    [0,-1],
    [1,0],
    [-1,0]
]);
board.addPawn([1,0]);
board.addPawn([0,3],"peg",{"color":"#ff0000","fill":"stroke"});
board.addPawn([2,5]);