"use strict";

class Pawn {
    constructor(id, boardPos, style="peg", info={}, legalMoves=[]) {
        this.id = id;
        this.boardPos = boardPos;
        this.style = style;
        this.info = {
            "color":info.color||"#000000",
            "fill":info.fill||"fill",
            "image":info.image||"oui"
        };
        this.legalMoves = legalMoves;
    }

    //get functions
    getId() {
        return this.id;
    }
    isAt(pos) {
        return this.boardPos[0] === pos[0] && this.boardPos[1] === pos[1];
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
    getColor() {
        return this.info.color;
    }
    getFill() {
        return this.info.fill;
    }
    getImage() {
        return this.info.image;
    }
    canMoveTo(pos) {
        return this.legalMoves.some(move => (
            pos[0] - this.boardPos[0] === move[0]
            && pos[1] - this.boardPos[1] === move[1]
        ))
    }
    getLegalMoves() {
        return this.legalMoves;
    }

    //set functions
    moveTo(boardPos) {
        this.boardPos=boardPos;
    }
    setStyle(style) {
        this.style = style;
    }
    setInfo(info) {
        this.info = info;
    }
    setColor(color) {
        this.info.color = color;
    }
    setFill(fill) {
        this.info.fill = fill;
    }
    setImage(image) {
        this.info.image = image;
    }
    setLegalMoves(legalMoves) {

    }
}

class Board {
    constructor(widthCell, heightCell, cellSize, reference, boardImage="") {
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
        this.board.classList.add("board-game__canvas");
        this.ctx = this.board.getContext("2d");
        this.pawns = [];
        this.nextId = 0;
        this.selectedPawn = null;
        this.selectedCell = null;
        this.localeImage = "";
        this.grid = {
            "display": true,
            "color": "#000000"
        }
        if(boardImage) {
            const request = new XMLHttpRequest();
            request.open('GET', options.image, true);
            request.responseType = 'blob';
            request.onload = (() => {
                var reader = new FileReader();
                reader.onload =  ((e)=>{
                    this.boardImage = e.target.result;
                }).bind(this);
                reader.readAsDataURL(request.response);
            }).bind(this);
            request.send();
        }

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
        reference.appendChild(this.createBoardBackground())

        this.draw();
    }

    createBoardBackground() {
        const background = document.createElement("img");
        background.id = "boardGameBackground";
        background.classList.add("board-game__background");
        return background;
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
            [modal.querySelectorAll(".board-game__modal__form")].forEach(form=>{
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
            pawn.setColor(modal.querySelector("#pegColor").value);
            pawn.setFill(modal.querySelector("#pegFill").value);
            this.draw();
            this.hidePawnModal();
        }).bind(this));
        modal.querySelector("#tokenFile").addEventListener("change", (()=>{
            const pawn = this.getPawnFromCell(this.selectedCell);
            this.setPawnImage(modal.querySelector("#tokenFile"), pawn);
        }).bind(this));
        return modal;
    }
    createBoardModal() { //TODO
        const modal = document.createElement("div");
        modal.classList.add("board-game__modal");
        modal.id = "boardModal";
        modal.innerHTML = `
            <div class="board-game__modal__panel">
                <h2 class="board-game__modal__title" id="boardModalTitle">Edit Board</h2>
                <input  id="boardFile" name="boardFile" type="file" accept="image/*">
                <button id="boardButton">Done</button>
            </div>
            <div class="board-game__modal__background"></div>
        `;
        modal.querySelector(".board-game__modal__background").addEventListener("click",this.hideBoardModal.bind(this));
        modal.querySelector("#boardButton").addEventListener("click",(()=>{
            this.draw();
            this.hideBoardModal();
        }).bind(this));
        modal.querySelector("#boardFile").addEventListener("change", (()=>{
            this.setBoardImage(modal.querySelector("#boardFile"));
        }).bind(this));
        return modal;
    }
    showPawnModal(pawn) {
        this.reference.querySelector("#pawnStyle").value = pawn.getStyle();
        this.reference.querySelector("#pegColor").value = pawn.getColor();
        this.reference.querySelector("#pegFill").value = pawn.getFill();
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

    setPawnImage(inputSource, pawn) {
        if (inputSource.files && inputSource.files[0]) {
            const fileReader= new FileReader();
            fileReader.addEventListener("load", function(e) {
                pawn.setImage(e.target.result);
            });
            fileReader.readAsDataURL( inputSource.files[0] );
        }
    }
    setBoardImage(inputSource) {
        if (inputSource.files && inputSource.files[0]) {
            const fileReader= new FileReader();
            fileReader.addEventListener("load", ((e) => {
                this.boardImage = e.target.result;
                document.querySelector("#boardGameBackground").src = this.boardImage;
            }).bind(this));
            fileReader.readAsDataURL( inputSource.files[0] );
        }
    }

    //drawing functions
    drawBoard() {
        //background
        if(this.boardImage){
            this.reference.querySelector("#boardGameBackground").src = this.boardImage;
        }
        //grid
        if(this.grid.display) {
            this.ctx.beginPath();
            this.ctx.lineWidth = 2;
            this.ctx.strokeStyle = this.grid.color;
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
            case "token":
                const image = new Image();
                image.onload = (() => {
                    this.ctx.globalCompositeOperation = "source-over";
                    this.ctx.drawImage(image, ...pawn.getPos().map(x=>(x+0.05)*this.cellSize), this.cellSize*0.9, this.cellSize*0.9);
                }).bind(this);
                image.src = pawn.getImage();
                break;
            case "peg":
            default:
                this.ctx.fillStyle = pawn.getColor();
                this.ctx.strokeStyle = pawn.getColor();
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
        this.reference.querySelector("#pawnModalTitle").innerText = "New Pawn";
        this.addPawn(this.selectedCell);
        this.showPawnModal(this.getPawnFromCell(this.selectedCell));
        this.closeContextMenu();
    }
    contextEditPawn() {
        this.reference.querySelector("#pawnModalTitle").innerText = "Edit Pawn";
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
        this.pawns = [];
        this.boardImage = "";
        this.draw();
        this.closeContextMenu();
    }

    //external commands
    setOptions(options={}) {
        if(options.image) {
            const request = new XMLHttpRequest();
            request.open('GET', options.image, true);
            request.responseType = 'blob';
            request.onload = (() => {
                var reader = new FileReader();
                reader.onload =  ((e)=>{
                    this.boardImage = e.target.result;
                }).bind(this);
                reader.readAsDataURL(request.response);
            }).bind(this);
            request.send();
        }
        if(options.gridDisplay !== undefined) {
            this.grid.display = options.gridDisplay;
        }
        if(options.gridColor) {
            this.grid.color = options.gridColor;
        }
        this.draw();
    }
    addPeg(boardPos, color="#000000", fill="fill") {
        this.addPawn(boardPos, "peg", {"color":color,"fill":fill});
    }
    addToken(boardPos, url) {
        const request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'blob';
        request.onload = (() => {
            var fileReader = new FileReader();
            fileReader.onload =  ((e)=>{
                this.addPawn(boardPos, "token", {"image": e.target.result});
            }).bind(this);
            fileReader.readAsDataURL(request.response);
        }).bind(this);
        request.send();
    }
}

// module.exports.Pawn = Pawn;
// module.exports.Board = Board;