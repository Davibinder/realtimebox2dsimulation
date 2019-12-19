var bodiesNum = 10;

var xport =  8008;
var xhost = '192.168.2.194';


var	b2Vec2 = Box2D.Common.Math.b2Vec2,
	b2AABB = Box2D.Collision.b2AABB,
	b2BodyDef = Box2D.Dynamics.b2BodyDef,
	b2Body = Box2D.Dynamics.b2Body,
	b2FixtureDef = Box2D.Dynamics.b2FixtureDef,
	b2Fixture = Box2D.Dynamics.b2Fixture,
	b2World = Box2D.Dynamics.b2World,
	b2MassData = Box2D.Collision.Shapes.b2MassData,
	b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape,
	b2CircleShape = Box2D.Collision.Shapes.b2CircleShape,
	b2DebugDraw = Box2D.Dynamics.b2DebugDraw,
	b2MouseJointDef =  Box2D.Dynamics.Joints.b2MouseJointDef,
    b2DistanceJointDef = Box2D.Dynamics.Joints.b2DistanceJoint,
	b2ContactListener =  Box2D.Dynamics.b2ContactListener;


function setupWorld(gravity) {
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
