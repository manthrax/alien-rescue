
// globals
var gl; // the gl context.
var canvas; // the canvas
var math; // the math lib.
var fast; // the fast math lib.
var g_fpsTimer; // object to measure frames per second;
var g_logGLCalls = true; // whether or not to log webgl calls
var g_particles;
var g_debug = false; // whether or not to debug.
var g_drawOnce = false; // draw just one frame.
var g_paused = false;
var g_enableConstraints = true;
var g_camRay={
    start:vec3f(0,0,0),
    end:vec3f(0,0,0)
    };
var g_cameraPathTarget=vec3f(0,0,0);
var g_cameraPathTime=0.0;

var g_graphicsQuality=2;
var EPSILON = 0.000001;

var g_soundFalloff=[1,0.5,0.25,0.1,0.01,0.0,0.0]
var g_frameCount = 0;
var g_fpsDiv = null;

var g_hudTransformProperty = null;
var g_hudSpinDelta=0;

var g_debugBodies=true;
var g_renderDebugBodies=false;
var g_showHelp=false;
//g_drawOnce = true;
//g_debug = true;

var g_eyeSpeed = 0.01;
var g_eyeHeight = 8;
var g_eyeRadius = 9;
var g_dragStart = {
    x: 0,
    y: 0
};
var g_dragEnd = {
    x: 0,
    y: 0
};
var g_dragDelta = {
    x: 0,
    y: 0
};

var g_audioLevel=1.0;

var g_buttons = 0;

var g_nullControlsActive = {
    thrust: [false,false],
    yaw: [false,false],
    pitch: [false,false],
    roll: [false,false]
};


var g_controlFlipover=false;

var g_thrustDefault=0.0;

var g_controlRanges = {
    thrust:[0.0,0.05],
    pitch:[-0.03,0.03],
    yaw:[-0.03,0.03],
    roll:[-0.03,0.03]
    };
    
var g_controlInputs = {
    thrust:0, 
    pitch:0,
    yaw:0,
    roll:0
};

var g_nullControlInputs = {
    thrust:0, 
    pitch:0, 
    yaw:0,
    roll:0
};

var g_controlForces = {
    yaw:0.0001,
    thrust: 0.0002, 
    pitch:0.0001, 
    roll:0.0001
};

var g_controlDamping = {
    yaw:0.97,
    thrust: 0.998, 
    pitch:0.95, 
    roll:0.95
};

var g_buttons = 0;
var g_joyAxis = [0, 0, 0];

function newControls(){
    return {
        dirty:false,
        joyAxis:[0,0,0],
        inputs:{
            thrust:0, 
            pitch:0, 
            yaw:0,
            roll:0
        },
        active:{
            thrust: [false,false],
            yaw: [false,false],
            pitch: [false,false],
            roll: [false,false]
        },
        flipOver:g_controlFlipover,
        defaults:g_nullControlInputs,
        ranges:g_controlRanges,
        forces:g_controlForces,
        damping:g_controlDamping
    }
}

var g_controls=newControls();



var g_viewRotation = [0, 0, 0];
var cam3rdPerson=0;
var camFreeFly=1;
var camFollowPath=2;

var g_camMode=cam3rdPerson;

var g_terrainPatchSize=1000.0;
var g_camPath;
var diffuseRTTextureID=0;
var depthRTTextureID=1;
var lightDepthRTTextureID=2;
var diffuse2RTTextureID=3;
var terrains=[];

var minTx=0;
var minTy=0;
var maxTx=1;
var maxTy=1;

var g_terrainVertexRemap=[0,2,1]
var g_terrainVertexScale=vec3f(-160,160,160)
var g_terrainVertexTranslation=vec3f(0,0,0)


var g_NearZ=0.1;
var g_FarZ=10000.0;

    //500.0;


