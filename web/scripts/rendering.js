/*
 Copyright 2011 - Michael Schlachter
 All rights reserved.
 Please contact me at admin@vectorslave.com for usage info
*/

var g_renderBuffer;
var g_rttFramebuffer=null;
var g_rttTextures=[null,null,null,null];
var g_rttDepthTexture;
var	g_rttIndex=0;
var g_rttDim=1024;
var g_maxRTTDim=4096;
var g_currentMesh = null;
var g_appBroken = false;
// pre-allocate a bunch of arrays
var orthoWorld = new Float32Array(16);
var orthoView = new Float32Array(16);
var orthoProjection = new Float32Array(16);

var orthoWorldInverse = new Float32Array(16);
var orthoViewProjection = new Float32Array(16);
var orthoWorldViewProjection = new Float32Array(16);

var orthoWorldInverse = new Float32Array(16);
var orthoViewInverse = new Float32Array(16);
var orthoProjectionInverse = new Float32Array(16);
var orthoViewProjectionInverse = new Float32Array(16);
var orthoWorldInverseTranspose = new Float32Array(16);

var screenToRT=new Float32Array(2);
var world = new Float32Array(16);
var view = new Float32Array(16);
var projection = new Float32Array(16);
var cameraMatrix = new Float32Array(16);
var frustumFarCorners = new Float32Array(16);

var viewProjection = new Float32Array(16);
var worldViewProjection = new Float32Array(16);
var worldViewProjectionInverse = new Float32Array(16);

var viewInverse = new Float32Array(16);
var projectionInverse = new Float32Array(16);
var viewProjectionInverse = new Float32Array(16);
var worldInverse = new Float32Array(16);
var worldInverseTranspose = new Float32Array(16);
var viewInverseTranspose = new Float32Array(16);

var viewVolume = new Array(3);//farPlane=500.0;
v3set(viewVolume,20.0,20.0,100.0);
var g_eyePosition = new Array(3);
var g_eyeVelocity = vec3f(0,0,0);
var g_lastEyePosition = new Array(3);
g_eyePosition[2] = 5;
var lookVector = vec3f(0, 0, 1.0);
var targetPosition = vec3f(0,0,0);//new Array(3);
var g_targetFixture = null;
var g_cameraTargetList=[];
var g_cameraTargetIndex=0;
var g_targetBody = 45;
var targetFixture = 0;
var targetOffset = [0, 2.0, 7.0];
var targetLocalOffset = [0, 2.0, 5.0];
var up = [0, 1, 0];
var lightWorldPos = new Float32Array(3);
var lightMatrix = new Float32Array(16);
var v3t0 = new Array(3);
var v3t1 = new Array(3);
var v3t2 = new Array(3);
var v3t3 = new Array(3);
var v3t4 = new Array(3);
var v3t5 = new Array(3);
var v3t6 = new Array(3);
var v3t7 = new Array(3);
var v3t8 = new Array(3);
var v3t9 = new Array(3);
var v3t10 = new Array(3);
var v3t11 = new Array(3);
var v3t12 = new Array(3);
var v3t13 = new Array(3);
var v3t14 = new Array(3);
var v3t15 = new Array(3);
var m4t0 = new Array(16);
var m4t1 = new Array(16);
var m4t2 = new Array(16);
var m4t3 = new Array(16);
var m4t4 = new Array(16);
var m4t5 = new Array(16);
var m4t6 = new Array(16);
var m4t7 = new Array(16);
var zero4 = new Array(4);
var one4 = [1, 1, 1, 1];

var g_textureLoadRequestCount=0;
var g_texturesLoadedCount=0;

var g_textureDB={};

var passDiffuse = 0;
var passTransparent = 1;
var passDepth = 2;
var passLightDepth = 3;
var passDeferred = 4;


var g_rttPass=false;
var g_passCustomShader=null;
var g_renderPass=-1;

var g_scriptCache={};

function textureLoaded(){
    g_texturesLoadedCount++;
}

function textureLoadedPercentage(){
    if(g_texturesLoadedCount==g_textureLoadRequestCount)return 100.0;
    return g_texturesLoadedCount*100.0/g_textureLoadRequestCount;
}

function allTexturesLoaded(){
    return (g_texturesLoadedCount>=g_textureLoadRequestCount)?true:false;
}

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

function findImgElemBySrc(srcVal){
    for(var imgIdx in document.images){
        var img=document.images[imgIdx];
        if(img.src===undefined)
            continue;
        if(endsWith(img.src,srcVal))
            return img;
    }
    return null;
}

function textureLoad(str){
    if(str instanceof Array){
        if(g_textureDB[str[0]]!=undefined)
            return g_textureDB[str[0]];
        else{
            var imgElem=str;//findImgElemBySrc(str);
            if(imgElem===null)imgElem=str;
            //g_textureLoadRequestCount++;
            g_textureDB[str[0]]=tdl.textures.loadTexture(imgElem,false,textureLoaded);	
            return g_textureDB[str[0]];
        }
    }else if(g_textureDB[str]!=undefined){
        return g_textureDB[str];
    }else{
        g_textureLoadRequestCount++;
        var imgElem=str;//findImgElemBySrc(str);
        if(imgElem===null)imgElem=str;
        g_textureDB[str]=tdl.textures.loadTexture(imgElem,false,textureLoaded);
        return g_textureDB[str];
    }		
}

function findP2GreaterThanV(v){
    var i=1;
    while(i<v)i<<=1;
    return i;
}

function initRTT() {
    var tw=findP2GreaterThanV(this.innerWidth);
    var th=findP2GreaterThanV(this.innerHeight);

    var mt=tw>th?tw:th;
    if(mt>g_maxRTTDim)
        mt=g_maxRTTDim;
    g_rttDim=mt;
    g_renderBuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, g_renderBuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, mt, mt);
	
    var i=0;
    g_rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, g_rttFramebuffer);
    g_rttFramebuffer.width = mt;
    g_rttFramebuffer.height = mt;

    for( i=0;i<4;i++){
        g_rttTextures[i] = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, g_rttTextures[i]);
        if(i==0){   //0 is diffuse map.. allow filtering...
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        }else{      //Screen depth+light depth get no filtering...
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);                    
        }
        //gl.generateMipmap(gl.TEXTURE_2D);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, mt, mt, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        //gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, g_rttTextures[i], 0);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, g_renderBuffer);
    }
    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
}

function drawPrep(model,consts){
    if (model !== g_currentMesh) {
        if(g_renderPass==passDepth||g_renderPass==passLightDepth){

            if(model.definition!=undefined)
                g_passCustomShader=model.definition.depthShader;
            else
                g_passCustomShader=getDepthShader();
        }
        if(g_passCustomShader!=null){
            model.saveProgram=model.program;
            if(g_passCustomShader.program!=null){
                model.program=g_passCustomShader.program;
                model.drawPrep(g_passCustomShader.consts);
            }
        }else{
            if(model.program!=null)
                model.drawPrep(consts);
        }
        g_currentMesh = model;
    }
}

function draw(model,per,zshader){
    if(g_passCustomShader!=null){
        model.draw(per);//g_passCustomShader.per);
        model.program=model.saveProgram;
    }else{
        model.draw(per);
    }
}

function orthoLookAt(at,from,up,rng,dpth){

    fast.matrix4.translation(orthoWorld, [0,0,0]);
    fast.matrix4.inverse(orthoWorldInverse, world);
    fast.matrix4.transpose(orthoWorldInverseTranspose, orthoWorldInverse);
    var cw=0.5;//canvas.clientWidth*0.5;
    var ch=0.5;//canvas.clientHeight*0.5;
    if(rng)cw=ch=rng;
    fast.matrix4.ortho(orthoProjection, -cw,cw,-ch,ch, 0.0, dpth?dpth:500.0);
    fast.matrix4.lookAt( orthoView, at, from, up);

    fast.matrix4.inverse(orthoViewInverse, orthoView);
    fast.matrix4.inverse(orthoProjectionInverse, orthoProjection);
    fast.matrix4.mul(orthoViewProjection, orthoView, orthoProjection);
    fast.matrix4.inverse(orthoViewProjectionInverse, orthoViewProjection);
    fast.matrix4.mul(orthoWorldViewProjection, orthoWorld, orthoViewProjection);
}

function setViewProjection(view,projection){
    
    fast.matrix4.inverse(viewInverse, view);
    fast.matrix4.transpose(viewInverseTranspose,viewInverse);
    fast.matrix4.inverse(projectionInverse, projection);
    fast.matrix4.mul(viewProjection, view, projection);
    fast.matrix4.inverse(viewProjectionInverse, viewProjection);
}

function setWorld(nworld){
    fast.matrix4.copy(world,nworld);
    fast.matrix4.mul(worldViewProjection, world, viewProjection);
    fast.matrix4.inverse(worldViewProjectionInverse,worldViewProjection);
    fast.matrix4.inverse(worldInverse, world);
    fast.matrix4.transpose(worldInverseTranspose, worldInverse);
}

function drawMesh(mesh, meshConst, meshPer, matrix, zshader) {
    setWorld(matrix);
    if(g_passCustomShader!=null){
        drawPrep(mesh,g_passCustomShader.consts, zshader);
//        draw(mesh,g_passCustomShader.per);
    }else
    {
        drawPrep(mesh,meshConst, zshader);
    }
    draw(mesh,meshPer);
 }

function drawDebugSphere(position,radius){
    fast.matrix4.scaling(world, [radius,radius,radius]);
    fast.matrix4.setTranslation(world, position);
    drawMesh(sphere, sphereConst, spherePer, world);
}

var g_debugObjectQueue={
    count:0,
    head:0,
    top:0,
    queue:[],
    size:500,
    draw: function(){
        for(var i=0;i<this.count;i++){
            var sp=this.get(i);
            drawDebugSphere(sp.position,sp.radius);
        }
    },
    push: function(obj){
        this.queue[this.top++]=obj;
        this.top=this.top%this.size;
        this.count++;
        if(this.count>this.size){
            this.count=this.size;
            this.head=(this.head+1)%this.size;
        }
        return obj;
    },
    get: function(pos){
        return this.queue[(this.head+pos)%this.size];
    },
    reset: function(){            
        this.count=0;
        this.head=0;
        this.top=0;
    }
}

function createModelArrays(base,remap,rescale,trans){
    var arrays = base;
    var narrays = {
        position: new tdl.primitives.AttribBuffer(3, arrays.vertices.length / 3),
        normal: new tdl.primitives.AttribBuffer(3, arrays.normals.length / 3),
        texCoord: new tdl.primitives.AttribBuffer(2, arrays.texCoords.length / 2),
        indices: new tdl.primitives.AttribBuffer(3, arrays.indices.length / 3, 'Uint16Array')
    };
    var i;
    if(remap==undefined)remap=[0,1,2];
    if(rescale==undefined)rescale=[1,1,1];
    if(trans==undefined)trans=[0,0,0];
    for (i = 0; i < arrays.vertices.length; i += 3) narrays.position.push([(arrays.vertices[i+remap[0]]*rescale[0])+trans[0], (arrays.vertices[i + remap[1]]*rescale[1])+trans[1], (arrays.vertices[i + remap[2]]*rescale[2])+trans[2]]);
    for (i = 0; i < arrays.normals.length; i += 3) narrays.normal.push([arrays.normals[i+remap[0]], arrays.normals[i + remap[1]], arrays.normals[i + remap[2]]]);
    for (i = 0; i < arrays.texCoords.length; i += 2) narrays.texCoord.push([arrays.texCoords[i], arrays.texCoords[i + 1]]);
    for (i = 0; i < arrays.indices.length; i += 3) narrays.indices.push([arrays.indices[i], arrays.indices[i + 1], arrays.indices[i + 2]]);
    return narrays;
}

function setupModel(base,material,remap,rescale,trans,mode){
    var narrays=createModelArrays(base,remap,rescale,trans);
    var textures=material.textures;
    var program=material.program;
    return new tdl.models.Model(program, narrays, textures,mode);
}

function v3simpleTrans(vl,remap,rescale,trans){
    if(remap==undefined)remap=[0,1,2];
    if(rescale==undefined)rescale=[1,1,1];
    if(trans==undefined)trans=[0,0,0];
    for(var i=0;i<vl.length;i++){
        var v=vl[i];
        v3set(v,(v[remap[0]]*rescale[0])+trans[0], (v[remap[1]]*rescale[1])+trans[1], (v[remap[2]]*rescale[2])+trans[2]);
    }
}

function m16simpleTrans(mat,remap,rescale,trans){
    if(remap==undefined)remap=[0,1,2,3];
    if(rescale==undefined)rescale=[1,1,1,1];
    if(trans==undefined)trans=[0,0,0,0];
    var v=v3t0;
    var vx=remap[0];
    var vy=remap[1];
    var vz=remap[2];
    var nmat=new Float32Array([
        //mat[vx],mat[vx+1],mat[vx+2],mat[vx+3],
        //mat[vy],mat[vy+1],mat[vy+2],mat[vy+3],
        //mat[vz],mat[vz+1],mat[vz+2],mat[vz+3],
        //mat[0+vx],mat[0+vy],mat[0+vz],mat[3],
        //mat[4+vx],mat[4+vy],mat[4+vz],mat[7],
        //mat[8+vx],mat[8+vy],mat[8+vz],mat[11],
        mat[0+0],mat[0+1],mat[0+2],mat[3],
        mat[4+0],mat[4+1],mat[4+2],mat[7],
        mat[8+0],mat[8+1],mat[8+2],mat[11],
        (mat[12+remap[0]]*rescale[0])+trans[0],(mat[12+remap[1]]*rescale[1])+trans[1],(mat[12+remap[2]]*rescale[2])+trans[2],mat[15]
        ]);
    for(var i=0;i<16;i++)mat[i]=nmat[i];
}


function setupStaticModel(base,material,remap,rescale,trans,mode){
    var arrays=createModelArrays(base,remap,rescale,trans);
    var indices = arrays.indices.buffer;
    var ect = indices.length;
    var startT = new Date().getTime();
    var npos = arrays.position.buffer;
    for (i = 0; i < ect; i += 3) {
        var vi = indices[i] * 3;
        var v0=vec3([npos[vi], npos[vi + 1], npos[vi + 2]]);
        vi = indices[i + 1] * 3;
        var v1=vec3([npos[vi], npos[vi + 1], npos[vi + 2]]);
        vi = indices[i + 2] * 3;
        var v2=vec3([npos[vi], npos[vi + 1], npos[vi + 2]]);
        colGridAddTri(worldGrid, colTri(v0,v1,v2));
    }
    var textures=material.textures;
    var program=material.program;
    return new tdl.models.Model(program, arrays, textures,mode);
}

function ValidateNoneOfTheArgsAreUndefined(functionName, args) {
    var ii;
    for (ii = 0; ii < args.length; ++ii) {
        if (args[ii] === undefined) {
            tdl.error("undefined passed to gl." + functionName + "(" + tdl.webgl.glFunctionArgsToString(functionName, args) + ")");
        }
    }
}

function Log(msg) {
    if (g_logGLCalls) {
        tdl.log(msg);
    }
}

function LogGLCall(functionName, args) {
    if (g_logGLCalls) {
        ValidateNoneOfTheArgsAreUndefined(functionName, args);
        tdl.log("gl." + functionName + "(" + tdl.webgl.glFunctionArgsToString(functionName, args) + ")");
    }
}

function getScriptText(tagName) {
    if(Object.keys(g_scriptCache).length!=0)
        return g_scriptCache[tagName];

    var scriptElem=document.getElementById("shaderScript");
    var ctext=null;
    if(scriptElem!=null){
        //Load the scripts from a script element...
        //This is used to embed shaders directly in the root html for the app
        ctext=scriptElem.text;
    }
    else{
        //Load the scripts from an iframe
        //This is used to load shaders from an iframe in the document, that srces the shader src
        scriptElem=document.getElementById("shaderIFrame");
        ctext=scriptElem.contentWindow.document.body.innerHTML;
    }
    var chunks=ctext.split("SCRIPT='");
    for(var ckey in chunks){
        var chunk=chunks[ckey];
        var sstart=chunk.indexOf("';");
        var sname=chunk.substring(0,sstart);
        chunk=chunk.substring(sstart+3);
        if(chunk!=="" && sname!=="")
            g_scriptCache[sname]=chunk;
    }
    return g_scriptCache[tagName];
}

function createProgramFromTags(vertexTagId, fragmentTagId) {
    var shdr=tdl.programs.loadProgram(getScriptText(vertexTagId), getScriptText(fragmentTagId));
    //    document.getElementById(vertexTagId).text, document.getElementById(fragmentTagId).text);
    if(!shdr){
        alert("Shader error:"+tdl.programs.lastError);
        g_appBroken=true;
    }
    return shdr;
}

function v3slice(vec,arry,start){
    vec[0]=arry[start];
    vec[1]=arry[start+1];
    vec[2]=arry[start+2];
}

function setupPath(base) {
    var path=Array(parseInt(base.length/3));
    for(var i=0;i<path.length;i++){
        path[i]=[0,0,0];
        v3slice(path[i],base,i*3);
    }
    v3simpleTrans(path,g_terrainVertexRemap,g_terrainVertexScale,g_terrainVertexTranslation);
    return path;
}

function buildObjectFromDef(def,remap,resize,repos){
    for(var t in def.material.textures){
        def.material.textures[t]=textureLoad(def.material.textures[t]);
    }
    
    def.material.program = createProgramFromTags(def.vertexShader,def.fragmentShader);//'ralienVertexShader', 'ralienFragmentShader');
    if(def.depthVertexShader==undefined&&def.depthFragmentShader==undefined){
        //No depth shader defined, so use default depth shader...
        def.depthShader=getDepthShader();//createProgramFromTags(def.vertexShader,def.fragmentShader);
    }else{
        //Build the custom depth shader...
        def.depthShader={};
        def.depthShader.program=createProgramFromTags(
            (def.depthVertexShader!=undefined)?def.depthVertexShader:"depthOnlyVertexShader",
            (def.depthFragmentShader!=undefined)?def.depthFragmentShader:"depthOnlyFragmentShader");
        def.depthShader.consts=def.shaderConst;
        def.depthShader.per=def.shaderPer;
    }
    
    var bexp=BlenderExport[def.exportName];
    if(def.isStatic){
        def.model = setupStaticModel(bexp,def.material,remap,resize,repos);
    }else
        def.model = setupModel(bexp,def.material,remap,resize,repos);
    def.model.definition=def;
    if(bexp.matrix!=undefined){
        def.matrix=new Float32Array(bexp.matrix);
        m16simpleTrans(def.matrix,remap,resize,repos);
    }else{
        def.matrix=tdl.math.matrix4.identity();
    }
    return def;
}
