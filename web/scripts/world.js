/*
 Copyright 2011 - Michael Schlachter
 All rights reserved.
 Please contact me at admin@vectorslave.com for usage info
*/

tdl.require('tdl.buffers');
tdl.require('tdl.fast');
tdl.require('tdl.fps');
tdl.require('tdl.log');
tdl.require('tdl.math');
tdl.require('tdl.models');
tdl.require('tdl.primitives');
tdl.require('tdl.programs');
tdl.require('tdl.textures');
tdl.require('tdl.webgl');
tdl.require('tdl.particles');

window.onload = initialize;

function setCameraMode(nmode){
    g_camMode=nmode;
    updateCamera(true);
}

/**
 * Sets up Planet.
 */
var worldGrid = colGrid();

function getPathPosition(pos,path,t){
    var pct=path.length;
    var vt0=(t%1.0)*pct;
    var p0=parseInt(vt0);
    var coef=vt0-parseInt(vt0);
    var p1=(p0+1)%pct;
    v3copy(v3t0,path[p0]);
    v3copy(v3t1,path[p1]);
    v3addv(pos,v3mulv(v3t0,v3t0,1.0-coef),v3mulv(v3t1,v3t1,coef));
    return pos;
}

function mat4row3(mat,vec,row)
{
    var idx=row*4;
    vec[0]=mat[idx];
    vec[1]=mat[idx+1];
    vec[2]=mat[idx+2];
}

function matrixSetRowVector3(mat,row,vec){
    var idx=row*4;
    mat[idx]=vec[0];
    mat[idx+1]=vec[1];
    mat[idx+2]=vec[2];
}


function updateCamera(noclip){
	
    if(g_paused==true || g_camMode == camFollowPath){
		
        var maxVel=0.2;
        if(isNaN(g_eyeVelocity[0]))
            return;
        getPathPosition(g_cameraPathTarget,g_cameraPath,g_cameraPathTime);
        if(v3dist(g_eyePosition,g_cameraPathTarget)<5.0){
            g_cameraPathTime+=g_eyeSpeed;
        }
        var vd=v3subv(v3t0,g_cameraPathTarget,g_eyePosition);
        if(v3dot(vd,vd)>10000.0){
            v3copy(g_eyePosition,g_cameraPathTarget);
        }
        v3normalizev(vd,vd);
        v3mulv(vd,vd,maxVel);
		
        v3addv(g_eyeVelocity,g_eyeVelocity,v3mulv(vd,v3subv(vd,vd,g_eyeVelocity),0.01))
        nanicheck(g_eyeVelocity[0],3);
		
        v3addv(g_eyePosition,g_eyePosition,g_eyeVelocity);
		
        v3addv(targetPosition,g_eyePosition,g_eyeVelocity);
		
        g_debugObjectQueue.push({
            position:vec3(g_cameraPathTarget),
            radius:0.2
        });

    }
    else if (g_camMode == cam3rdPerson) {
        if (bodies.length > 0) {
            //if(g_targetFixture&&g_targetFixture!=null){
             //   mat4row3(targetPosition,g_targetFixture.matrix,3);
             //   v3mulv(v3t0,v3t0,-1.0);
             //   v3copy(targetPosition,v3t0);
            //}else
            mat4row3(g_targetFixture.matrix,targetPosition,3);
            //v3copy(targetPosition, bodies[g_targetBody].position0);
            v3addv(g_eyePosition, targetPosition, targetLocalOffset);
            if(g_eyePosition.y<targetPosition.y)
                g_eyePosition.y+=(targetPosition.y-g_eyePosition.y)*2.0;
        }
    } else if(g_camMode == camFreeFly){
		
    }

	
    if(!noclip){
        v3copy(g_camRay.start,g_lastEyePosition);
        v3copy(g_camRay.end,g_eyePosition);
        var contact=raycast(g_camRay.start,g_camRay.end,2.0);
        if(contact!=null){
            v3copy(g_eyePosition,contact.position);
		
            if(g_eyePosition[1]<contact.position[1]){//warp aboveground if belowground..
                v3addv(g_eyePosition,contact.position,v3mulv(v3t0,contact.normal,2.0));
            }else
                v3copy(g_eyePosition,g_lastEyePosition);		
            freeContactList(contact);
        }
    }
    v3copy(g_lastEyePosition,g_eyePosition);
    
    if (g_paused==false && g_camMode == camFreeFly) {
        fast.matrix4.rotationY(m4t0, g_viewRotation[1]);
        fast.matrix4.rotateX(m4t0, g_viewRotation[0]);
        fast.matrix4.getAxis(v3t0, m4t0, 1);
        fast.matrix4.getAxis(v3t1, m4t0, 2);
        fast.matrix4.lookAt( view, g_eyePosition, v3addv(v3t2, g_eyePosition, v3t1), v3t0);
        v3copy(lookVector, v3t1);

    } else {
        fast.matrix4.lookAt( view, g_eyePosition, targetPosition, up);
        v3normalizev(lookVector, v3subv(lookVector, targetPosition, g_eyePosition));
    }
    
}

function getHeight(vx, vy) {
    var px = parseInt(vx * 1023.9) & 1023;
    var py = parseInt(vy * 1023.9) & 1023;
    return heightmapData[(py * 1024) + px];
}

function setupTerrain(tx,ty) {
    var mdl=setupStaticModel(BlenderExport.terrain,setupTerrainMaterial(),g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
    return mdl;

    var rtn = new tdl.models.Model(terrainProgram, arrays, terrainTextures);
    var scl = g_terrainPatchSize;
    var arrays = tdl.primitives.createPlane(scl, scl, 255,255);
    var npos = arrays.position.buffer;
    var ntex = arrays.texCoord.buffer;
    var ti = 0;
    var i;
    for (i = 0; i < arrays.position.buffer.length; i += 3) {
        npos[i + 1] = (getHeight(ntex[ti + 0], ntex[ti + 1]) * 0.5) - 50.0;
        ti += 2;
    }
    var indices = arrays.indices.buffer;
    var ect = indices.length;
    var vo=[tx*g_terrainPatchSize, 0, ty*g_terrainPatchSize];
    var startT = new Date().getTime();
    for (i = 0; i < ect; i += 3) {
        var vi = indices[i] * 3;
        var v0=v3add(vo,[npos[vi], npos[vi + 1], npos[vi + 2]]);
        vi = indices[i + 1] * 3;
        var v1=v3add(vo,[npos[vi], npos[vi + 1], npos[vi + 2]]);
        vi = indices[i + 2] * 3;
        var v2=v3add(vo,[npos[vi], npos[vi + 1], npos[vi + 2]]);
        colGridAddTri(worldGrid, colTri(v0,v1,v2));
    }
    var endT = new Date().getTime();
    console.log("colGridTime:"+(endT-startT));
    startT=endT;
    var rtn = new tdl.models.Model(terrainProgram, arrays, terrainTextures);
    return rtn;
}

function setupSkybox() {
    var textures = {
        cubeSampler: textureLoad(skyboxTextures)
    };
    var program = createProgramFromTags('skyVertexShader', 'skyFragmentShader');
    var arrays = tdl.primitives.createCube(600.0);

    return new tdl.models.Model(program, arrays, textures);
}

var	depthShader=null;

function getDepthShader(){
    if(!depthShader){
        depthShader={
            program:createProgramFromTags('depthOnlyVertexShader', 'depthOnlyFragmentShader'),
            consts:zonlyConst,
            per:zonlyPer
        };
    }
    return depthShader;
}

var	DOFYShader=null;
function getDOFYShader(){
    if(!DOFYShader){
        DOFYShader={
            program:createProgramFromTags('DOFYPassVertexShader', 'DOFYPassFragmentShader'),
            consts:fsQuadObject.shaderConst,
            per:fsQuadObject.shaderPer
        };
    }
    return DOFYShader;
}

var	DOFXShader=null;
function getDOFXShader(){
    if(!DOFXShader){
        DOFXShader={
            program:createProgramFromTags('DOFXPassVertexShader', 'DOFXPassFragmentShader'),
            consts:fsQuadObject.shaderConst,
            per:fsQuadObject.shaderPer
        };
    }
    return DOFXShader;
}

var	defShadowShader=null;
function getDefShadowShader(){
    if(!defShadowShader){
        defShadowShader={
            program:createProgramFromTags('defShadowVertexShader', 'defShadowFragmentShader'),
            consts:fsQuadObject.shaderConst,
            per:fsQuadObject.shaderPer
        };
    }
    return defShadowShader;
}

function startVideo(){
}

function videoDone(){
    //function simply calls window.clearInterval() to end the calls to update the animation.
    clearInterval();
}

function v3struct(v){
    return {
        0:v[0],
        1:v[1],
        2:v[2]
        };
}

var g_settingsVersion=16;

function worldClosed(){
    var state=JSON.stringify({
        version:g_settingsVersion,
        buttons:g_buttons,
        viewRotation:v3struct(g_viewRotation),
        camMode:g_camMode,
        camTargetIndex:g_cameraTargetIndex,
        eyePosition:v3struct(g_eyePosition),
        graphicsQuality:g_graphicsQuality,
        soundVolume:g_audioLevel,
        showHelp:g_showHelp,
        renderDebugBodies:g_renderDebugBodies,
        paused:g_paused
    });
    localStorage['settings']=state;
    
//    localStorage['appRunning']=false;
}

function loadSettings(){
    g_buttons = 0;
    v3set(g_viewRotation,0,0,0);
    g_camMode = cam3rdPerson;
    g_cameraTargetIndex = 5;
    v3set(g_eyePosition,250,250,250);
    v3copy(g_lastEyePosition,g_eyePosition);
    g_graphicsQuality=2;
    g_renderDebugBodies=false;
    g_paused=false;
    g_showHelp=true;
    g_audioLevel=0;
    if(localStorage['appRunning']&&localStorage['appRunning']==true){
        alert("App already ruunning!");
    }else{
//        localStorage['appRunning']=true;
    }
    
    if(localStorage['settings']&&false){//){//
        var settings=JSON.parse(localStorage['settings']);
        if( settings.version && settings.version==g_settingsVersion)
        {
            g_buttons = settings.buttons;
            v3copy(g_viewRotation,settings.viewRotation);
            g_camMode = settings.camMode;
            g_cameraTargetIndex = settings.camTargetIndex;
            v3copy(g_eyePosition,settings.eyePosition);
            v3copy(g_lastEyePosition,g_eyePosition);
            g_graphicsQuality=settings.graphicsQuality;
            g_audioLevel=settings.soundVolume;
            g_showHelp=settings.showHelp;
            g_renderDebugBodies=settings.renderDebugBodies;
            g_paused=settings.paused;
        }
    }
    setPaused(g_paused);
    synchronizeSettingsUI();
}

function setMouseCapture(capture){
    var viewElem = document.getElementById('canvas');//viewContainer');
   // if(document.pointerLockEnabled)
    if(capture===true)
        viewElem.requestPointerLock();
    else
        document.exitPointerLock();        
}

function setHelpActivation(helpActive){
    setElementVisibility('helpText',helpActive);
    setElementVisibility('userVideo',helpActive);
    if(helpActive==false)
        canvas.focus();
}

var g_dragElement=null;

function doPreventDefault(e){
    if (e.preventDefault) e.preventDefault();
    e.cancelBubble = true;
    if (e.stopPropagation) e.stopPropagation();
}

function makeDraggableElement(targElem){
    targElem.draggable=true;
    targElem.onmousedown=function(evt){
        //console.log("eclick start");
        
        if(!evt.target.draggable)return;
        g_dragElement=evt.target;
        evt.target.dragOrg={x:evt.pageX-evt.target.offsetLeft,y:evt.pageY-evt.target.offsetTop};
//        evt.target.beingDragged=true;
        //console.log("dragElem start");
        doPreventDefault(evt);
    }
    
    targElem.onmousemove=function(evt){
    }

    targElem.onmouseout=function(evt){
    }

    targElem.onmouseup=function(evt){
        if(!evt.target.draggable)return;
        if(g_dragElement==evt.target)
            g_dragElement=null;
        //console.log("dragElem stop");
    }
}

function synchronizeSettingsUI(){
    console.log("sync");
    
    makeDraggableElement(document.getElementById('playerList'));
    makeDraggableElement(document.getElementById('helpText'));
    makeDraggableElement(document.getElementById('userVideo'));
    makeDraggableElement(document.getElementById('chatPanel'));
    
    
    
    var targElem=document.getElementById('cameraTarget');
    targElem.options.length=0;
    for(var i=0;i!=g_cameraTargetList.length;i++)
        targElem.options[i]=new Option(i,i,false,false);
    targElem.selectedIndex=g_cameraTargetIndex;
    document.getElementById('cameraMode').selectedIndex=g_camMode;
    document.getElementById('graphicsQuality').selectedIndex=g_graphicsQuality;
    document.getElementById('soundVolume').selectedIndex=parseInt((g_audioLevel*1.01)/0.2);

    document.getElementById('showBodies').selectedIndex=g_renderDebugBodies?1:0;
    
    setHelpActivation(g_showHelp);
}

function setElementVisibility(elemID,makeVisible){
    var i=document.getElementById(elemID);
    if(makeVisible==false){//i.style.visibility == 'visible'){
        i.style.visibility='hidden';
    }else{
        i.style.visibility='visible';
    }
}

function setElementVisibility(elemID,visible){
    var i=document.getElementById(elemID);
    if(visible){
        i.style.visibility='visible';
    }else{
        i.style.visibility='hidden';
    }
}

function setPaused(pause){
    if(pause){
        setMouseCapture(false);
        setElementVisibility('titleDiv',true);
        audio.globalVolume(0.0);
        g_videoElement.pause();
    }else{
        setMouseCapture(true);
        setElementVisibility('titleDiv',false);
//        audio.globalVolume=1.0;
        audio.globalVolume(g_audioLevel);
        g_videoElement.play();
    }
}

function selectCameraTarget(targ){
    g_cameraTargetIndex=targ;
    g_targetBody = g_cameraTargetList[g_cameraTargetIndex][1];
    g_targetFixture = g_cameraTargetList[g_cameraTargetIndex][0];
    updateCamera(true);
    if(iosocket)
        iosocket.emit('control',g_targetFixture.id);    //Send a control message
}

function selectNextCamTarget(){
    selectCameraTarget((g_cameraTargetIndex+1)%g_cameraTargetList.length);
}


function getTransformProperty(element) {
    // Note that in some versions of IE9 it is critical that
    // msTransform appear in this list before MozTransform
    var properties = ['transform','WebkitTransform','msTransform','MozTransform','OTransform'];
    var p;
    while ((p = properties.shift())) {
        if (typeof element.style[p] != 'undefined') {
            return p;
        }
    }
    return false;
}

var badPacketCount=0;

function sendFixtureToServer(fix){
    var msg='sync~'+fix.id;
    for(var bid in fix.bodies){
        var bod=fix.bodies[bid];
        msg+='~'+bod.position[0]+'~'+bod.position[1]+'~'+bod.position[2]+
             '~'+bod.linearVelocity[0]+'~'+bod.linearVelocity[1]+'~'+bod.linearVelocity[2];
    }
    iosocket.emit('sim',msg);
}

function sendControlsToServer(fix){
    var msg='ctrl~'+fix.id;
    var controls=fix.controls;
    for(var i in controls.inputs)
        msg+='~'+controls.inputs[i];
    for(var ca in controls.active)
        for(var a in controls.active[ca])
            msg+='~'+controls.active[ca][a];
    msg+='~'+controls.flipOver;
    iosocket.emit('sim',msg);
}

function parseBool(str) {
  return /^y|yes|ok|true$/i.test(str);
}

function recvFromServer(msg){
    var cmd=msg.data.split('~');
    var idx=0;
    while(idx<cmd.length){
        var remaining=cmd.length-idx;
        var c=cmd[idx];
        if(c=='sync'){
            var objID=cmd[++idx];
            idx++;
            var fix=fixtures[objID];
            if(remaining<(fix.bodies.length*6)+2){//cmd + objID + 16 flt
                badPacketCount++;
                break;
            }
            try{
                for(var bid in fix.bodies){
                    var bod=fix.bodies[bid];
                    v3set(bod.position,parseFloat(cmd[idx++]),parseFloat(cmd[idx++]),parseFloat(cmd[idx++]));
                    v3set(bod.linearVelocity,parseFloat(cmd[idx++]),parseFloat(cmd[idx++]),parseFloat(cmd[idx++]));
                }
            }catch(e){
                badPacketCount++;
                break;
            }
        }else if(c=='ctrl'){
            var objID=cmd[++idx];
            idx++;
            var fix=fixtures[objID];
            if(remaining<15){//cmd + objID + 16 flt
                badPacketCount++;
                break;
            }
            var controls=fix.controls;
            for(var i in controls.inputs){
                controls.inputs[i]=parseFloat(cmd[idx++]);
            }
            
            for(ci in controls.active){
                for(i in controls.active[ci]){
                    controls.active[ci][i]=parseBool(cmd[idx++]);
                }
            }
            controls.flipOver=parseBool(cmd[idx++]);
        }
        if(idx==cmd.length)
            break;
    }
}

var then = 0.0;
var clock = 0.0;
var fpsElem = document.getElementById("fps");
var startT = new Date().getTime();

function initialize() {

    then = 0.0;
    clock = 0.0;
    fpsElem = document.getElementById("fps");
    startT = new Date().getTime();

    math = tdl.math;
    fast = tdl.fast;
    canvas = document.getElementById("canvas");
    g_fpsDiv = document.getElementById('fpsContainer');
    g_hudTransformProperty = getTransformProperty(g_fpsDiv);
    g_fpsTimer = new tdl.fps.FPSTimer();
    gl = tdl.webgl.setupWebGL(canvas);

    g_videoElement = document.getElementById("video");
    g_videoElement = document.getElementById("video");
    //g_videoElement.addEventListener("canplaythrough", startVideo, true);
    //g_videoElement.play();
    g_videoElement.volume=0;
    
    sphere = setupSphere();
    chopperObject = buildObjectFromDef(chopperDef);
	
    billboardObject = buildObjectFromDef(billboardDef,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
    
    hudTextObject = buildObjectFromDef(hudTextDef,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);//,[0,1,2],[1,1,1],[0,0,0]);    

    borgObject = buildObjectFromDef(borgDef,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
	
    fast.matrix4.translation(borgObject.matrix, [-208.0,53.0,127.0]);
	
    fsQuadObject = buildObjectFromDef(fsQuadDef);
    waterObject = buildObjectFromDef(waterDef,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation); 
    ralienObject = buildObjectFromDef(ralienDef);
	
    hellcatObject = buildObjectFromDef(hellcatDef);
	
    sandrailObject = buildObjectFromDef(sandrailDef);
    ptboatObject = buildObjectFromDef(ptboatDef);
	
    //g_videoElement.addEventListener("ended", videoDone, true);

    skybox = setupSkybox();

    setInterval(updateLocalVideoTexture, 66);//66=15 fps.. 33=30fps 16=60fps
	
    //setInterval(updateDynamicTexture, 66);//66=15 fps.. 33=30fps 16=60fps

    Log("--Setup Terrain---------------------------------------");
    for(var tx=minTx;tx<maxTx;tx++)
        for(var ty=minTy;ty<maxTy;ty++){
            if(ty==minTy)terrains[tx] = [];
            terrains[tx][ty]=buildObjectFromDef(terrainDef,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
            //setupTerrain(tx,ty);//t;
            console.log("generating:"+tx+":"+ty);
        }
    g_cameraPath=setupPath(BlenderExport.Path.points);
    var endT = new Date().getTime();
    Log("--Terrain done:"+(endT-startT));
    startT=endT;
    colGridGenerate(worldGrid, 255.998);
    endT=new Date().getTime();
    Log("--Generate done:"+(endT-startT));
    startT=endT;
    audio.loadSounds(".\\assets\\",{
        helo:{
            file:"helo"
        },
        meep:{
            file:"meep"
        }
    });
    audio.startSoundsLoading();

    endT=new Date().getTime();
    Log("--SoundLoad done:"+(endT-startT));

    initRTT();

    if (!gl) {
        return false;
    }
    if (g_debug) {
        gl = tdl.webgl.makeDebugContext(gl, undefined, LogGLCall);
    }

    v3set(g_eyePosition,0,0,0);
    v3set(g_lastEyePosition,0,0,0);

    buildWorld();

    g_targetBody = g_cameraTargetList[0][1];
    g_targetFixture = g_cameraTargetList[0][0];
    loadSettings();

    selectCameraTarget(g_cameraTargetIndex);
    setCameraMode(g_camMode);
    
    
    var chatInputField=document.getElementById('outgoingChatMessage');
    
 //   chatInputField.onfocus=function(){
 //       chatFocus=true;
 //   }
 //   chatInputField.onblur=function(){
 /// /      chatFocus=false;
 //   }
 
    window.onmousedown = function (e) {
        //canvasFocussed=true;
        g_buttons |= 1 << e.button;
        //console.log("Got mouseDown");
        g_dragStart.x = e.x;
        g_dragStart.y = e.y;

        if (e.button == 2) {
        }
        //doPreventDefault(e);
    }

    gl.canvas.onmousedown = function (e) {
        window.focus();
        e.preventDefault();
        console.log("Window focussed.");
    }
    
    window.onmousemove = function (e) {
        
        //console.log("Got mouse move");
        
        g_dragEnd.x = e.pageX;
        g_dragEnd.y = e.pageY;
        g_dragDelta.x = g_dragEnd.x - g_dragStart.x;
        g_dragDelta.y = g_dragEnd.y - g_dragStart.y;
        g_dragStart.x = g_dragEnd.x;
        g_dragStart.y = g_dragEnd.y;
        
        
        
    //    console.log("mmx:"+e.deltaX+"mmy:"+e.deltaY);
        getDebugText();
        if(document.pointerLockEnabled) {
            g_dragDelta.x=e.movementX;
            g_dragDelta.y=e.movementY;
//            debugTextElem.innerHTML="mx:"+e.movementX+" my:"+e.movementY;
        } else {
//            debugTextElem.innerHTML="mx:"+e.x+" my:"+ e.x;
        }

        if(g_dragElement!=null){
        //    console.log("drag:"+g_dragDelta.x+","+g_dragDelta.y);
            g_dragElement.style.left=(e.pageX-g_dragElement.dragOrg.x);
            g_dragElement.style.top=(e.pageY-g_dragElement.dragOrg.y);
        }else{
            if ((g_buttons & 1) || (document.pointerLockEnabled)) {
                g_viewRotation[0] += g_dragDelta.y *  0.01;
                g_viewRotation[1] += g_dragDelta.x * -0.01;
            //}else{
                if(g_targetFixture&&g_targetFixture!=null){
                    g_targetFixture.controls.joyAxis[0]=(g_dragEnd.x/document.width)-0.5;
                    g_targetFixture.controls.joyAxis[1]=(g_dragEnd.y/document.height)-0.5;
                }
            }
        }
    }

    window.onmouseup = function (e) {
        g_buttons &= ~ (1 << e.button);
        //console.log("Got mouseup");
        doPreventDefault(e);
    }
    
    window.onkeydown = function (e) {
        if(document.activeElement==chatInputField)return;
        if (updateAppKeys(e.keyCode, true)==true){
            //Got app key
        }
        else if (updateControlKeys(e.keyCode, true)) {
            //Got flight key
        }
    }
    
    window.onkeyup = function (e) {
        if(document.activeElement==chatInputField)return;
        updateControlKeys(e.keyCode, false);
    }

    connectToChatServer();
    
    gameLoop();
    return true;
}


function onscroll(delta) {
    if(g_camMode==camFreeFly){
        v3addv(g_eyePosition, g_eyePosition, v3mul(lookVector, delta));
        
    }else if(g_camMode==cam3rdPerson){
        targetOffset[2]+=delta*0.1;
    }
}

function wheel(event) {
    var delta = 0;
    if (!event) event = window.event;
    if (event.wheelDelta) {
        delta = event.wheelDelta / 120;
        if (window.opera) delta = -delta;
    } else if (event.detail) {
        delta = -event.detail / 3;
    }
    if (delta) onscroll(delta);
    doPreventDefault(event);
    event.returnValue = false;

}
window.onmousewheel = document.onmousewheel = wheel;

function updateAppKeys(keyCode, state) {
    if(state==false)return false;
    //Just Pressed
    if (keyCode == KEY.E) selectNextCamTarget();
    else if (keyCode == KEY.O)audio.play("helo",1.0,null,null);
    else if (keyCode == KEY.H){
        if(g_showHelp==true)g_showHelp=false; else g_showHelp=true;
        setHelpActivation(g_showHelp);
    }else if (keyCode == KEY.P) {
        console.log("pause hit");
        g_paused = !g_paused;
        setPaused(g_paused);
    }else   if (keyCode == KEY.G){
        g_graphicsQuality=(g_graphicsQuality+1)%3;
    }else if (keyCode == KEY.X) {
        console.log("constraint hit");
        g_enableConstraints = !g_enableConstraints;
    }else if(keyCode == KEY.Q){
        g_camMode = (g_camMode + 1) % 3;
    }else if(keyCode == KEY.SPACEBAR){
        interactFixture();
    }else if(keyCode == KEY.M){
        if(//(g_frameCount%100)==0 &&
            (g_targetFixture&&g_targetFixture!=null)){
            sendFixtureToServer(g_targetFixture);
        }
    }else
        return false;
    return true;
}

var g_keyWasDown={};

function updateControlKeys(keyCode, state) {
    if(state==true){
        var wasdown=g_keyWasDown[keyCode];
        if((wasdown==undefined)||(wasdown==false))g_keyWasDown[keyCode]=true;
        else
            return; //Debounce
    }else{
        g_keyWasDown[keyCode]=false;
    }
    if(g_targetFixture==undefined||g_targetFixture==null||g_camMode!=cam3rdPerson)
        return false;
    
    if(g_localPlayer&&g_localPlayer.spectating==true)   //If we are connected to the server and spectating, then we dont have controls..
        return false;
    
    var controls=g_targetFixture.controls;
    if (keyCode == KEY.W){     controls.active.thrust[0] = state;}
    else if (keyCode == KEY.S) controls.active.thrust[1] = state;
    else if (keyCode == KEY.A) controls.active.yaw[0] = state;
    else if (keyCode == KEY.D) controls.active.yaw[1] = state;
    else if (keyCode == KEY.ARROW_UP) controls.active.pitch[0] = state;
    else if (keyCode == KEY.ARROW_DOWN) controls.active.pitch[1] = state;
    else if (keyCode == KEY.ARROW_LEFT) controls.active.roll[0] = state;
    else if (keyCode == KEY.ARROW_RIGHT) controls.active.roll[1] = state;
    else if (keyCode == KEY.R) controls.flipOver = state;
    else return false;
    
    
    sendControlsToServer(g_targetFixture);
    
    return true;
}

var g_grappleBodies=[];
var g_grappleConstraints=[];

function interactFixture(){
    if(!(g_targetFixture&&g_targetFixture!=null))
        return;
    
    if(g_grappleBodies.length>0){
        bodies=bodies.slice(0,g_grappleBodies[0]);
        g_grappleBodies=[];
        constraints=constraints.slice(0,g_grappleConstraints[0]);
        g_grappleConstraints=[];
        return;
    }
    
    
    var itarget=null;
    var bestdist=0;
    for(var fcid in fixtures){
        var fcheck=fixtures[fcid];
        if(fcheck==g_targetFixture)continue;
        var dist=v3len(v3subv(v3t0,g_targetFixture.bodies[0].position,fcheck.bodies[0].position));
        if(itarget==null||dist<bestdist){
            itarget=fcheck;
            bestdist=dist
        }
    }
    if(itarget!=null){
        var b0=-1;
        for(var t=0.1;t<1.0;t+=0.2){            
            v3addv(v3t0,v3mulv(v3t0,g_targetFixture.bodies[0].position,1.0-t),v3mulv(v3t1,itarget.bodies[0].position,t));
            var b1=bodies.length;
            g_grappleBodies.push(b1);
            var bod=addBody(sphere, sphereConst, spherePer, v3t0);
            bod.mass=0.005;
            bod.radius*=0.25;
            var c0=constraints.length;
            g_grappleConstraints.push(c0)
            var constr=addDistanceConstraint(b0==-1?g_targetFixture.bodies[0]:bodies[b0], bod);
            b0=b1;
            constr.restitutionForce=0.1;
            constr.restLength*=0.9;
        }
        constr=addDistanceConstraint(bodies[b0], itarget.bodies[0]);
        constr.restitutionForce=0.1;
        constr.restLength*=0.9;
    }
}


var debugTextElem = null;
 //   toggleMouseCapture();
function getDebugText(){
    if(debugTextElem===null)
    {
        debugTextElem=document.getElementById('debugText');
    }
}


function projectBodyVelocity(body,normal,namt){
    var vdot=v3dot(normal,body.linearVelocity);
    var vlen=v3len(body.linearVelocity);
    v3mulv(v3t8,normal,vdot*(namt?-namt:-1.0));
    v3addv(body.linearVelocity,body.linearVelocity,v3t8);
    var nlen=v3len(body.linearVelocity);
    if(nlen>0.00001){
        v3mulv(body.linearVelocity,body.linearVelocity,vlen/nlen);
    }
}

function updateControls(fix){
    var i;
    var controls=fix.controls;
    for(i in controls.active){
        var cai=controls.active[i];
        if(cai[0]||cai[1]){
            if(cai[0])
                controls.inputs[i]+=controls.forces[i];
            if(cai[1])
                controls.inputs[i]-=controls.forces[i];
        }else{
            controls.inputs[i] *= controls.damping[i];
        }
    }
   
    if(g_buttons==1){
        if(Math.abs(controls.joyAxis[0])>0.02){
            controls.inputs.roll+=controls.joyAxis[0]*controls.forces.roll*-2.0;
            controls.inputs.yaw+=controls.joyAxis[0]*controls.forces.yaw*-1.0;
        }
        if(Math.abs(controls.joyAxis[1])>0.02){
            controls.inputs.pitch+=controls.joyAxis[1]*controls.forces.pitch*-2.0;
        }
    //controls.inputs.thrust+=controls.forces.thrust;
    }

    for(i in controls.inputs){
        if(controls.inputs[i]<controls.ranges[i][0])
            controls.inputs[i]=controls.ranges[i][0];
        else if(controls.inputs[i]>controls.ranges[i][1])
            controls.inputs[i]=controls.ranges[i][1];
    }
    if(controls.inputs.thrust<controls.defaults.thrust){
        controls.inputs.thrust+=controls.forces.thrust*0.5;
    }
    for(var ck in fix.components){
        var c=fix.components[ck];
        if(c.controls)c.controls(fix);
    }
}

function updateAvatarControls(fix){
    if (g_camMode == camFreeFly) {
        v3addv(g_eyePosition, g_eyePosition, v3mul(lookVector, fix.controls.inputs.thrust*3.0));
    }
}

function chopperTrackTarget(fi){
    var tmp = v3t5;
    var tmp2 = v3t6;
		
    var vl = fi.bodies[3].linearVelocity; //Top ball
		
    //Path following
    
    v3copy(tmp2,fi.formationOffset);
    getPathPosition(tmp,g_cameraPath,(clock*0.0006)+(fi.pathTime*0.001)); //Follow path..
		
    tmp[1]+=Math.sin(fi.pathTime+(clock*1.6))*1.0;
		
    v3addv(tmp,tmp,tmp2);
		
    if(fi.bodies[3].position[1]<fi.bodies[1].position[1]){
        v3mulv(fi.bodies[3].linearVelocity,fi.bodies[3].linearVelocity,0.97);				
    }else{
	
        v3subv(tmp,tmp,fi.bodies[3].position0);
        for(var i=0;i<4;i++){
            vl=fi.bodies[i].linearVelocity;
            v3addv(fi.bodies[i].position0,fi.bodies[i].position0,tmp);
            v3addv(fi.bodies[i].position,fi.bodies[i].position,tmp);
            v3mulv(vl,vl,0.97);
        }
        v3addv(fi.bodies[0].linearVelocity,fi.bodies[0].linearVelocity,v3mulv(tmp2,tmp,-0.01));
        //end path following
    }
}

function cameraTrackFixture(fwd,up,right){

    v3copy(v3t1, v3mulv(v3t0, fwd, targetOffset[2]))
    v3addv(v3t1, v3t1, v3mulv(v3t0, up, targetOffset[1]))
    v3addv(v3t1, v3t1, v3mulv(v3t0, right, targetOffset[0]))
    v3mulv(targetLocalOffset,targetLocalOffset,0.9);

    v3mulv(v3t1,v3t1,0.1);
    v3addv(targetLocalOffset,targetLocalOffset,v3t1)
}

function v3srandv(v,rng){
    v[0]=(Math.random()-0.5)*(rng*2.0);
    v[1]=(Math.random()-0.5)*(rng*2.0);
    v[2]=(Math.random()-0.5)*(rng*2.0);
    return v;
}

function buildWorld() {
    var ibase = bodies.length;
    var prvrow = bodies.length;
    var gd = 1.0;
    var wid = 9;
    for (var iy = 0; iy <= wid; iy++) {
        var irow = ibase;
        for (var ix = 0; ix <= wid; ix++) {
            var nbody = addBody(sphere, sphereConst, spherePer, [(ix * gd) - (wid * gd * 0.5), 30.0, (iy * gd) - (wid * gd * 0.5)], [Math.PI * 1.5, Math.PI * 0.5, 0]);
            if (ix > 0 && iy > 0) {
                var btl = bodies[prvrow + ix - 1];
                var btr = bodies[prvrow + ix];
                var bbl = bodies[irow + ix - 1];
                var bbr = bodies[irow + ix];
                addDistanceConstraint(btl, btr,true);
                addDistanceConstraint(btr, bbl,true);
                addDistanceConstraint(btl, bbl,true);
                addDistanceConstraint(bbr, btl,true);
                if (ix == wid) addDistanceConstraint(btr, bbr,true);
                if (iy == wid) addDistanceConstraint(bbl, bbr,true);
            }
            if (iy == 0) {
                if (ix == 0 || ix == 4 || ix == wid) //parseInt(wid*0.5)
                    addAnchorConstraint(nbody, nbody.position);
            }
            ibase++;
        }
        ibase = bodies.length;
        prvrow = irow;
    }
    for(var off=-3.0; off<5.999;off+=3.0)
    {
        for(var t=0;t<BlenderExport.spawns.length;t++){
            var sp=BlenderExport.spawns[t];
            for(var ct=0;ct<16;ct++)
                m4t0[ct]=sp.matrix[ct];
            m16simpleTrans(m4t0,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
            
            //console.log("DOin:"+off);
            var pos=[m4t0[12]+off,m4t0[13],m4t0[14]+off];
            //v3simpleTrans([pos],g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
            if(sp.name=="chopper"){
                var fix=makeHeliFixture(pos, chopperObject.model, chopperObject.shaderConst, chopperObject.shaderPer, updateChopperFixture);
                fix.pathTime=0;
                fix.formationOffset=[0,0,0,0];
                v3srandv(fix.formationOffset,10.0);
                fix.formationOffset[1]*=0.0;
                fix.engineSound=audio.addEmitter(fix,fix.bodies[0].position);
            }else
            if(sp.name=="ralien"){
                makeDumbellFixture(pos,ralienObject, updateRalienFixture);
            }else
            if(sp.name=="hellcat"){
                makePlaneFixture(pos,hellcatObject, updatePlaneFixture);
            }else
            if(sp.name=="sandrail"){
                makeCarFixture(pos,sandrailObject, updateCarFixture);
            }else
            if(sp.name=="ptboat"){
                makeCarFixture(pos,ptboatObject, updateBoatFixture);
            }
        }
    }
		
}
function updateRTTexture() {
//Set up texture parameters
/*
    gl.bindTexture(gl.TEXTURE_2D,g_rttTextures[0].texture);
    gl.bindTexture(gl.TEXTURE_2D,g_rttTextures[0].texture);
    gl.bindTexture(gl.TEXTURE_2D,terrainTextures.diffuseSampler.texture);		
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    Set up pixel store parameters
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    Upload the videoElement into the texture
    Initialize the texture to black firstl
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,
            512,512,0,
    gl.RGBA, gl.UNSIGNED_BYTE, null);
    g_videoElement.videoWidth, g_videoElement.videoHeight, 0,
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, g_videoElement);		
    gl.flush();
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA,gl.UNSIGNED_BYTE, g_videoElement);
    gl.texSubImage2D(gl.TEXTURE_2D, 0,0,0,gl.RGBA,gl.UNSIGNED_BYTE, g_videoElement);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
*/

}

function updateDynamicTexture() {
    if(!g_dynamicCanvas)
        return;
    gl.bindTexture(gl.TEXTURE_2D,hudTextObject.model.textures.diffuseSampler.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, g_dynamicCanvas);
    gl.bindTexture(gl.TEXTURE_2D, null);
}


function updateLocalVideoTexture() {
    if(g_videoElement.readyState<3) //Make sure video is available...
        return;
    gl.bindTexture(gl.TEXTURE_2D,billboardObject.model.textures.diffuseSampler.texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, g_videoElement);
    gl.bindTexture(gl.TEXTURE_2D, null);
}

function drawObject(obj){
    drawMesh(obj.model,obj.shaderConst,obj.shaderPer, obj.matrix,obj.depthShader);
}

function renderDeferred(srcDiffuse){
    var save_dif=fsQuadObject.model.textures.diffuseSampler.texture;
    var save_depth=fsQuadObject.model.textures.depthSampler.texture;
    var save_shadow=fsQuadObject.model.textures.shadowSampler.texture;
    fsQuadObject.model.textures.diffuseSampler.texture=g_rttTextures[srcDiffuse?srcDiffuse:diffuseRTTextureID];
    fsQuadObject.model.textures.depthSampler.texture=g_rttTextures[depthRTTextureID];
    fsQuadObject.model.textures.shadowSampler.texture=g_rttTextures[lightDepthRTTextureID];
		
    orthoLookAt([0,0,0], [0,0,-1], [0,1,0]);
    setViewProjection(view,projection);

    drawPrep(fsQuadObject.model,fsQuadObject.shaderConst);
    draw(fsQuadObject.model,fsQuadObject.shaderPer);
		
    fsQuadObject.model.textures.diffuseSampler.texture=save_dif;
    fsQuadObject.model.textures.depthSampler.texture=save_depth;
    fsQuadObject.model.textures.shadowSampler.texture=save_shadow;
}

function renderHuds(){
    hudTextObject.matrix=m4t0;
    for(var t=0;t<12;t++)m4t0[t]=viewInverse[t];
//    if(g_targetFixture&&g_targetFixture!=null){
//        for(var t=12;t<16;t++)m4t0[t]=g_targetFixture.matrix[t];
//        drawObject(hudTextObject);
//    }
    for(var pk in g_playerList){
        var p=g_playerList[pk];
        if(p.avatar){
            var fix = fixturesById[p.avatar];
            for(var t=12;t<16;t++)m4t0[t]=fix.matrix[t];
            
            var idx=p.index;
            var xpos=parseInt(idx/4);
            var ypos = (idx-(xpos*4)) * 0.2;
            xpos*=0.25;
            
            
            hudTextObject.shaderPer.uvOrigin[0]=xpos;//(Math.random()-0.5);
            hudTextObject.shaderPer.uvOrigin[1]=ypos;//(Math.random()-0.5);
            drawObject(hudTextObject);
        }
    }
}

function renderForward(){

    //Log("--Draw terrain---------------------------------------");
    if(g_renderPass != passLightDepth){
        drawPrep(skybox,skyConst);
        lightColor = skyPer.lightColor;
        
        fast.matrix4.scaling(m4t0, [1, 1, 1]);
        fast.matrix4.translation(m4t1, [g_eyePosition[0], 0, g_eyePosition[2]]);
        fast.matrix4.mul(world, m4t0, m4t1);

//fast.matrix4.copy(world,lightMatrix);
        
        setViewProjection(view,projection);
        setWorld(world);
        drawMesh(skybox,skyConst,skyPer,world);
    }else{
        //Light Depth Pass
        v3copy(lightWorldPos, g_eyePosition);    //Get inverse eye pos
        lightWorldPos[1]+=10.0;
        
        fast.matrix4.identity(world);
        setWorld(world);
        
        v3set(v3t0, 0.0,0.0,1.0);    //Get inverse eye pos
        orthoLookAt(lightWorldPos,g_eyePosition,  v3t0,viewVolume[0],viewVolume[2]);

        setViewProjection(orthoView,orthoProjection);
        //setWorld(world);
        
        fast.matrix4.identity(lightMatrix);
        
        v3set(v3t0, -0.5/viewVolume[0],0.0,0.0);    //light width
        v3set(v3t1, 0.0,0.0,0.5/viewVolume[1]);    //height
        v3set(v3t2, 0.0,1.0/viewVolume[2],0.0);     //depth

        matrixSetRowVector3(m4t1,0,v3t0);
        matrixSetRowVector3(m4t1,1,v3t1);
        matrixSetRowVector3(m4t1,2,v3t2);
        
        fast.matrix4.rotationY(m4t0, 0.0);
        fast.matrix4.mul(lightMatrix, m4t1, m4t0);

        
        v3copy(v3t3, lightWorldPos);    //Get inverse eye pos
        matrixSetRowVector3(lightMatrix,3,v3t3);
        
    }
    
    var tobj=terrains[minTx][minTy];
    drawPrep(tobj.model,tobj.shaderConst);
    for(var tx=minTx;tx<maxTx;tx++)
        for(var ty=minTy;ty<maxTy;ty++){
            var tobj=terrains[tx][ty];
            fast.matrix4.translation(world, [tx*g_terrainPatchSize, 0, ty*g_terrainPatchSize]);
            setWorld(world);
            draw(tobj.model,tobj.shaderPer);
        }

    //fast.matrix4.translation(world, [0,0,0]);
    //fast.matrix4.scaling(m4t0, [1, 1, 1]);
    
    for (var i = 0; i < fixtures.length; i++)   //Draw the physics fixture objects
        fixtures[i].draw();

    drawObject(borgObject);
		
    if(g_renderPass==passDiffuse)
    {
        gl.depthFunc(gl.LEQUAL);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.blendEquation(gl.BLEND_ADD);//COLOR);
        //gl.blendFunc(gl.SRC_COLOR,gl.DEST_COLOR);
        var saveDepth=waterObject.model.textures.depthSampler.texture;
        waterObject.model.textures.depthSampler.texture=g_rttTextures[depthRTTextureID];
        drawObject(waterObject);
        waterObject.model.textures.depthSampler.texture=saveDepth;

        if(g_renderDebugBodies)
            for (var i = 0; i < bodies.length; i++)bodies[i].draw(bodies[i].radius);
        g_debugObjectQueue.draw();
	
	
        drawObject(billboardObject);
        
        
        renderHuds();
        gl.disable(gl.BLEND);
        gl.depthFunc(gl.EQUAL);

    }//else if(g_renderPass!=passLightDepth)
     //   renderHuds();
}

function renderScene(pass,rtt,clear,rttIdx,shaderOverride,srcDiffuse){
    g_currentMesh=null;
    g_renderPass=pass;
    g_rttPass=(rtt==true)?true:false;
    g_rttIndex=(rttIdx==undefined)?0:rttIdx;
    if(shaderOverride!=undefined)g_passCustomShader=shaderOverride;
	
    if(g_rttPass){
        gl.bindFramebuffer(gl.FRAMEBUFFER,g_rttFramebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, g_rttTextures[g_rttIndex], 0);
        gl.viewport(0, 0, g_rttFramebuffer.width, g_rttFramebuffer.height);
    }
    if(clear==true)
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    if(g_renderPass==passDeferred){
        renderDeferred(srcDiffuse);
    }else{
        renderForward();
    }
    
    if(g_rttPass){
        gl.flush();
        //gl.bindTexture(gl.TEXTURE_2D, g_rttTextures[0]);
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    }
    g_passCustomShader=null;
}

/*
function compute3DSoundVolume(targ,radius){
    var rsqr=radius;
    v3subv(v3t0,targ,g_eyePosition);
    var dist=v3len(v3t0);
    if(dist>rsqr)return 0.0;
    var idx=(dist*(g_soundFalloff.length-1)*0.999)/rsqr;
    var rnd=parseInt(idx);
    var frac=idx-rnd;
    return (g_soundFalloff[rnd]*(1.0-frac))+(g_soundFalloff[rnd+1]*frac);
}
*/

function render(){

    //---------------------------------------RENDER SCENE
    gl.colorMask(true, true, true, true);
    gl.depthMask(true);
    gl.clearColor(0, 1, 0, 0.5);
    gl.clearDepth(1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);

    //gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    //gl.disable(gl.DEPTH_TEST);
    // gl.pushMatrix();
    var aspectRatio=canvas.clientWidth / canvas.clientHeight;
    fast.matrix4.perspective(projection, math.degToRad(90), aspectRatio, g_NearZ, g_FarZ);
    
    
    orthoLookAt([0,50,0], [0,-600,0], [0,0,1]);
    setViewProjection(view,projection);

    //Generate worldspace frustum...
    
    fast.matrix4.getAxis(v3t3, viewInverse, 0); // x
    fast.matrix4.getAxis(v3t4, viewInverse, 1); // y;
    fast.matrix4.getAxis(v3t5, viewInverse, 2); // z;

    matrixSetRowVector3(cameraMatrix,0,v3t3)
    matrixSetRowVector3(cameraMatrix,1,v3t4)
    matrixSetRowVector3(cameraMatrix,2,v3t5)
    matrixSetRowVector3(cameraMatrix,3,g_eyePosition);
    cameraMatrix[15]=1.0;
    
/*
        getDebugText();
        var dstr="vm<br>";
        for(var i=0;i<16;i++){
            dstr+=","+cameraMatrix[i];
            if((i%4)==3)dstr+="<br>";
        }
        debugTextElem.innerHTML=dstr;
*/
    
    //frustumFarCorners: frustumFarCorners,
    var brad=5.5;
    var farScale=500.0;
    var farDepth=500.0;
    fast.mulScalarVector(v3t0, -farDepth, v3t5);
    fast.mulScalarVector(v3t3, aspectRatio*farScale, v3t3);
    fast.mulScalarVector(v3t4, farScale, v3t4);
    fast.addVector(v3t0, g_eyePosition, v3t0);
    fast.addVector(v3t1, v3t0, v3t4);
    fast.addVector(v3t1, v3t1, v3t3);
//    g_debugObjectQueue.push({position:vec3(v3t1),radius:brad});
    matrixSetRowVector3(frustumFarCorners,0,v3t1);
    fast.subVector(v3t1, v3t0, v3t4);
    fast.addVector(v3t1, v3t1, v3t3);
//    g_debugObjectQueue.push({position:vec3(v3t1),radius:brad});
    matrixSetRowVector3(frustumFarCorners,1,v3t1);
    fast.addVector(v3t1, v3t0, v3t4);
    fast.subVector(v3t1, v3t1, v3t3);
//    g_debugObjectQueue.push({position:vec3(v3t1),radius:brad});
    matrixSetRowVector3(frustumFarCorners,2,v3t1);
    fast.subVector(v3t1, v3t0, v3t4);
    fast.subVector(v3t1, v3t1, v3t3);
//    g_debugObjectQueue.push({position:vec3(v3t1),radius:brad});
    matrixSetRowVector3(frustumFarCorners,3,v3t1);



//g_debugObjectQueue.push({position:vec3(lightWorldPos),radius:1.0});
    
    
    
    fast.matrix4.getAxis(v3t0, viewInverse, 0); // x
    fast.matrix4.getAxis(v3t1, viewInverse, 1); // y;
    fast.matrix4.getAxis(v3t2, viewInverse, 2); // z;
    fast.mulScalarVector(v3t0, 10, v3t0);
    fast.mulScalarVector(v3t1, 10, v3t1);
    fast.mulScalarVector(v3t2, 10, v3t2);
    
	
    screenToRT[0]=1.0/g_rttDim;///this.innerWidth;//g_rttDim/
    screenToRT[1]=1.0/g_rttDim;//0.5/this.innerHeight;

    if(g_graphicsQuality==0)
        renderScene(passDiffuse,false,true,undefined); //Render diffuse color map
    else{
        var depthShader=getDepthShader();
        viewVolume[2]=50.0;
        
        renderScene(passLightDepth,true,true,lightDepthRTTextureID);	//Render shadow depth map

        viewVolume[2]=500.0;
        renderScene(passDepth,true,true,depthRTTextureID);		//Render view depth map
        
        gl.depthFunc(gl.EQUAL);
        gl.depthMask(false);
        renderScene(passDiffuse,true,false,diffuseRTTextureID); //Render diffuse color map
        gl.disable(gl.DEPTH_TEST);
        gl.disable(gl.BLEND);

        if(g_graphicsQuality==2)
        {
            renderScene(passDeferred,true,false,diffuse2RTTextureID,getDefShadowShader());
            renderScene(passDeferred,true,false,depthRTTextureID,getDOFXShader(),diffuse2RTTextureID);		//Render DOF X pass
            renderScene(passDeferred,false,false,0,getDOFYShader(),diffuse2RTTextureID);			//Render DOF Y pass to framebuffer    
   //       renderScene(passDeferred,false,false,diffuseRTTextureID,getDefShadowShader());
   //       renderScene(passDeferred,true,false,depthRTTextureID,getDOFXShader());		//Render DOF X pass
   //       renderScene(passDeferred,false,false,0,getDOFYShader());			//Render DOF Y pass to framebuffer    
   
   
        }else{
            renderScene(passDeferred,true,false,depthRTTextureID,getDOFXShader());		//Render DOF X pass
            renderScene(passDeferred,false,false,0,getDOFYShader());			//Render DOF Y pass to framebuffer    
        }
    }
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    g_debugObjectQueue.reset();
    // turn off logging after 1 frame.
    g_logGLCalls = false;
/*
    //gl.popMatrix();
    //Set the alpha to 255.
    //gl.colorMask(false, false, false, true);
    //gl.clearColor(0,0,0,1);
    //gl.clear(gl.COLOR_BUFFER_BIT);
    //g_particleSystem.draw(viewProjection, world, viewInverse);
                    var vertices = new Float32Array([
    0.0, 1.0, 4.0,
    -1.0, -1.0, 4.0,
    1.0, -1.0, 4.0
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC);
*/   
}

var sumTime=0.0;
var avgAt1k=0;
function gameLoop() { //17H X7Y2
 
    if(g_appBroken)return;
    g_currentMesh = null;
    ++g_frameCount;
    if (!g_drawOnce) {
        tdl.webgl.requestAnimationFrame(gameLoop, canvas);
    }
    var now = (new Date()).getTime() * 0.001;
    var elapsedTime;
    if (then == 0.0) {
        elapsedTime = 0.0;
    } else {
        elapsedTime = now - then;
    }
    then = now;
    
    g_fpsTimer.update(elapsedTime);
    if(!audio.allSoundsLoaded() || !allTexturesLoaded())
    {
        var ldPct=parseInt((audio.loadedPercentage()+textureLoadedPercentage())*0.5);
        fpsElem.innerHTML = "loading:"+ldPct;
    //return;
    }else{
        audio.harvestDeadSounds();
        audio.setListenerParams(g_eyePosition);
        g_fpsDiv.style[g_hudTransformProperty]='rotateY(' + (g_hudSpinDelta++ % 360) + 'deg)';
        fpsElem.innerHTML = "hz:"+g_fpsTimer.averageFPS;
    }
    //-------------------------------- SIMULATION UPDATE
    var simFrameTime=(1.0/60.0);
    var nextTime=clock+elapsedTime;
        var steps=0;
        var maxSteps=8;
    //if (!g_paused)
    {
        while(clock<nextTime && steps<maxSteps){
            if(g_targetFixture&&g_targetFixture!=null)
                updateAvatarControls(g_targetFixture);
            if (!g_paused)
                updateSim();
            updateCamera();
            g_simTime += simFrameTime;
            clock+=simFrameTime;
            steps++;
        }
        if(clock<nextTime)clock=nextTime;//Lose frames if we drop below 10 fps
    }
    g_timers[0]=g_simTime;
    v3set(v3t0,billboardObject.matrix[12],billboardObject.matrix[13],billboardObject.matrix[14]);
    g_videoElement.volume=audio.calcPositionalVolume3d(v3t0,50.0);
    //g_videoElement.volume=compute3DSoundVolume(v3t0,50.0);
    
    
    if(g_showHelp&&debugTextElem){
        var endSim = (new Date()).getTime() * 0.001;
        sumTime+=(endSim-now);
        var avgTime=parseInt((sumTime/g_frameCount)*100000.0);
        debugTextElem.innerHTML="msimtime:"+avgTime;//(endSim-now)*100000.0);
                
        if(steps>=maxSteps)
            debugTextElem.innerHTML+=":"+steps;
        if(g_frameCount===1000)
            avgAt1k=avgTime;
        debugTextElem.innerHTML+=":"+avgAt1k;
        debugTextElem.innerHTML+=":"+g_frameCount;
        
    }
    render();

    if(g_localPlayer&&g_localPlayer.spectating==true)   ///We are not driving...
        return;

    if((g_frameCount%100)==0 && (g_targetFixture && g_targetFixture!=null)){
        sendFixtureToServer(g_targetFixture);
    }
}




/*********** NETWORKING *********/

var g_playerList={};
var g_localPlayer=undefined;
var g_networkId=null;
var iosocket;


function rebuildPlayerList()
{   
    var elem=document.getElementById("playerList");
    var str="<list>PlayerList:</br>\n";
    for(var key in g_playerList){
        var p=g_playerList[key];
        str+="<li>"+p.nick+"</li>\n";
    }
    str+="</list>";
    elem.innerHTML=str;
}


function connectToChatServer()
{
    var incomingChatElem=document.getElementById('incomingChatMessages');
    var outgoingChatElem=document.getElementById('outgoingChatMessage');
    iosocket = io.connect("/");//:3001");
    iosocket.on('connect', function () {
        incomingChatElem.innerHTML+='<li>Connected</li>';
        iosocket.on('video', videoStreamHandler);
        iosocket.on('welcome', function(data) {
            console.log("got welcome");
            g_networkId = data;
            iosocket.emit('control',g_targetFixture.id);    //Attempt to take control of our targeted fixture
        });
        iosocket.on('players', function(players) {
            g_playerList = players;
            g_localPlayer=g_playerList[g_networkId];
            rebuildPlayerList();
        });
        iosocket.on('sim', function(data) {
            recvFromServer(data);
        });
        iosocket.on('chat', function(msg) {
            var player=g_playerList[msg.id];
            if(player){
                player.chat=msg.message;
                incomingChatElem.innerHTML+='<li>'+player.name+":"+player.chat+'</li>';
                renderPlayerImage(player,getPlayerImageBuffer(player.id));
                updateDynamicTexture();
            }
        });
        iosocket.on('playerState', function(state) {
            var plr=g_playerList[state.id];
            for(var k in state)plr[k]=state[k];
        });

        iosocket.on('disconnect', function() {incomingChatElem.innerHTML+='<li>Disconnected</li>';});
    });
    outgoingChatElem.onkeypress=function(event) {
        if(event.which == 13) {
            doPreventDefault(event);

            iosocket.emit('chat',outgoingChatElem.value);

            var ourPlayer=g_playerList[g_networkId];
            if(ourPlayer){
                ourPlayer.chat=outgoingChatElem.value;
                incomingChatElem.innerHTML+='<li>'+ourPlayer.nick+":"+outgoingChatElem.value+'</li>';
            }else{
                incomingChatElem.innerHTML+='<li>Not connected:'+outgoingChatElem.value+'</li>';                
            }
            outgoingChatElem.value='';
            outgoingChatElem.blur();
            /*
            setTimeout(new function(){
                renderPlayerImage(ourPlayer,getPlayerImageBuffer(ourPlayer.id));
                updateDynamicTexture();
                },1000);
            */
        }
    };
};
