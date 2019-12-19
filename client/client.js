/***********************************************
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
*************************************************/

/**
 * @author Davinder Singh
 * a Thin client
 */

var id = null;
var lastIntervalTime = new Date().getTime();
var world;
var roomIds = ['room121','room122','room123','room124'];

//window.setInterval(ping, 1000);

function ping(){
	var packet = {
		m: 'ping',
		d: new Date().getTime()
	} 
	socket.send(JSON.stringify(packet));
}

function setupCanvas() {
	var debugDraw = new b2DebugDraw();

	debugDraw.SetSprite(document.getElementById("canvas").getContext("2d"));
	debugDraw.SetDrawScale(30.0);
	debugDraw.SetFillAlpha(0.5);
	debugDraw.SetLineThickness(1.0);
	debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);

	world.SetDebugDraw(debugDraw);
}

function _jump() {
	//jump();
	var packet = {
		m: 'setImpulse',
		roomId : roomIds[2],
		x: 1000.0,
		y: 500.0,
		bid : 0
	};
	socket.send(JSON.stringify(packet));
}

function _sendPos(x,y) {
    var packet = {
        m: 'updatePosition',
		xPos: x,
		yPos: y
    };

    // console.log("position: ", x);
    socket.send(JSON.stringify(packet));
}

function init() {
	world = setupWorld(0);
	setupCanvas();
	window.setInterval(update, 1000 / 60);
	var body;
	function update() {
	   var newTime = new Date().getTime();
	   lastIntervalTime = newTime;		
	   world.Step(0.01, 10, 10);
	   world.DrawDebugData();
	   world.ClearForces();
	}
}
         
//helpers
         
//http://js-tut.aardon.de/js-tut/tutorial/position.html
function getElementPosition(element) {
	var elem = element, tagname = "", x = 0, y = 0;
           
	while((typeof(elem) == "object") && (typeof(elem.tagName) != "undefined")) {
		y += elem.offsetTop;
		x += elem.offsetLeft;

		tagname = elem.tagName.toUpperCase();

		if(tagname == "BODY") elem = 0;

		if(typeof(elem) == "object") {
			if(typeof(elem.offsetParent) == "object") elem = elem.offsetParent;
		}

		return {x: x, y: y};
	}
}

function updateWorld(data) {
    console.log("Body Id = "+JSON.stringify(data));
	var body = world.GetBodyList();
	do {
		var userData = body.GetUserData();
		if(userData && userData.bodyId && data[userData.bodyId]){		
			var update = data[userData.bodyId];
			//console.log('position difference:', (body.GetPosition().y - update.p.y) * 30, body.GetLinearVelocity().y);

			body.SetAwake(true);
			body.SetPosition(update.p);
			body.SetAngle(update.a);
			body.SetLinearVelocity(update.lv);
			body.SetAngularVelocity(update.av);
		}
	} while (body = body.GetNext());
}




var socket = io.connect(xhost + ':' + xport);

socket.on('connect',function() {
	console.log('Client has connected to the server!');
	connected = true;
    socket.emit('room', roomIds[2]);
});

socket.on('message', function(packet) {
    console.log("Data = "+packet);
	packet = JSON.parse(packet);
	if (packet && packet.m) {
		switch(packet.m) {
			case 'world-update':
				updateWorld(packet.d);
				break;
			case 'pong':
				console.log('pong', new Date().getTime() - packet.d);
				break;
			default:	
				break;
		}
		
	}
});

socket.on('disconnect',function() {
	console.log('The client has disconnected!');
	connected = false;
});


window.onload = init;
