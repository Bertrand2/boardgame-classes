"use strict";

/*===========================
PAWNS COMMANDS
===========================*/

const board = new Board(23, 16, 60, document.querySelector("#canvas"));

board.setOptions({
    "image": "./assets/gardens.jpeg",
    "gridDisplay": false,
    "gridColor": "#ff0025"
});

/*===========================
PAWNS COMMANDS
===========================*/

//add pegs
board.addPeg([7,7]);
board.addPeg([7,10], "#151515", "stroke");

//add tokens
board.addToken([15, 7],"./assets/syldo.png");
board.addToken([10, 6],"./assets/dea2.png");
board.addToken([20, 8],"./assets/roluruk.png");
board.addToken([0, 15],"./assets/iltan.png");
board.addToken([15, 13],"./assets/vordar.png");
board.addToken([10, 13],"./assets/bernard.png");

//add pawn, depreciated
board.addPawn([0,0],"peg",{"color":"#ffa500","fill":"fill"});
board.addPawn([1,0]);
board.addPawn([0,3],"peg",{"color":"#ff0000","fill":"stroke"});
board.addPawn([2,5]);