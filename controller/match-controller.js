class MatchController {
    _gameClient;
    _lastDirection = {direction: GameClient.UP}; // Not in model because it's intended to be part of the interaction. The server actually allows to shoot in a different direction.

    constructor(gameClient) {
        this._gameClient = gameClient;
        this.load();
    }

    getLastDirection() {
        return this._lastDirection;
    }

    humanHandler(event, gameClient, lastDirection) {
        switch(event.key) {
            case " ":
                // SHOOT
                console.debug("MatchController is asking the game client to SHOOT in the last direction moved (" + lastDirection.direction + ").");
                gameClient.shoot(lastDirection.direction);
                break;
            default:
                // MOVE. Moving also sets the lastDirection in which the player shoots.
                let newDirection = undefined;
                switch(event.key) {
                case "w":
                    console.debug("MatchController acknowledged the wish of the player to MOVE UP and is going to behave accordingly.");
                    newDirection = GameClient.UP;
                    break;
                case "a":
                    console.debug("MatchController acknowledged the wish of the player to MOVE LEFT and is going to behave accordingly.");
                    newDirection = GameClient.LEFT;
                    break;
                case "s":
                    console.debug("MatchController acknowledged the wish of the player to MOVE DOWN and is going to behave accordingly.");
                    newDirection = GameClient.DOWN;
                    break;
                case "d":
                    console.debug("MatchController acknowledged the wish of the player to MOVE RIGHT and is going to behave accordingly.");
                    newDirection = GameClient.RIGHT;
                    break;
                }
                if(newDirection) {
                    console.debug("MatchController is asking the game client to moove " + newDirection);
                    gameClient.move(newDirection);
                    lastDirection.direction = newDirection;
                }
        }
    }

    lookMapHandler(evt) {
        //LOOK MAP save to model
        console.debug("LOOKMAPHANDLER " + evt.detail);
        let msgOk = evt.detail.startsWith("OK");
        if(!msgOk){
            return;
        }
        // parse map
        let map = evt.detail;
        let parsed_map = map.slice(7).replace('«ENDOFMAP»', '').replace(/\n/g, '').split('');
        let N = Math.sqrt(parsed_map.length);
        let map_obj = {
            cols: N,
            rows: N,
            tsize: 32,
            tiles: parsed_map
        }
        // update model
        model.setMap(map_obj);
        // send notification to render component

    };
onwheelHandler = function (event){
        event.preventDefault();
        // Get mouse offset.
        var mousex = event.clientX - canvas.offsetLeft;
        var mousey = event.clientY - canvas.offsetTop;
        // Normalize wheel to +1 or -1.
        var wheel = event.deltaY < 0 ? 1 : -1;
    
        // Compute zoom factor.
        var zoom = Math.exp(wheel*zoomIntensity);
        
        // Translate so the visible origin is at the context's origin.
        context.translate(originx, originy);
      
        // Compute the new visible origin. Originally the mouse is at a
        // distance mouse/scale from the corner, we want the point under
        // the mouse to remain in the same place after the zoom, but this
        // is at mouse/new_scale away from the corner. Therefore we need to
        // shift the origin (coordinates of the corner) to account for this.
        originx -= mousex/(scale*zoom) - mousex/scale;
        originy -= mousey/(scale*zoom) - mousey/scale;
        
        // Scale it (centered around the origin due to the trasnslate above).
        context.scale(zoom, zoom);
        // Offset the visible origin to it's proper position.
        context.translate(-originx, -originy);
    
        // Update scale and others.
        scale *= zoom;
        visibleWidth = width / scale;
        visibleHeight = height / scale;
    }
    mapPoller() {
        console.debug("Polling map")
        let gameName = model.status.ga;
        
        this._gameClient.lookMap(gameName);
        // setMap()
    };


    getStatusHandler(evt){
        console.debug("getStatusHandler: " + evt.detail);
        let msgOk = evt.detail.startsWith("OK");
        if(!msgOk){
            // alert("HUD[!]" + evt.detail);
            return;
        }

        let stat = evt.detail.slice(7).replace("«ENDOFSTATUS»",'').trim().split('\n');
        let ga = {};
        let ga_list = stat[0].slice(4).split(' ')
        for(let j=0;j<ga_list.length;j++){
            ga[ga_list[j].split('=')[0]] = ga_list[j].split('=')[1];
        }

        
        let me = {}
        let pl_start=2;
        if(stat[1].startsWith("ME:")){
            let me_list = stat[1].slice(4).split(' ');
            for(let j=0;j<me_list.length;j++){
                me[me_list[j].split('=')[0]] = me_list[j].split('=')[1];
            }
        }
        else{
            pl_start=1;
        }
        
        
        let pls = [];
        for(let i=pl_start;i<stat.length;i++){
            let pl = {};
            let pl_list = stat[i].slice(4).split(' ')
            for(let j=0;j<pl_list.length;j++){
                pl[pl_list[j].split('=')[0]] = pl_list[j].split('=')[1];
            }
            pls.push(pl);
        }

        let status = {};
        status.ga = ga.name;
        status.state = ga.state;
        status.size = ga.size;

        status.me = me;
        status.pl_list = pls;

        model.setStatus(status);

    };

    statusPoller(){
        console.debug("status poller run");
        let gameName = model.status.ga;
        console.debug("matchController: try to get status for " + gameName);
        this._gameClient.getStatus(gameName)
    };

    poller(){
        let timeframe = model.timeframe;
        this.mapPoller();
        this.statusPoller();
        window.setTimeout(function(){ this.poller() }.bind(this), timeframe);
    }

    load() {
        document.addEventListener("miticoOggettoCheNonEsiste.LOOK_MAP", this.lookMapHandler, false);
        
        // DEBUG: Status button
        // document.getElementById("statusButton").addEventListener("click", () => {
        //     this.statusPoller();
        // });

        document.addEventListener("STATUS", this.getStatusHandler, false);

        // document.addEventListener("MODEL_SETGAMENAME", this.init, false);
        document.addEventListener("MODEL_SETGAMEACTIVE", () => {
            // Init human commands
            document.addEventListener("keyup", (evt) => {this.humanHandler(evt, this._gameClient, this._lastDirection)}, false);
            // Init map polling
            this.poller()
        }, false);
    };
    
};