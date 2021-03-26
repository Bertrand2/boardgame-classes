"use strict";

// import {Board} from "./boardgame.js";

const board = new Board(8, 8, 60, document.querySelector("#canvas"));

// document.querySelector("#canvas").appendChild(board.getBoard());

board.addPawn([0,0],"peg",{"color":"#ffa500","fill":"fill"});
board.addPawn([1,0]);
board.addPawn([0,3],"peg",{"color":"#ff0000","fill":"stroke"});
board.addPawn([2,5]);
board.addPawn([7,7]);