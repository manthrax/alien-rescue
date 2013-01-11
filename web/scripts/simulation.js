/*
 Copyright 2011 - Michael Schlachter
 All rights reserved.
 Please contact me at admin@vectorslave.com for usage info
*/


var gravity = [0, -0.0098, 0];
var bodies = [];
var freeBodies=null;
var activeBodies=null;


var constraints = [];
var freeConstraints=null;
var activeConstraints=null;

function newConstraint(){
    
    
}

function allocConstraint(){
    if(freeConstraints&&freeConstraints!=null){
        var cnst=freeConstraints;
        freeConstraints=cnst.next;
        cnst.next=activeConstraints;
        activeConstraints=cnst;
        return cnst;
    }
    var cnst=newConstraint();
    constraints.push(cnst);
    cnst.next=activeConstraints;
    activeConstraints=cnst;
    return cnst;
}


var anchorConstraints = [];
var aphasicConstraints = [];
var fixtures = [];

var g_queryRgn={minu:0,maxu:0,minv:0,maxv:0};
var g_queryBuffer=[];
var g_collisionBuffer=[];


var g_freeContacts=null;

function allocContact(){
	if(g_freeContacts==null){
		var col={
			next:null,
			time:0.0,
			position:[0,0,0],
			normal:[0,1,0],
			body:null
		};
		return col;
	}
	var col=g_freeContacts;
	g_freeContacts=col.next;
	col.next=null;
	return col;
}

function freeContactList(col){
	var n=null;
	do{
		n=col.next;
		col.next=g_freeContacts;
		g_freeContacts=col;
		col=n;
	}while(n);
}

var g_timers=new Float32Array([0,0,0]);
var g_simTime = 0.0;
var g_seaLevel = 14.0*160.0/30;

function colGrid() {
    return {
        origin: [0, 0, 0],
        u: [1.0, 0, 0],
        v: [0, 0, 1.0],
        grid: [],
        triangleCount:0,
        triangles: new Array(2000000),
        bounds: {
            min: [0, 0, 0],
            max: [0, 0, 0]
        }
    }
}

function AABox(box) {
    return {
        min: vec3(box.min),
        max: vec3(box.max)
    };
}

function colTri(v0, v1, v2) {
    var edgeVectors = [v3normalize(v3subv(v3t0,v1, v0)), v3normalize(v3subv(v3t0,v2, v1)), v3normalize(v3subv(v3t0,v0, v2))];
    var faceNormal = v3normalize(v3crossv(v3t0,edgeVectors[0], edgeVectors[1]));
    
    var verts = [v0, v1, v2];
    var bounds = {
        min: vec3(v0),
        max: vec3(v0)
    };
    AABAccum(bounds, v1);
    AABAccum(bounds, v2);
    var edgeNormals=[v3cross(faceNormal,edgeVectors[0]), v3cross(faceNormal,edgeVectors[1]), v3cross(faceNormal,edgeVectors[2])];
    /*
    var tmp=v3t0;
    var sgns=0;
    for(var i=0;i<3;i++){
        var op=(i+2)%3;
        v3subv(tmp,verts[op],verts[i]);
        if(v3dot(tmp,edgeNormals[i])<0.0)
            sgns|=1<<i;
        //g_debugObjectQueue.push({position:vec3(ck.verts[op]),radius:1.0});
    }
    if(faceNormal[1]<0.0){
        console.log("Bad face normal!");
    }
    if(sgns!=0){//&&sgns!=0){
        console.log("Bad tri edge normals!");
    }//else
    //    console.log("Good tri edge normals!");
    */
    return {
        type: 0,
        selected: false,
        bounds: bounds,
        verts: verts,
        edgeVectors: edgeVectors,
        faceNormal: faceNormal,
        edgeNormals: edgeNormals
    };
}
/*

function testIntersectionTriSphere(_triPts,
								 _triNormal,
								 _sphere,
								 _sphereVel,
								 _distTravel,
								 _reaction)
{
	var i;
	nvelo = vec3(_sphereVel);
	nvelo.normalize();

	if (v3dot(_triNormal,nvelo) > -0.001)
		return false;

	minDist = FLT_MAX;
	var reaction;
	var col = -1;
	_distTravel = FLT_MAX;

	Plane plane;
	plane.fromPointAndNormal(*_triPts[0], _triNormal);

	// pass1: sphere VS plane
	float h = plane.dist( _sphere.center );
	if (h < -_sphere.radius)
		return OZFALSE;

	if (h > _sphere.radius) {
		h -= _sphere.radius;
		float dot = _triNormal.dot(nvelo);
		if (dot != 0) {
			float t = -h / dot;
			Vec3f onPlane = _sphere.center + nvelo * t;
			if (isPointInsideTriangle( *_triPts[0], *_triPts[1], *_triPts[2], onPlane)) {
				if (t < _distTravel) {
					_distTravel = t;
					if (_reaction)
						*_reaction = _triNormal;
					col = 0;
				}
			}
		}
	}

	// pass2: sphere VS triangle vertices
	for (i = 0; i < 3; i++) {
		Vec3f seg_pt0 = *_triPts[i];
		Vec3f seg_pt1 = seg_pt0 - nvelo;
		Vec3f v = seg_pt1 - seg_pt0;

		float inter1=FLT_MAX, inter2=FLT_MAX;
		int nbInter;
		ozbool res = testIntersectionSphereLine(_sphere, seg_pt0, seg_pt1, &nbInter, &inter1, &inter2);
		if (res == OZFALSE)
			continue;

		float t = inter1;
		if (inter2 < t)
			t = inter2;

		if (t < 0)
			continue;

		if (t < _distTravel) {
			_distTravel = t;
			Vec3f onSphere = seg_pt0 + v * t;
			if (_reaction)
				*_reaction = _sphere.center - onSphere;
			col = 1;
		}
	}

	// pass3: sphere VS triangle edges
	for (i = 0; i < 3; i++) {
		Vec3f edge0 = *_triPts[i];
		int j = i + 1;
		if (j == 3)
			j = 0;
		Vec3f edge1 = *_triPts[j];

		Plane plane;
		plane.fromPoints(edge0, edge1, edge1 - nvelo);
		float d = plane.dist(_sphere.center);
		if (d > _sphere.radius || d < -_sphere.radius)
			continue;

		float srr = _sphere.radius * _sphere.radius;
		float r = sqrtf(srr - d*d);

		Vec3f pt0 = plane.project(_sphere.center); // center of the sphere slice (a circle)

		Vec3f onLine;
		float h = distancePointToLine(pt0, edge0, edge1, &onLine);
		Vec3f v = onLine - pt0;
		v.normalize();
		Vec3f pt1 = v * r + pt0; // point on the sphere that will maybe collide with the edge

		int a0 = 0, a1 = 1;
		float pl_x = fabsf(plane.a);
		float pl_y = fabsf(plane.b);
		float pl_z = fabsf(plane.c);
		if (pl_x > pl_y && pl_x > pl_z) {
			a0 = 1;
			a1 = 2;
		}
		else {
			if (pl_y > pl_z) {
				a0 = 0;
				a1 = 2;
			}
		}

		Vec3f vv = pt1 + nvelo;

		float t;
		ozbool res = testIntersectionLineLine(  Vec2f(pt1[a0], pt1[a1]),
												Vec2f(vv[a0], vv[a1]),
												Vec2f(edge0[a0], edge0[a1]),
												Vec2f(edge1[a0], edge1[a1]),
												&t);
		if (!res || t < 0)
			continue;

		Vec3f inter = pt1 + nvelo * t;

		Vec3f r1 = edge0 - inter;
		Vec3f r2 = edge1 - inter;
		if (r1.dot(r2) > 0)
			continue;

		if (t > _distTravel)
			continue;

		_distTravel = t;
		if (_reaction)
			*_reaction = _sphere.center - pt1;
		col = 2;
	}

	if (_reaction && col != -1)
		_reaction->normalize();

	return col == -1 ? OZFALSE : OZTRUE;
}

 */
function AABAccum(box, va) {
    for (var i = 0; i < 3; i++) {
        if (box.min[i] > va[i]) box.min[i] = va[i];
        if (box.max[i] < va[i]) box.max[i] = va[i];
    }
}


function colGridGetPoint(rpt,cgrid, point) {
    var gmin = v3subv(v3t0,point, cgrid.origin);
    rpt[0]=parseInt(v3dot(gmin, cgrid.u));
    rpt[1]=parseInt(v3dot(gmin, cgrid.v));
    return rpt;
}

var v3gt0 = Array(3);//new Float32Array(3);
var v3gt1 = Array(3);//new Float32Array(3);

function colGridGetRegion(cgrid, bounds) {
    var gmin = v3subv(v3gt0,bounds.min, cgrid.origin);
    var gmax = v3subv(v3gt1,bounds.max, cgrid.origin);
    g_queryRgn.minu=parseInt(v3dot(gmin, cgrid.u));
    g_queryRgn.minv=parseInt(v3dot(gmin, cgrid.v));
    g_queryRgn.maxu=parseInt(v3dot(gmax, cgrid.u));
    g_queryRgn.maxv=parseInt(v3dot(gmax, cgrid.v));
	return g_queryRgn;
}


function colGridAddTri(cgrid, tri) {
    if (cgrid.bounds == undefined)
        cgrid.bounds = AABox(tri.bounds);
    else {
        AABAccum(cgrid.bounds, tri.bounds.min);
        AABAccum(cgrid.bounds, tri.bounds.max);
    }
    cgrid.triangles[cgrid.triangleCount++]=tri;
}

function colGridGenerate(cgrid, subdepth) {
    cgrid.origin = vec3(cgrid.bounds.min);
    var dim = v3sub(cgrid.bounds.max, cgrid.bounds.min);
    var du = v3dot(dim, cgrid.u);
    var dv = v3dot(dim, cgrid.v);
    cgrid.u = v3mul(cgrid.u, subdepth / du);
    cgrid.v = v3mul(cgrid.v, subdepth / dv);

    for (var i = 0; i < cgrid.triangleCount; i++) {
        var tri = cgrid.triangles[i];
        var rgn = colGridGetRegion(cgrid, tri.bounds);
        var grid = cgrid.grid;
        for (var u = rgn.minu; u <= rgn.maxu; u++)
        for (var v = rgn.minv; v <= rgn.maxv; v++) {
            if (grid[v] == undefined) grid[v] = [];
            if (grid[v][u] == undefined) grid[v][u] = {items:new Array(16),count:0};
            var gd=grid[v][u];
            gd.items[gd.count++]=tri;
        }
    }
}

function colGridQueryPoint(cbuf,cgrid, bounds) {
    
    var rgn = colGridGetPoint(v3t1,cgrid, bounds);
    var cct=0;
    var v = rgn[1];
    var grid = cgrid.grid;
    if (grid[v] == undefined) return cct;
    var u = rgn[0];
    if (grid[v][u] == undefined) return cct;
    var cc = grid[v][u];
    for (var e = 0; e < cc.count; e++)cbuf[cct++]=cc.items[e];
    return cct;
}

function colGridQueryRgn(cbuf,cgrid, bounds) {
	var cct=0;
    var rgn = colGridGetRegion(cgrid, bounds);
    var grid = cgrid.grid;
    for (var u = rgn.minu; u <= rgn.maxu; u++)
    for (var v = rgn.minv; v <= rgn.maxv; v++) {
        if (grid[v] == undefined) continue;
        if (grid[v][u] == undefined) continue;
        var cc = grid[v][u];
        for (var e = 0; e < cc.count; e++) {
            var tri = cc.items[e];
            if (tri.selected == false) {
				cbuf[cct++]=tri;
                tri.selected = true;
            }
        }
    }
    for (var r = 0; r < cct; r++) {
        cbuf[r].selected = false;
    }
    return cct;
}

function testMovingSphereSphere(bodyA, bodyB) //returns undefined on no collision, otherwise returns T value for intercept
{
    var s = v3sub(bodyA.position, bodyB.position); // vector between the centers of each sphere
    var v = v3sub(bodyA.linearVelocity, bodyB.linearVelocity); // relative velocity between spheres
    var r = bodyA.radius + bodyB.radius;
    var t = 0.0;
    var c = v3dot(s, s) - (r * r); // if negative, they overlap
    if (c < 0.0) // if true, they already overlap
    {
        t = 0.0;
        return t;
    }
    var a = v3dot(v, v);
    //if (a < EPSILON)
    //  return false; // does not move towards each other
    var b = v3dot(v, s);
    if (b >= 0.0) return undefined; // does not move towards each other
    var d = b * b - a * c;
    if (d < 0.0) return undefined; // no real roots ... no collision
    t = (-b - Math.sqrt(d)) / a;
    return t;
}

function drawFixture() {
    
    if(g_renderPass ==  passDepth || g_renderPass == passLightDepth)
        drawMesh(this.mesh, this.depthShaderConst, this.depthShaderPer, this.matrix, this.mesh.definition.depthShader);
    else
        drawMesh(this.mesh, this.shaderConst, this.shaderPer, this.matrix, this.mesh.definition.depthShader);       
       
}

function drawBody(scale) {
    var sp=this;
    if (sp.visible == false) 
        return;
    
    var position = sp.position0;
/*
    var rotation = sp.rotation;
    rotation[1] = Math.atan2(sp.linearVelocity[0], sp.linearVelocity[2]) + (Math.PI * 1.5);
    fast.matrix4.scaling(m4t0, [1, 1, 1]);
    fast.matrix4.translation(m4t1, position);
    fast.matrix4.rotationY(m4t4, rotation[1]);
    fast.matrix4.getAxis(v3t0, m4t4, 2); //Get Z row
    fast.matrix4.getAxis(v3t1, m4t4, 1); //Get Y row
    //	rotation[0]=Math.PI*0.25;
    //rotation[2]=Math.atan2(v3dot(v3t0,sp.linearVelocity),v3dot(v3t1,sp.linearVelocity));
    fast.matrix4.rotationX(m4t3, rotation[0]);
    fast.matrix4.rotationZ(m4t5, rotation[2]);

    fast.matrix4.mul(m4t6, m4t5, m4t3);
    fast.matrix4.mul(m4t7, m4t6, m4t4);
    fast.matrix4.mul(m4t6, m4t1, m4t7);
    fast.matrix4.setTranslation(m4t6, position);
    fast.matrix4.mul(world, m4t0, m4t6);
 */    
    if(scale){
        fast.matrix4.scaling(world, [scale,scale,scale]);
    //    fast.matrix4.mul(world, world, m4t0);
    }
    fast.matrix4.translation(world, position);
 //   setWorld(world);
 sp.shaderPer.scale=sp.radius*2.0;
    drawMesh(sp.mesh, sp.shaderConst, sp.shaderPer, world);
}

function addAnchorConstraint(ba, pos) {
    var constraint = {
        bodyA: ba,
        anchorPosition: vec3(pos)
    };
    anchorConstraints.push(constraint);
    return constraint;
}

function updateConstraint(con) {
    if (con.anchorPosition) {
        v3copy(con.bodyA.position, con.anchorPosition);
        v3set(con.bodyA.linearVelocity, 0, 0, 0);
    } else {
        var dlt = v3subv(v3t0,con.bodyB.position, con.bodyA.position);
        var len = v3len(dlt);
        //var d2=(len-con.restLength)*con.restitutionForce/con.restLength;
        var d2 = (len - con.restLength) * con.restitutionForce / con.restLength;
        
        v3divv(dlt,dlt,len);
        var rmass=(1.0-(con.bodyA.mass/(con.bodyA.mass+con.bodyB.mass)))*2.0;
        var imass=(1.0-(con.bodyB.mass/(con.bodyA.mass+con.bodyB.mass)))*2.0;

        v3addv(con.bodyA.linearVelocity,con.bodyA.linearVelocity, v3mulv(v3t1,dlt, d2 * 0.99 * rmass));
        v3addv(con.bodyB.linearVelocity,con.bodyB.linearVelocity, v3mulv(v3t1,dlt, d2 * -0.99 * imass));
        v3addv(con.bodyA.position,con.bodyA.position, v3mulv(v3t1,dlt, d2 * 0.95 * rmass));
        v3addv(con.bodyB.position,con.bodyB.position, v3mulv(v3t1,dlt, d2 * -0.95 * imass));

        //con.bodyA.linearVelocity=v3add(con.bodyB.linearVelocity,v3sub(v3sub(con.bodyA.linearVelocity,con.bodyB.linearVelocity),v3mul(dlt,v3dot(con.bodyA.linearVelocity,dlt))));
        //con.bodyB.linearVelocity=v3add(con.bodyA.linearVelocity,v3sub(v3sub(con.bodyB.linearVelocity,con.bodyA.linearVelocity),v3mul(dlt,v3dot(con.bodyB.linearVelocity,dlt))));
    }
}

function addDistanceConstraint(ba, bb,aphasic) {
    var constraint = {
        bodyA: ba,
        bodyB: bb,
        restLength: v3len(v3subv(v3t0,bb.position, ba.position)),
        restitutionForce: 0.5
    };
    if(aphasic)
        aphasicConstraints.push(constraint);
    else
        constraints.push(constraint);
    return constraint;
}

function newFixture(bodies,update) {
    var fixture = {
        controls: newControls(),
        bodies: bodies,
        matrix: new Float32Array(16),
        update: update,
        draw: drawFixture,
        components: {}
    }
    fixtures.push(fixture);
    return fixture;
}

var g_fixtureBase=0;

var fixturesById={};

function addFixture(bodies, omesh, oconst, oper,update) {
    var fixture = newFixture(bodies,update);
    for(var b=0;b<bodies.length;b++){
        bodies[b].fixture=fixture;
    }
    fixture.mesh = omesh;
    fixture.shaderConst = oconst;
    fixture.shaderPer = oper;
    fixture.depthShaderConst = oconst;
    fixture.depthShaderPer = oper;
    fixture.id=g_fixtureBase++;
    fixturesById[fixture.id]=fixture;
    return fixture;
}

function addBody(omesh, oconst, oper, position, rotation) {
    var body = {
        type: 1,
        selected: false,
        mesh: omesh,
        position: position ? vec3(position) : [0, 0, 0],
        position0: [0, 0, 0],
        rotation: rotation ? vec3(rotation) : [0, 0, 0],
        rotation0: [0, 0, 0],
        linearVelocity: [0, 0, 0],
        linearVelocity0: [0, 0, 0],
        angularVelocity: [0, 0, 0],
        angularVelocity0: [0, 0, 0],
        radius: 0.4,
        mass: 1.0,
        sleeping: false,
        colliding: false,
        inWater: false,
        
        visible: true,
        shaderConst: oconst,
        shaderPer: oper,
        draw: drawBody,
        update: updateSphere
    }
    bodies.push(body);
    return body;
}

function bbox(){return {
	min: [0, 0, 0],
	max: [0, 0, 0]
}};

var bboxt0=bbox();

function findNearestContactOnRay(cct,rayStart,rayEnd,radius){
    var tmp=v3t0;
    var p0=v3copy(v3t1,rayStart);
    var p1=v3copy(v3t2,rayEnd);
    var intersect=v3t3;
    var nearestT=2.0;
    var nearestPt=v3t6;
	var contacts=null;
    for (var ci = 0; ci < cct; ci++) {
        var ck = g_queryBuffer[ci];
        
        var outNormal=v3copy(v3t4,ck.faceNormal);
        var nearPlanePoint=v3copy(v3t5,ck.verts[0]);
        var sins=v3dot(outNormal,v3subv(tmp,p0,nearPlanePoint));
        var sine=v3dot(outNormal,v3subv(tmp,p1,nearPlanePoint));
        var sign=sins>0.0?1.0:-1.0;
        if(sign<0){ //Flip signs of checks if we are on the outside/inside
            sins*=-1.0;
            sine*=-1.0;
            v3mulv(outNormal,outNormal,-1.0);
        }
        if(sins>=radius && sine>=radius)
            continue;
        if(sins>=radius && sine<radius){
            sins-=radius;
            sine-=radius;
            var localColTime=sins/(sine-sins);
            v3addv(intersect,p0,v3mulv(intersect,v3subv(tmp,p0,p1),localColTime));
            
            //Test intersect point within triangle face
            var inside=true;
            for(var i=0;i<3;i++){
                v3subv(tmp,intersect,ck.verts[i]);
                if(v3dot(tmp,ck.edgeNormals[i])<0.0)
                    inside=false;
            }
            if(inside===true){
                //g_debugObjectQueue.push({position:vec3(intersect),radius:1.0});
				if(localColTime<nearestT){
					nearestT=localColTime;
					v3copy(nearestPt,intersect);
				}
            }else{
				//Check against edge vectors..
			}
        }
    }
	if(nearestT<2.0){
		var col=allocContact();
		col.time=nearestT;
		v3copy(col.position,nearestPt);
		col.next=contacts;
		contacts=col;
	}
	return contacts;
}

function raycast(rayStart,rayEnd,radius){
    v3copy(bboxt0.min,rayEnd);
    v3copy(bboxt0.max,rayEnd);
    AABAccum(bboxt0, rayEnd);
	bboxt0.min[0]-=radius;
	bboxt0.min[1]-=radius;
	bboxt0.min[2]-=radius;
    bboxt0.max[0]+=radius;
	bboxt0.max[1]+=radius;
	bboxt0.max[2]+=radius;
    var cct = colGridQueryRgn(g_queryBuffer,worldGrid,bboxt0);
	return findNearestContactOnRay(cct,rayStart,rayEnd,radius);
}

function updateSphere() {
    var sp=this;
    if (sp.sleeping)
        return;
    v3copy(sp.linearVelocity0, sp.linearVelocity);
    v3copy(sp.position0, sp.position);
    if(sp.position[1]<g_seaLevel){
        sp.inWater=true;
        var subm=g_seaLevel-sp.position[1];
        var r2=sp.radius*2.0;
        //Do water bouyancy
        if(subm>=r2)
            subm=r2;
        var rat=(subm/r2);
        v3addv(sp.linearVelocity,sp.linearVelocity, v3mulv(v3t0,gravity,(rat-0.5)*-2.0));

        v3addv(sp.linearVelocity,sp.linearVelocity, v3mulv(v3t0,gravity,(rat-0.5)*-2.0));

        v3mulv(sp.linearVelocity,sp.linearVelocity,0.99-((subm/r2)*0.1));	//Damp velocity based on submersion.

        if(sp.linearVelocity[1]<0.0){
            sp.linearVelocity[1]*=0.9;//water friction :P
        }
    }else{
        sp.inWater=false;
        sp.linearVelocity = v3addv(sp.linearVelocity,sp.linearVelocity, gravity);
    }
    v3addv(sp.position,sp.position, sp.linearVelocity);
    v3addv(sp.rotation,sp.rotation, sp.angularVelocity);
    
	
    v3copy(bboxt0.min,sp.position);
    v3copy(bboxt0.max,sp.position);
    AABAccum(bboxt0, sp.position0);
    var cct = colGridQueryRgn(g_queryBuffer,worldGrid,bboxt0);
    
    var tmp=v3t0;
    var p0=v3copy(v3t1,v3addv(tmp,sp.position0,[0,10,0]));
    var p1=v3copy(v3t2,v3addv(tmp,sp.position0,[0,-10,0]));
    var intersect=v3t3;
    var radius=0;
    var colliding=false;
    var collisionForce=0.0;
    for (var ci = 0; ci < cct; ci++) {  //Loop through all potential colliders
        var ck = g_queryBuffer[ci];
        
        var outNormal=v3copy(v3t4,ck.faceNormal);
        var nearPlanePoint=v3copy(v3t5,ck.verts[0]);
        var sins=v3dot(outNormal,v3subv(tmp,p0,nearPlanePoint));
        var sine=v3dot(outNormal,v3subv(tmp,p1,nearPlanePoint));
        var sign=sins>0.0?1.0:-1.0;
        if(sign<0){ //Flip signs of checks if we are on the outside/inside
            sins*=-1.0;
            sine*=-1.0;
            v3mulv(outNormal,outNormal,-1.0);
        }
        if(sins>=radius && sine>=radius)
            continue;
        if(sins>=radius && sine<radius){
            sins-=radius;
            sine-=radius;
            var localColTime=sins/(sine-sins);
            v3addv(intersect,p0,v3mulv(intersect,v3subv(tmp,p0,p1),localColTime));
            
            //Test intersect point within triangle face
            var inside=true;
            for(var i=0;i<3;i++){
                v3subv(tmp,intersect,ck.verts[i]);
                if(v3dot(tmp,ck.edgeNormals[i])<0.0)
                    inside=false;
            }
            
            if(inside===true){
            //    g_debugObjectQueue.push({position:vec3(intersect),radius:0.2});
                //v3copy(p0,intersect);
                //v3mulv(sp.linearVelocity, sp.linearVelocity, 0.98);
                if(sp.position[1]<intersect[1]+sp.radius){
                    sp.position[1]=intersect[1]+sp.radius;
                    v3subv(tmp,sp.position,sp.position0);
                    
                    var vdot=v3dot(sp.linearVelocity,outNormal);
                    
                    if(vdot<0.0){   //If sphere is moving into surface
                        //sp.linearVelocity[1]*=-1.0;
                        
                        //v3addv(v3t4,sp.linearVelocity ,v3mulv(tmp,outNormal,vdot*-1.0));
                        v3addv(sp.linearVelocity,sp.linearVelocity ,v3mulv(tmp,outNormal,vdot*-1.0));   // Remove velocity component entering surface
                        //var sql=v3sqlen(sp.linearVelocity);
                        //	var gripVel=(1.0*-vdot)*0.05;
                        //	gripVel*=gripVel;
                        //	if(sql<gripVel)//Simulate some friction
                        //		v3mulv(sp.linearVelocity, sp.linearVelocity, 0.0+(0.95*sql/gripVel));
                        colliding=true;
                        collisionForce -= vdot;
                        //Apply frictive force with ground
                        
                        //if(vdot>1.0)vdot=1.0;
                        //v3mulv(sp.linearVelocity, sp.linearVelocity,1.0-vdot);
            //            v3mulv(sp.linearVelocity, sp.linearVelocity,0.95);
 
                    }
                }
            }
        }
        if(colliding==true){
            if(collisionForce>1.0)collisionForce=1.0;
            v3mulv(sp.linearVelocity, sp.linearVelocity,1.0-collisionForce);
            
        }
 /*
        var vmy = ck.bounds.min[1] + radius;
        //var vmy = ck.bounds.min[1];
        if (sp.position[1] < vmy) {
            sp.position[1] = vmy;
            v3mulv(sp.linearVelocity, sp.linearVelocity, 0.98);
        }
 */
    }
    sp.colliding=colliding;
}

var phaseFrame=0;
function updateSim() {
    for (var i = 0; i < bodies.length; i++) {
        var sp = bodies[i];
        sp.update();
    }
    if (g_enableConstraints){
        var len=constraints.length;
        if(phaseFrame&1){
            for (var i = 0;i<len; i++) {
                var con = constraints[i];//(i+phaseFrame)%len];
                updateConstraint(con);
            }
        }else{
            for (var i = len-1;i>=0; i--) {
                var con = constraints[i];//(i+phaseFrame)%len];
                updateConstraint(con);
            }
        }
        var len=aphasicConstraints.length;
        for (var i = 0;i<len; i++)updateConstraint(aphasicConstraints[i]);
        var len=anchorConstraints.length;
        for (var i = 0;i<len; i++)updateConstraint(anchorConstraints[i]);
    }
    for (var i = 0; i < fixtures.length; i++) {
        var fix = fixtures[i];
        fix.update();
        updateControls(fix);
    }
    phaseFrame++;
}
