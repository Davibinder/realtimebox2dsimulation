var http = require('http'),
	 io = require('socket.io'),
	 fs = require('fs'),
	 Box2D = require('./box2d.js');

eval(fs.readFileSync('common.js') + '');
var clients = [];
var socket;
var myWorldDict = {};
var rooms = {};

/*

// Get total users in a specific room
var getUsersInRoomNumber(roomName, namespace) {
    if (!namespace) namespace = '/';
    var room = io.nsps[namespace].adapter.rooms[roomName];
    if (!room) return null;
    return Object.keys(room).length;
}

function getRespectiveWorld(roomId) {
    return myWorldDict[roomId];
}

*/


function isRoomAlreadyExisting(room) {
    for (var key in rooms) {
        // check if the property/key is defined in the object itself, not in parent
        if (rooms.hasOwnProperty(key)) {
            console.log(key, rooms[key]);
            if (room === rooms[key]) {
                console.log('room found');
                return true;
            }
        }else {
            console.log('room not found');
            return false;
        }

    }
}

var index = http.createServer(
	function(req, res){
		res.writeHead(200, {'Content-Type': 'text/html'}); 
		res.end('<h1>Box2D Network Testing</h1>');
	}
);


index.listen(process.env.PORT || xport,  () => {
    socket = io.listen(index);
    socketSetup(socket);
    console.log('Starting socket index on port port %d', xport);
});


function socketSetup(socket) {

    socket.configure('development', function () {
        socket.set('log level', 0);
    });

    socket.on('connection', function (client) {
        clients.push(client);
        console.log("Total clients: " + clients.length);
        client.send(JSON.stringify({"startId": clients.length}));

        client.on('room', function(room) {
            client.join(room);
            console.log(room);
            if (!isRoomAlreadyExisting(room)){
                console.log('New room created');
                var lptWorld = new LPTWorldNew();
                lptWorld.initPhysics(0.0);
                myWorldDict[room] = lptWorld;
                lptWorld.clients.push(client);
            }else {
                var lptWorld = myWorldDict[room];
                if (typeof (lptWorld) == 'undefined') {
                    console.log('first time room created');
                    var lptWorld = new LPTWorldNew();
                    lptWorld.initPhysics(0.0);
                    myWorldDict[room] = lptWorld;
                    lptWorld.clients.push(client);
                }else {
                    console.log('room is existing');
                    var lptWorld = myWorldDict[room];
                    lptWorld.clients.push(client);
                }

            }
            rooms[client.id] = room;
            client.emit('roomjoined','done');
            // console.log(room);
            // console.log(client);
            // console.log(client.id);
            // console.log(client.manager.rooms.length);
        });

        client.on('updateropeposition',function (deviceType) {
            console.log(deviceType);
        });

        client.on('message', function (packet) {
            packet = JSON.parse(packet);

            if (packet && packet.m) {
                // console.log("Packet sending value: ", packet.m);
                switch (packet.m) {
                    case 'setImpulse':
                        // console.log('x = '+packet.x+'y = '+packet.y+'bid = '+packet.bid);
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            lptWorld.setImpulse(packet.x, packet.y, packet.bid);
                            // lptWorld.updateWorld(client);
                        }
                        break;
                    case 'updateStrikerPosition':
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            // lptWorld.updatePosition(packet.xPos, packet.yPos, packet.bid);
                            // lptWorld.updateWorld(client);
                            lptWorld.updateStrikerPosition(packet.xPos, packet.yPos, packet.bid.toString(), packet.isInitial, client);
                        }
                        break;   
                    case 'updatePosition':
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            // lptWorld.updatePosition(packet.xPos, packet.yPos, packet.bid);
                            // lptWorld.updateWorld(client);
                            // lptWorld.updateStrikerPosition(packet.xPos, packet.yPos, packet.bid.toString());
                            lptWorld.updateStrikerWorld(packet.p, packet.bodyCount)
                        }
                        break;
                    case 'updateDragStatus':
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            lptWorld.updateDragStatus(packet.bid,packet.isdragging, client);
                            // lptWorld.updateWorld(client);
                        }
                        break;
                    case 'gameWon':
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            lptWorld.gameWonOpponent(client)
                        }
                        break;
                    case 'tableSize':
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            lptWorld.sendTableSize(packet.x, packet.y, packet.width, packet.height);
                        }
                        break;
                    case 'addBodyToStriker':
                    // console.log("Packet sending value: ", packet.m);
                        var lptWorld = myWorldDict[packet.roomId];
                        if (typeof(lptWorld) != 'undefined') {
                            lptWorld.addBodyToStriker(packet.xPos, packet.yPos, packet.bid.toString(), packet.isInitial, client);
                        }
                        break;
                    case 'ping':
                        // pong(client, packet.d);
                        break;
                    default:
                        break;
                }
            }
            //updateWorld();
        });

        client.on('disconnect', function () {
            console.log("disconnect");
            var room = rooms[client.id];
            var lptWorld = myWorldDict[room];
            if (typeof(lptWorld) != 'undefined') {
                lptWorld.userLeftGame('user_left','done');
            }
            client.leave(room, function () {
                console.log('Room Leaved');
            });
            // console.log(client.id);
            delete rooms[client.id];
            delete myWorldDict[room];
        });
    });

}

// Following Class will represent a Box2d world

function LPTWorldNew() {
    var self = this;
    self.clients = [];
    self.bodiesNum = 10;
    self.lastIntervalTime = new Date().getTime();
    self.deviceType = {iPhoneX : 1010, iPhone : 1011, iPad : 1012, Android : 1013};

    this.initPhysics = function (worldId) {
        // console.log('started');
        self.worldId = worldId;
        self.world = self.setupWorld(0.0);
        // Box2d Contact Listener
        self.world.SetContactListener(createCollisionDetector());
        // Box2D Engine step configuration
        setInterval(self.update, 1000 / 60);
        // Send world update to client every 20 ms
        setInterval(self.updateWorld, 20);
    }


    this.setupWorld = function (gravity) {
        var world = new b2World(new b2Vec2(0, gravity), true);

        var fixDef = new b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.1;
        fixDef.restitution = 0.1;

        var bodyDef = new b2BodyDef;

        // create ground
        bodyDef.type = b2Body.b2_staticBody;
        fixDef.shape = new b2PolygonShape;

        fixDef.shape.SetAsBox(22, 0.2);

        bodyDef.position.Set(16, 12.0); // Bottom Wall
        bodyDef.userData = {'wall':'bottom'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        bodyDef.position.Set(16, 0.005);// Top Wall
        bodyDef.userData = {'wall':'top'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        fixDef.shape.SetAsBox(0.001, 14);

        bodyDef.position.Set(0.01, 13);// Left Wall
        bodyDef.userData = {'wall':'left'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        bodyDef.position.Set(28.0, 13); // Right Wall
        bodyDef.userData = {'wall':'right'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        //==
        fixDef.shape.SetAsBox(2.5, 14);

        bodyDef.position.Set(0.0, 13);// Left striker stopper
        bodyDef.userData = {'rope':'left'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        bodyDef.position.Set(28.1, 13); // right striker stopper
        bodyDef.userData = {'rope':'right'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        //==
        fixDef.shape.SetAsBox(0.18, 2.5); //

        bodyDef.position.Set(14.0 , 9.5); // Lower barrier
        bodyDef.userData = {'barrier':'lower'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        bodyDef.position.Set(14.0 , 2.5); // Upper barrier
        bodyDef.userData = {'barrier':'upper'};
        world.CreateBody(bodyDef).CreateFixture(fixDef);

        // Striker dynamic objects
        bodyDef.type = b2Body.b2_dynamicBody;

        for(var i = 0; i < self.bodiesNum; i++) {
            fixDef.shape = new b2CircleShape(0.8);
            if(i < 5){
                bodyDef.position.x = (6.5 + i*0.8*2.0);
                bodyDef.position.y = 11;
            }else {
                bodyDef.position.x = (7.2 + i*0.8*2.0);
                bodyDef.position.y = 1;
            }

            bodyDef.userData = {
                'bodyId': i + '',
                'isdragging' : '0'
            };
            world.CreateBody(bodyDef).CreateFixture(fixDef);
        }
        return world;
    }

    this.update = function () {
        var newTime = new Date().getTime();
        self.lastIntervalTime = newTime;
        self.world.Step(0.01, 10, 10);
        // Update force to
        var body = self.world.GetBodyList();
        for (var i = 0; i < self.bodiesNum; i++) {
            if (body.GetUserData().bodyId && body.IsAwake()) {
                if((body.GetLinearVelocity().x <= 8.0 && body.GetLinearVelocity().x >= -8.0)){
                    body.SetLinearDamping(5.0);
                    body.SetAngularDamping(1.0);
                }
            }
            body = body.GetNext();
        }
        //
        self.world.ClearForces();
    }

    this.findBody = function (bid) {
        var body = null;
        var nextBody = self.world.GetBodyList();
        for (var i = 0; i < self.bodiesNum; i++) {
            if (nextBody.GetUserData().bodyId == bid) { body = nextBody; break; }
            nextBody = nextBody.GetNext();
        }
        return body;
    }

    this.findRopeBody = function (bid) /*Bid should be 'left' or 'right'*/ {
        var body = null;
        var nextBody = self.world.GetBodyList();
        for (var i = 0; i < self.bodiesNum; i++) {
            if (nextBody.GetUserData().rope == bid) { body = nextBody; break; }
            nextBody = nextBody.GetNext();
        }
        return body;
    }

    this.setImpulse = function (x,y,bid) {
        var body = self.findBody(bid);
        if (body != null){
            // console.log(body);
            body.SetAwake(true);
            body.m_fixtureList.m_isSensor = true;
            body.ApplyImpulse(new b2Vec2(x, y), body.GetPosition());
            // console.log('x = '+x+' y = '+y);
            // body.SetAngularVelocity(1.5);
        }
    }

    this.updatePosition = function(xPos,yPos,bid) {
        var body = self.findBody(bid);
        if (body != null){
            body.SetAwake(true);
            body.SetPositionAndAngle(new b2Vec2(xPos/32, yPos/32));
        }
    }

    this.updateDragStatus = function (bid, dragging) {
        var body = self.findBody(bid);
        if (body != null){
            // body.SetAwake(true);
            // body.GetUserData().isdragging = dragging;
            // console.log(body.GetUserData().isdragging);

        var packet = {
            m: "update_dragStatus",
            bid: bid.toString()
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(self.clients[i] != null) {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
        }
    }

    this.updateWorld = function (client) {
        var body = self.world.GetBodyList();
        var update = {};
        var bodyId ;
        var isUpdateNeeded = false;

        do {
            var userData = body.GetUserData();

            if(userData && userData.bodyId && body.IsAwake()){
                update[userData.bodyId] = {
                    p: body.GetPosition(),
                    // a: body.GetAngle(),
                    lv: body.GetLinearVelocity(),
                    av: body.GetAngularVelocity(),
                    isdragging : body.GetUserData().isdragging
                };
                bodyId = userData.bodyId;
                isUpdateNeeded = true;
            }
        } while (body = body.GetNext());


        if(isUpdateNeeded) {
            // console.log('Broadcasting');
            // self.sendToClients('world-update', update, bodyId, null);
        }
    }


    this.updateStrikerWorld = function (packet, countBody) {
        var bodyCount = 0;
        var update = {};
        console.log("count" + countBody);
        while (countBody != 0 && bodyCount < countBody) {
            
            var userData = packet[bodyCount];
            if(userData && userData.bid){

                update[userData.bid] = {
                    p: {
                        x: userData.xPos/32, y:userData.yPos/32
                    },
                    bid : userData.bid

                };
            }
            bodyCount = bodyCount + 1;
        }
        if (countBody > 0) {
            self.updateStrikerClient('world-striker-update', update, countBody, null);
        }
    }

    this.updateStrikerClient = function (message, data, bodyCount, except) {
        var packet = {
            m: message,
            d: data,
            bodyCount: bodyCount,
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(self.clients[i] != except) {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
    }

    this.updateStrikerPosition = function (posx, posy, bid, isInitial, client) {
        var update = {};
        var drag = "1";
        update[bid] = { 
            p: {
                x: posx, y:posy
            }, 
            isInitial : 0
        };
        // console.log('x = '+posx/32+' y = '+posy/32+' bid = '+bid);
        self.sendToClients('world-update', update, bid, null, client);
    }

    this.addBodyToStriker= function (posx, posy, bid, isInitial, client) {
        var update = {};
        update[bid] = { 
            p: {
                x: posx, y:posy
            }
        };
        console.log("bid "+bid);
        self.sendToClients('addBodyToStriker', update, bid, null, client);
        // var packet = {
        //     m: 'addBodyToStriker',
        //     d: update,
        //     bid: bid,
        // }
        // for (var i = 0; i < self.clients.length; i++) {
        //     if(self.clients[i] != client) {
        //         self.clients[i].send(JSON.stringify(packet));
        //     }
        // }
    }

    this.gameWonOpponent = function (client) {
        self.gameWon('gameWon', "lost", client);
    }

    this.sendTableSize = function(x, y, width, height){
        var packet = {
            m: 'tableSize',
            x: x,
            y: y,
            width: width,
            height: height
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(self.clients[i] != null) {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
    }


    this.sendToClients = function (message, data, bodyId, except, client) {
        var packet = {
            m: message,
            d: data,
            bid: bodyId,
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(self.clients[i] != client) {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
    }

    this.userLeftGame = function (message, data) {
        var packet = {
            m: message,
            d: data
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(typeof(self.clients[i]) != 'undefined') {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
    }

    this.gameWon = function (message, data, client) {
        var packet = {
            m: message,
            d: data
        }
        for (var i = 0; i < self.clients.length; i++) {
            if(self.clients[i] != client) {
                self.clients[i].send(JSON.stringify(packet));
            }
        }
    }

}

// The approach here was to only send updates when collisions happen

function createCollisionDetector() {
	var listener = new b2ContactListener();

	listener.BeginContact = function(contact){
	    var bodyA = contact.GetFixtureA().GetBody();
        var bodyB = contact.GetFixtureB().GetBody();
        var ropeBody = null;
        // console.log('begin contact');
        if (bodyA.GetUserData() && bodyB.GetUserData()) {
            if (bodyA.GetUserData().rope) {
                ropeBody = bodyA;
            }
            if (bodyB.GetUserData().rope) {
                ropeBody = bodyB;
            }
            if (ropeBody && bodyA.GetUserData().bodyId){
                if (bodyA.GetLinearVelocity().x != 0.0){
                    // bodyA.m_fixtureList.m_isSensor = true;
                }
            }else if (ropeBody && bodyB.GetUserData().bodyId){
                if (bodyB.GetLinearVelocity().x != 0.0){
                    // bodyB.m_fixtureList.m_isSensor = true;
                }
            }
            //===Check collision between barrier and striker
            if((bodyA.GetUserData().barrier && bodyB.GetUserData().bodyId) || (bodyA.GetUserData().bodyId && bodyB.GetUserData().barrier)){
                if(bodyA.GetUserData().bodyId){
                    bodyA.m_fixtureList.m_isSensor = false;
                }else {
                    bodyB.m_fixtureList.m_isSensor = false;
                }
            }
        }
	}
    listener.PreSolve = function(contact,oldManifold) {
    }
	listener.PostSolve = function(contact, impulse){
	}
	listener.EndContact = function(contact){
        var bodyA = contact.GetFixtureA().GetBody();
        var bodyB = contact.GetFixtureB().GetBody();
        var ropeBody = null;
        // console.log('begin contact');
        if (bodyA.GetUserData() && bodyB.GetUserData()) {
            if (bodyA.GetUserData().rope) {
                ropeBody = bodyA;
            }
            if (bodyB.GetUserData().rope) {
                ropeBody = bodyB;
            }
            if (ropeBody && bodyA.GetUserData().bodyId){
                bodyA.m_fixtureList.m_isSensor = false;
                // console.log('m_isSensor = false');
            }else if (ropeBody && bodyB.GetUserData().bodyId){
                bodyB.m_fixtureList.m_isSensor = false;
                // console.log('m_isSensor = false');
            }
        }
	}

	return listener;
}
