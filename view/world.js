
//Terrain types
// .  grass, freely walkable, allow shooting
// #  wall, not walkable, stops shoots
// ~  river, walkable, cannot shoot while on it, allow shooting through it
// @  ocean, not walkable, allow shooting through it
// !  trap, will subtract energy from player if walked on, allow shooting through it
// GRASS: [19,7],
// WALL: [1,0],
// RIVER: [4,0],
// OCEAN: [3,4],
// TRAP: [4,1],
// FLAG: [0,0],
// RECHARGE: [0,0],
// BARRIER: [0,0]
const Terrain = {
    GRASS: [1,2],
    WALL: [3,3],
    RIVER: [3,21],
    OCEAN: [5,21],
    TRAP: [0, 9],
    FLAG_BLUE: [0, 10],
    FLAG_RED: [1, 10],
    RECHARGE: [1,9],
    BARRIER: [21,3],
    PLAYER_BLUE: [0, 8],
    PLAYER_RED: [1, 8]
}

class WorldUi {

    imgTileSet = './assets/mod32x32_map_tile.png'    
    
    N = 32 // map size NxN

    images = {}

    constructor(ctx) {
        this._load();
        this.ctx = ctx;
        var p = this._loads();
        Promise.all(p).then(function (loaded) {
            this.tileAtlas = this._getImage('tiles');
        }.bind(this));

        // this.map = new Map(this, model.map_name);
    };

    _load() {
        // Listeners for UI
        this._loadWsMessages();
    };

    _getTile(col, row) {
        let map = model._map;
        let idx = row * map.cols + col;
        let x = map.tiles[idx];
        let tile;
        let team = -1;
        let xcode = x.charCodeAt(0);
        if (xcode == 88) { // X: team RED flag (A)
            tile = Terrain.FLAG_RED;
            team = 0;
            x = "0";
        }
        else if (xcode == 120) { // x: team BLUE flag (B)
            tile = Terrain.FLAG_BLUE;
            team = 1;
            x = "0";
        }        
        else if(xcode >= 65 && xcode <= 84) {  // uppercase letter team 0
            tile = Terrain.PLAYER_RED;
            team = 0;
        }
        else if (xcode >= 97 && xcode <= 116) {// lowecase letter team 1
            tile = Terrain.PLAYER_BLUE;
            team = 1;
        }
        else { // terrains
            switch(x) {
                case ".":
                    tile = Terrain.GRASS;
                    break;
                case "#":
                    tile = Terrain.WALL;
                    break;
                case "~":
                    tile = Terrain.RIVER;
                    break;
                case "@":
                    tile = Terrain.OCEAN;
                    break;
                case "!":
                    tile = Terrain.TRAP;
                    break;
                case "$":
                    tile = Terrain.RECHARGE;
                    break;
                case "&":
                    tile = Terrain.BARRIER;
                    break;
                default:
                    console.debug("ERROR map symbol: " + x)
                    break;
            }
            x = "0";
        }
        // return correct position in tilemap and the atlas
        return [tile, x, team]
    };


    renderMap() {
        // Lookup the size the browser is displaying the canvas.
        let displayWidth  = window.innerWidth*0.9;
        let displayHeight = window.innerHeight*0.9;

        let sz = 0;
        if(displayWidth<displayHeight) {sz=displayWidth;} else {sz=displayHeight;}
        displayHeight = displayWidth = sz;
        
        if (this.ctx.canvas.width  != displayWidth ||
            this.ctx.canvas.height != displayHeight) {
            // Make the canvas the same size
            this.ctx.canvas.width  = displayWidth;
            this.ctx.canvas.height = displayHeight;
        }
        console.debug("Rendering MAP");
        let map = model._map;
        let tsizeMap = this.ctx.canvas.height / this.N
        for (let c = 0; c < map.cols; c++) {
            for (let r = 0; r < map.rows; r++) {
                let [tile, x, team] = this._getTile(c, r);
                if (tile !== (0,0)) { // 0 => empty tile
                    // draw backroung character:
                    this.ctx.drawImage(
                        this.tileAtlas, // image
                        tile[0] * map.tsize, // source x
                        tile[1] * map.tsize, // source y
                        map.tsize, // source width
                        map.tsize, // source height
                        c * tsizeMap,  // target x
                        r * tsizeMap, // target y
                        tsizeMap, // target width
                        tsizeMap // target height
                    );
                    if (x !== "0") {
                        let me = model.status.me.symbol; // undefined in case of specator
                        if (team == 0) {
                            if (typeof me !== 'undefined' && model.status.me.symbol.localeCompare(x) == 0) {
                                this.ctx.font = '15px Arial'
                                this.ctx.fillStyle = "#FFFFFF";
                            } else {
                                this.ctx.font = '10px Arial'
                                this.ctx.fillStyle = "#ff0000";
                            }
                        } else {
                            if (typeof me !== 'undefined' && model.status.me.symbol.localeCompare(x) == 0) {
                                this.ctx.font = '15px Arial'
                                this.ctx.fillStyle = "#FFFFFF";
                            } else {
                                this.ctx.font = '10px Arial'
                                this.ctx.fillStyle = "#0000FF";
                            }
                        }
                        this.ctx.textAlign = "center";
                        this.ctx.textBaseline = "bottom";
                        this.ctx.fillText(x, c * tsizeMap + 8, r * tsizeMap);
                    } 
                }
            }
        }
    };


    _loadWsMessages() {
        document.addEventListener("MODEL_SETMAP", () => {
            this.renderMap()
        }, false);

        // document.addEventListener("MODEL_SETGAMEACTIVE", () => {
        //     console.debug("MODEL_SETGAMEACTIVE")
        //     this.renderMap()
        // }, false);

    }

    
    _loadImage = function (key, src) {
        let img = new Image();
    
        let d = new Promise(function (resolve, reject) {
            img.onload = function () {
                this.images[key] = img;
                resolve(img);
            }.bind(this);
    
            img.onerror = function () {
                reject('Could not load image: ' + src);
            };
        }.bind(this));
    
        img.src = src;
        return d;
    };
    
    _getImage = function (key) {
        return (key in this.images) ? this.images[key] : null;
    };

    _loads = function () {
        return [
            this._loadImage('tiles', this.imgTileSet)
        ];
    }.bind(this);
};









// const terrainSet = [GRASS, WALL, RIVER, OCEAN, TRAP];
// const mapSymbols = ["A", "a", "b", "c", "x", "X", ".", "@", "#", "~", "!"];
// var map = {
//     cols: N,
//     rows: N,
//     tsize: 32,
//     tiles: Array.from({length:N*N}, () => mapSymbols[Math.floor(Math.random() * mapSymbols.length)]),
// };



// Game.start = function (gameName, context) {
//     this.gameName = gameName
//     this.ctx = context;
//     this._startTime = new Date();
//     console.debug("RENDER STARTED");
//     var p = this.load();
//     Promise.all(p).then(function (loaded) {
//         this.init();
//         Game.loop()
//     }.bind(this));
// };


// Game.load = function () {
//     return [
//         Loader.loadImage('tiles', imgTileSet)
//     ];
// }.bind(this);

// Game.init = function () {
//     this.tileAtlas = Loader.getImage('tiles');
//     this.map = new Map(this, model.map_name);
// };


// Game.updatedMapHandler = function(evt) {
//     // On map update -> rerender the map
//     this.render
//     // parse map
//     // update model
// }.bind(this);


// //
// // start up function
// //

// // window.onload = function () {
// //     var context = document.getElementById('canvas').getContext('2d');
// //     Game.start(context);
// // };