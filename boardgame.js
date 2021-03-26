"use strict";

const fileToBase64 = async (filepath) => {
    const filename = filepath.slice(12);
    console.log(filename);
    return new Promise(resolve => {
        var file = new File([filename], filepath);
        var reader = new FileReader();    // Read file content on file loaded event
        reader.onload = function(event) {
            resolve(event.target.result);
            console.log(event.target.result);
        };
        
        // Convert data to base64 
        reader.readAsDataURL(file);
    });
}

class Pawn {
    constructor(id, boardPos, style="peg", info={"color":"#000000","fill":"fill"}) {
        this.id = id;
        this.boardPos = boardPos;
        this.style = style;
        this.info = info;
    }
    getId() {
        return this.id;
    }
    getPos() {
        return this.boardPos;
    }
    getStyle() {
        return this.style;
    }
    getInfo() {
        return this.info;
    }
    isAt(pos) {
        return this.boardPos[0] === pos[0] && this.boardPos[1] === pos[1];
    }
    getUrl() {
        return this.url;
    }
    moveTo(boardPos) {
        this.boardPos=boardPos;
    }
    setStyle(style) {
        this.style = style;
    }
    setInfo(info) {
        this.info = info;
    }
}

class Board {
    constructor(widthCell, heightCell, cellSize, reference) {
        this.reference = reference;
        this.widthCell = widthCell;
        this.heightCell = heightCell;
        this.cellSize = cellSize;
        this.width = cellSize*widthCell;
        this.height = cellSize*heightCell;
        reference.style.position = "relative";
        reference.style.width = this.width+"px";
        reference.style.height = this.height+"px";
        reference.classList.add("board-game");
        this.board = document.createElement("canvas");
        reference.appendChild(this.board);
        this.board.setAttribute("width", this.width);
        this.board.setAttribute("height", this.height);
        this.ctx = this.board.getContext("2d");
        this.pawns = [];
        this.nextId = 0;
        this.selectedPawn = null;
        this.selectedCell = null;

        this.contextMenuWidth = 150;
        this.boardContextMenu = document.createElement("ul");
        this.boardContextMenu.setAttribute("style", `
            box-sizing: border-box;
            position: absolute;
            top: 0;
            left: 0;
            display: none;
            list-style: none;
            width: ${this.contextMenuWidth}px;
            margin: 0;
            padding: 10px;
            border: 1px solid #a9a9a9;
            background-color: #f9f9f9;
        `);
        this.boardContextButtons = [
            this.createContextButton(this.contextAddPawn, "Add Pawn"),
            this.createContextButton(this.contextEditBoard, "Edit Board"),
            this.createContextButton(this.contextResetBoard, "Reset Board"),
        ];
        this.boardContextButtons.forEach(button=>{
            this.boardContextMenu.appendChild(button);
        });
        reference.appendChild(this.boardContextMenu);

        this.pawnContextMenu = document.createElement("ul");
        this.pawnContextMenu.setAttribute("style", `
            box-sizing: border-box;
            position: absolute;
            top: 0;
            left: 0;
            display: none;
            list-style: none;
            width: ${this.contextMenuWidth}px;
            margin: 0;
            padding: 10px;
            border: 1px solid #a9a9a9;
            background-color: #f9f9f9;
        `);
        this.pawnContextButtons = [
            this.createContextButton(this.contextEditPawn, "Edit Pawn"),
            this.createContextButton(this.contextRemovePawn, "Remove Pawn"),
            this.createContextButton(this.contextEditBoard, "Edit Board"),
            this.createContextButton(this.contextResetBoard, "Reset Board"),
        ];
        this.pawnContextButtons.forEach(button=>{
            this.pawnContextMenu.appendChild(button);
        });
        reference.appendChild(this.pawnContextMenu);

        this.board.addEventListener("click",()=>{
            this.closeContextMenu();
            const elemLeft = this.board.parentNode.offsetLeft + this.board.clientLeft;
            const elemTop = this.board.parentNode.offsetTop + this.board.clientTop;
            const x = event.pageX - elemLeft;
            const y = event.pageY - elemTop;

            const cell = this.getCell(x, y);
            if(this.selectedPawn) {
                this.selectedPawn.moveTo(cell);
                this.selectedPawn = null;
            } else {
                this.selectedPawn = this.getPawnFromCell(cell) || null;
            }
            this.draw();
        });
        this.board.addEventListener("contextmenu",()=>{
            event.preventDefault();
            const elemLeft = this.board.parentNode.offsetLeft + this.board.clientLeft;
            const elemTop = this.board.parentNode.offsetTop + this.board.clientTop;
            const x = event.pageX - elemLeft;
            const y = event.pageY - elemTop;
            const cell = this.getCell(x, y);
            this.selectedCell = cell;

            if(this.isPawnFromCell(cell)) {
                this.closeContextMenu();
                this.openPawnContextMenu(x, y);
            } else {
                this.closeContextMenu();
                this.openBoardContextMenu(x, y);
            }
        })

        reference.appendChild(this.createPawnModal());
        reference.appendChild(this.createBoardModal());

        this.draw();
    }

    //modals
    createPawnModal() {
        const modal = document.createElement("div");
        modal.classList.add("board-game__modal");
        modal.id = "pawnModal";
        modal.innerHTML = `
            <div class="board-game__modal__panel">
                <h2 class="board-game__modal__title" id="pawnModalTitle">Edit Pawn</h2>
                <div class="board-game__modal__style">
                    <label for="pawnStyle">Style :</label>
                    <select name="pawnStyle" id="pawnStyle">
                        <option value="peg">Peg</option>
                        <option value="token">Token</option>
                    </select>
                </div>
                <div id="pegForm" class="board-game__modal__form">
                    <input id="pegColor" name="pegColor" type="color">
                    <select name="pegFill" id="pegFill">
                        <option value="fill">Filled</option>
                        <option value="stroke">Hollow</option>
                    </select>
                </div>
                <div id="tokenForm" class="board-game__modal__form">
                    <input  id="tokenFile" name="tokenFile" type="file" accept="image/*">
                </div>
                <button id="pawnButton">Done</button>
            </div>
            <div class="board-game__modal__background"></div>
        `;
        modal.querySelector("#pawnStyle").addEventListener("change", ()=> {
            [...document.querySelectorAll(".board-game__modal__form")].forEach(form=>{
                if(form.id === `${modal.querySelector("#pawnStyle").value}Form`) {
                    form.style.display = "flex";
                } else {
                    form.style.display = "none";
                }
            })
        });
        modal.querySelector(".board-game__modal__background").addEventListener("click",this.hidePawnModal.bind(this));
        modal.querySelector("#pawnButton").addEventListener("click",(()=>{
            const pawn = this.getPawnFromCell(this.selectedCell);
            pawn.setStyle(modal.querySelector("#pawnStyle").value);
            pawn.setInfo({
                "color": modal.querySelector("#pegColor").value,
                "fill": modal.querySelector("#pegFill").value,
            });
            fileToBase64(modal.querySelector("#tokenFile").value).then((result)=>{
                console.log(result);
            })
            this.draw();
            this.hidePawnModal();
        }).bind(this));
        
        return modal;
    }
    createBoardModal() { //TODO
        const modal = document.createElement("div");
        modal.classList.add("board-game__modal");
        modal.innerHTML = `
            <div class="board-game__panel">
                <h2 class="board-game__title" id="pawnModalTitle">Edit Pawn</h2>
                <select name="pawnStyle" id="pawnStyle">
                    <option value="peg">Peg</option>
                    <option value="token">Token</option>
                </select>
                <div id="pegForm" class="board-game__form">
                    <input id="pegColor" name="pegColor" type="color">
                    <select name="pegFill" id="pegFill">
                        <option value="filled">Filled</option>
                        <option value="stroke">Hollow</option>
                    </select>
                </div>
                <div id="tokenForm" class="board-game__form">
                    <input  id="tokenFile" name="tokenFile" type="file" accept="image/*">
                </div>
            </div>
            <div class="board-game__modal"></div>
        `;
        return modal;
    }
    showPawnModal(pawn) {
        this.reference.querySelector("#pawnStyle").value = pawn.getStyle();
        this.reference.querySelector("#pegColor").value = pawn.getInfo().color;
        this.reference.querySelector("#pegFill").value = pawn.getInfo().fill;
        // this.reference.querySelector("#tokenFile").value = pawn.getInfo().image; TODO
        [...this.reference.querySelectorAll(".board-game__modal__form")].forEach(form=>{
            if(form.id === `${pawn.getStyle()}Form`) {
                form.style.display = "flex";
            } else {
                form.style.display = "none";
            }
        })
        this.reference.querySelector("#pawnModal").classList.add("active");
    }
    showBoardModal() {
        this.reference.querySelector("#boardModal").classList.add("active");
    }
    hidePawnModal() {
        this.reference.querySelector("#pawnModal").classList.remove("active");
    }
    hideBoardModal() {
        this.reference.querySelector("#boardModal").classList.remove("active");
    }

    //drawing functions
    drawBoard() {
        this.ctx.beginPath();
        this.ctx.lineWidth = 2;
        for(let i=0; i<=this.heightCell; i++) {
            this.ctx.moveTo(0, i*this.cellSize);
            this.ctx.lineTo(this.width, i*this.cellSize);
        }
        for(let i=0; i<=this.widthCell; i++) {
            this.ctx.moveTo(i*this.cellSize, 0);
            this.ctx.lineTo(i*this.cellSize, this.height);
        }
        this.ctx.stroke();
    }
    drawSelected() {
        if(this.selectedPawn) {
            this.ctx.beginPath();
            this.ctx.fillStyle = "#FFA500";
            this.ctx.arc(...this.selectedPawn.getPos().map(x=>(x+0.5)*this.cellSize), this.cellSize/2.1, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = "#000000";
        }
    }
    drawPawn(pawn) {
        this.ctx.beginPath();
        this.ctx.lineWidth = 3;
        switch(pawn.style) {
            case "peg":
            default:
                this.ctx.fillStyle = pawn.getInfo().color;
                this.ctx.strokeStyle = pawn.getInfo().color;
                this.ctx.arc(...pawn.getPos().map(x=>(x+0.5)*this.cellSize), this.cellSize/2.5, 0, Math.PI*2);
                switch(pawn.info.fill) {
                    case "stroke":
                        this.ctx.stroke();
                        break;
                    case "fill":
                    default:
                        this.ctx.fill();
                }
        }
        this.ctx.fillStyle = "#000000";
    }
    drawPawns() {
        this.pawns.forEach(pawn=>this.drawPawn(pawn));
    }
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.drawBoard();
        this.drawSelected();
        this.drawPawns();
    }

    //get functions
    getBoard() {
        return this.board;
    }
    getCell(posX, posY) {
        return [Math.floor(posX/this.cellSize), Math.floor(posY/this.cellSize)];
    }
    getPawnFromCell(cell) {
        return this.pawns.find(pawn=>pawn.isAt(cell));
    }
    isPawnFromCell(cell) {
        return this.pawns.some(pawn=>pawn.isAt(cell));
    }

    //edit board
    addPawn(boardPos, style="peg", info={"color":"black","fill":"fill"}) {
        this.pawns.push(
            new Pawn(this.nextId++, boardPos, style, info)
        );
        this.draw();
    }
    removePawn(pos) {
        const index = this.pawns.findIndex(pawn=>pawn.isAt(pos));
        index>-1 && this.pawns.splice(index,1);
        this.selectedPawn = null;
        this.draw();
    }

    //context menus
    openPawnContextMenu(x, y) {
        this.pawnContextMenu.style.left = Math.min(x, this.width-this.contextMenuWidth)+"px";
        this.pawnContextMenu.style.top = Math.min(y, this.height-160)+"px";
        this.pawnContextMenu.style.display = "block";
    }
    openBoardContextMenu(x, y) {
        this.boardContextMenu.style.left = Math.min(x, this.width-this.contextMenuWidth)+"px";
        this.boardContextMenu.style.top = Math.min(y, this.height-160)+"px";
        this.boardContextMenu.style.display = "block";
    }
    closeContextMenu() {
        this.pawnContextMenu.style.display = "none";
        this.boardContextMenu.style.display = "none";
    }
    createContextButton(handleClickFunction, text) {
        const button = document.createElement("li");
        button.innerText = text;
        button.setAttribute("style", `
        box-sizing: border-box;
        width: 100%;
        height: 35px;
        padding: 5px 0;
        margin: 0 0;
        cursor: pointer;
    `);
        button.addEventListener("click", handleClickFunction.bind(this));
        return button;
    }

    //context menu function
    contextAddPawn() {
        this.addPawn(this.selectedCell);
        this.closeContextMenu();
    }
    contextEditPawn() {
        this.showPawnModal(this.getPawnFromCell(this.selectedCell));
        this.closeContextMenu();
    }
    contextRemovePawn() {
        this.removePawn(this.selectedCell);
        this.closeContextMenu();
    }
    contextEditBoard() {
        this.showBoardModal();
        this.closeContextMenu();
    }
    contextResetBoard() {

    }

}

// module.exports.Pawn = Pawn;
// module.exports.Board = Board;