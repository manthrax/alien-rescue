
function updateDefaultFixture() {
    var fi=this;
    var centroid = v3t0;
    v3set(centroid,0,0,0);
    for(var i=0;i<fi.bodies.length;i++)v3addv(centroid,centroid, fi.bodies[i].position0);
    v3mulv(centroid,centroid,1.0/fi.bodies.length);
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    var tmp = v3t5;
    var at = v3t6;
    v3subv(up, fi.bodies[4].position0, fi.bodies[0].position0);
    v3subv(right, fi.bodies[1].position0, fi.bodies[0].position0);
    v3subv(fwd,v3mulv(fwd,v3subv(fwd,fi.bodies[2].position0, fi.bodies[7].position0),0.5),centroid);
    v3addv(at,centroid,right);
    fast.matrix4.cameraLookAt(fi.matrix, centroid, at,up);    
}

function updateCarFixture() {
    var fi=this;
    var centroid = v3t0;
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    var tmp = v3t5;
    var at = v3t6;
    var imp = v3t7;
    var controls=this.controls;
    var blwheel=fi.bodies[0];
    var brwheel=fi.bodies[1];
    var flwheel=fi.bodies[2];
    var frwheel=fi.bodies[3];
    v3set(centroid,0,0,0);
    for(var i=0;i<fi.bodies.length;i++)v3addv(centroid,centroid, fi.bodies[i].position0);
    v3mulv(centroid,centroid,1.0/fi.bodies.length);
    
    v3subv(right, fi.bodies[1].position0, fi.bodies[0].position0);
    v3subv(fwd,fi.bodies[3].position0, fi.bodies[0].position0);
    v3crossv(up,right,fwd);
    
    
   
    //Apply steering impulse
    v3copy(tmp,right);
    if(flwheel.colliding && frwheel.colliding){
        if(controls.active.yaw[0]){
            v3mulv(tmp,fwd,controls.active.yaw[0]*-1.0);
            v3addv(tmp,tmp,right); 
        }
        else
        if(controls.active.yaw[1]){
            v3mulv(tmp,fwd,controls.active.yaw[1]*-1.0);
            v3subv(tmp,tmp,right);
        }
        v3normalizev(tmp,tmp);
        projectBodyVelocity(flwheel,tmp);
        projectBodyVelocity(frwheel,tmp);
    }
    if(blwheel.colliding && brwheel.colliding){
        v3copy(tmp,right);
        v3normalizev(tmp,tmp);
        projectBodyVelocity(blwheel,tmp);
        projectBodyVelocity(brwheel,tmp);
    }
    //end steering impulse
    
    v3mulv(imp,fwd,controls.inputs.thrust*0.1);
    v3addv(flwheel.linearVelocity,flwheel.linearVelocity, imp);
    v3addv(frwheel.linearVelocity,frwheel.linearVelocity, imp);
    v3addv(blwheel.linearVelocity,blwheel.linearVelocity, imp);
    v3addv(brwheel.linearVelocity,brwheel.linearVelocity, imp);

    v3mulv(tmp,up,-0.03)
    v3addv(centroid,centroid,tmp);
    v3addv(at,centroid,up);

    fast.matrix4.cameraLookAt(fi.matrix, centroid, at,fwd);
    
    
    v3mulv(up,up,-0.25);
    v3mulv(fwd,fwd,-0.5);
    if(g_targetFixture==fi)
        cameraTrackFixture(fwd,up,right);
    
    
    
}

function updateBoatFixture() {
    var fi=this;
    var centroid = v3t0;
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    var tmp = v3t5;
    var at = v3t6;
    var imp = v3t7;
    var blwheel=fi.bodies[0];
    var brwheel=fi.bodies[1];
    var flwheel=fi.bodies[2];
    var frwheel=fi.bodies[3];
    v3set(centroid,0,0,0);
    for(var i=0;i<fi.bodies.length;i++)v3addv(centroid,centroid, fi.bodies[i].position0);
    v3mulv(centroid,centroid,1.0/fi.bodies.length);
    v3subv(right, fi.bodies[1].position0, fi.bodies[0].position0);
    v3subv(fwd,fi.bodies[3].position0, fi.bodies[0].position0);
    v3crossv(up,right,fwd);
    
    //Apply steering impulse
    v3copy(tmp,right);
    var controls=fi.controls;
    if(flwheel.inWater && frwheel.inWater){
        if(controls.active.yaw[0]){
            v3mulv(tmp,fwd,controls.active.yaw[0]*-1.0);
            v3addv(tmp,tmp,right); 
        }else 
        if(controls.active.yaw[1]){
            v3mulv(tmp,fwd,controls.active.yaw[1]*-1.0);
            v3subv(tmp,tmp,right);
        }
        v3normalizev(tmp,tmp);
        projectBodyVelocity(flwheel,tmp);
        projectBodyVelocity(frwheel,tmp);
    }
    if(blwheel.inWater && brwheel.inWater){
        v3copy(tmp,right);
        v3normalizev(tmp,tmp);
        projectBodyVelocity(blwheel,tmp);
        projectBodyVelocity(brwheel,tmp);
    }
    //end steering impulse
    
    v3mulv(imp,fwd,controls.inputs.thrust*0.1);
    v3addv(flwheel.linearVelocity,flwheel.linearVelocity, imp);
    v3addv(frwheel.linearVelocity,frwheel.linearVelocity, imp);
    v3addv(blwheel.linearVelocity,blwheel.linearVelocity, imp);
    v3addv(brwheel.linearVelocity,brwheel.linearVelocity, imp);

    v3mulv(tmp,up,-0.03)
    v3addv(centroid,centroid,tmp);
    v3addv(at,centroid,up);

    fast.matrix4.cameraLookAt(fi.matrix, centroid, at,fwd);
    
    v3mulv(up,up,-0.25);
    v3mulv(fwd,fwd,-0.5);
    if(g_targetFixture==fi)
        cameraTrackFixture(fwd,up,right);
}

function updatePlaneFixture() {
    var fi=this;
    var centroid = v3t0;
//    v3set(centroid,0,0,0);
//    for(var i=0;i<fi.bodies.length;i++)
//        v3addv(centroid,centroid, fi.bodies[i].position0);
//    v3mulv(centroid,centroid,1.0/fi.bodies.length);
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    var tmp = v3t5;
    var at = v3t6;
    var imp = v3t7;
    var cvel = v3t8;
    
    v3set(up,0.0,0.0,0.0);
    v3set(centroid,0.0,0.0,0.0);
    v3subv(right, fi.bodies[1].position0, fi.bodies[0].position0);
    v3mulv(right,right,1.0/6.0);
    
    v3addv(axleCenter, fi.bodies[1].position0, fi.bodies[0].position0);
    v3mulv(axleCenter,axleCenter,0.5);
    v3addv(tmp, fi.bodies[3].position0, fi.bodies[2].position0);//Rear axle cent
    v3mulv(tmp,tmp,0.5);

    v3subv(fwd,axleCenter,tmp);
    v3mulv(fwd,fwd,0.25);
    v3crossv(up,right,fwd);

    v3addv(centroid,axleCenter,tmp);
    v3mulv(centroid,centroid,0.5);
    v3addv(centroid,centroid,v3mulv(tmp,up,0.5));

    v3addv(at,centroid,right);
    
    fast.matrix4.cameraLookAt(fi.matrix, centroid, at,up);
    // Dark place
    
 /*   v3subv(tmp, fi.bodies[4].position0, fi.bodies[0].position0);
    var badDot=v3dot(tmp,up);
    if(badDot<1.0){
        badDot=0;
        v3addv(fi.bodies[4].linearVelocity, fi.bodies[4].linearVelocity,v3mulv(tmp,up,0.01));
    }
    */
   
   // Tail/Rudder ground steering...
    var frwheel=fi.bodies[1];
    var flwheel=fi.bodies[0];
    var brwheel=fi.bodies[3];
    var blwheel=fi.bodies[2];
    var controls=fi.controls;
        //Yaw force
        if(controls.active.yaw[0]){
            v3mulv(tmp,fwd,controls.active.yaw[0]*-1.0);
            v3addv(tmp,tmp,right);

            v3normalizev(tmp,tmp);
        }
        else
        if(controls.active.yaw[1]){
            v3mulv(tmp,fwd,controls.active.yaw[1]*-1.0);
            v3subv(tmp,tmp,right);
            v3normalizev(tmp,tmp);
        }else{
            v3copy(tmp,right);

        }

    //Roll force
        v3mulv(tmp,up,controls.inputs.roll*1.1);
        v3addv(frwheel.linearVelocity,frwheel.linearVelocity,tmp);
        v3mulv(tmp,tmp,-1.0);
        v3addv(flwheel.linearVelocity,flwheel.linearVelocity,tmp);
   
    //Pitch force
        v3mulv(tmp,up,controls.inputs.pitch*1.1);
        v3addv(brwheel.linearVelocity,brwheel.linearVelocity,tmp);
        //v3mulv(tmp,tmp,-1.0);
        v3addv(blwheel.linearVelocity,blwheel.linearVelocity,tmp);
   
   
    //Simulate Lift
    
    v3set(cvel,0,0,0);
    for(i=0;i<fi.bodies.length;i++)
        v3addv(cvel,cvel, fi.bodies[i].linearVelocity);
    var cdot=v3dot(fwd,cvel);
    var thrust=controls.inputs.thrust*0.2;
    v3mulv(imp,fwd,thrust);
    cdot*=1.0/5.0;
    cdot*=10.12; //INcrease this for shorter takeoffs
    cdot=cdot<0.0?0.0:cdot; //Cancel lift inreverse
    if(cdot>-gravity[1])cdot=-gravity[1];
    var drag=1.0-((cdot/-gravity[1])*0.001);

    v3mulv(tmp,up,cdot);
    v3addv(imp,imp,tmp);
    for(i=0;i<fi.bodies.length;i++)
        v3addv(fi.bodies[i].linearVelocity,fi.bodies[i].linearVelocity, imp);

drag*=0.999;
    for(i=0;i<fi.bodies.length;i++)
        v3mulv(fi.bodies[i].linearVelocity,fi.bodies[i].linearVelocity, drag);
      //End lift sim
  /*
  //Aerodynamics
    for(i=0;i<2;i++)
    {
        var amt=(fi.bodies[i].colliding) ? 1.0 : 1.0;
        projectBodyVelocity(fi.bodies[i],up,amt);
        projectBodyVelocity(fi.bodies[i],right,amt);
    }
    var pitch=controls.inputs.pitch*0.2;
    var yaw=controls.inputs.yaw*0.2;
    v3mulv(tmp,up,(1.0-pitch));
    v3addv(tmp,tmp,v3mulv(tmp,fwd,pitch));
    v3mulv(imp,right,(1.0-yaw));
    v3addv(imp,imp,v3mulv(imp,fwd,yaw));
    for(i=2;i<4;i++){
        var amt=(fi.bodies[i].colliding) ? 1.0 : 1.0;
        projectBodyVelocity(fi.bodies[i],tmp,amt);
        projectBodyVelocity(fi.bodies[i],imp,amt);
    }
    */
    v3mulv(fwd,fwd,-1.0);
    v3mulv(right,right,-1.0);
    if(g_targetFixture==fi)
        cameraTrackFixture(fwd,up,right);
       
}

function updateRalienFixture() {
    var fi=this;
    var centroid = v3t0;
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    var tmp = v3t5;
    var at = v3t6;
    v3subv(up, fi.bodies[1].position0, fi.bodies[0].position0);
    right[0]=up[1];
    right[1]=up[2];
    right[2]=up[0]*-1.0;
    v3addv(centroid, fi.bodies[0].position0, v3mulv(tmp,up,0.5));
    v3crossv(fwd,up,right);
    v3addv(at,centroid,fwd);
    fast.matrix4.cameraLookAt(fi.matrix, centroid, at, up);
    
    
    var controls=fi.controls;
    
    fi.bodies[1].linearVelocity = v3subv(fi.bodies[1].linearVelocity,fi.bodies[1].linearVelocity, v3mulv(tmp,gravity,1.1));
    if(!fi.animCountdown){
        fi.animCountdown=1;//parseInt((Math.random()*100.0)+60);
        var b0=fi.bodies[0];
        var b1=fi.bodies[1];
        
        if(controls.active.thrust[0]){
            v3addv(b0.linearVelocity,b0.linearVelocity,v3mulv(v3t0,fwd,controls.active.thrust[0]*0.004));
            //b0.linearVelocity[0]+=controls.active.thrust[0]*0.001;
        }
        if(controls.active.thrust[1]){
            v3subv(b0.linearVelocity,b0.linearVelocity,v3mulv(v3t0,fwd,controls.active.thrust[1]*0.004));
            //b0.linearVelocity[0]-=controls.active.thrust[1]*0.001;
        }
        if(controls.active.yaw[0]){
            v3addv(b0.linearVelocity,b0.linearVelocity,v3mulv(v3t0,right,controls.active.yaw[0]*0.004));
            //b0.linearVelocity[2]+=controls.active.yaw[0]*0.001;
        }
        if(controls.active.yaw[1]){
            v3subv(b0.linearVelocity,b0.linearVelocity,v3mulv(v3t0,right,controls.active.yaw[1]*0.004));
            //b0.linearVelocity[2]-=controls.active.yaw[1]*0.001;
        }
    //if(fi.emitter==undefined)
    //	fi.emitter=audio.addEmitter(fi,fi.bodies[0].position);
    //	fi.emitter.emit("meep",1.0,false,20.0);
    }else
        fi.animCountdown--;

    
    //v3mulv(up,up,-1.0);
    v3mulv(fwd,fwd,-1.0);
    if(g_targetFixture==fi)
        cameraTrackFixture(fwd,up,right);
    
}

function updateChopperFixture() {
    var fi=this;
    var tmp = v3t5;
    var tmp2 = v3t6;
		
    var vl = fi.bodies[3].linearVelocity; //Top ball
		
		
    var centroid = v3t0;
    var axleCenter = v3t1;
    var fwd = v3t2;
    var up = v3t3;
    var right = v3t4;
    v3addv(centroid, fi.bodies[0].position0, fi.bodies[1].position0);
    v3addv(tmp, fi.bodies[2].position0, fi.bodies[3].position0);
    v3addv(centroid, centroid, tmp);
    v3mulv(centroid, centroid, 0.25);
    v3mulv(axleCenter, v3addv(tmp, fi.bodies[1].position0, fi.bodies[2].position0), 0.5);
    v3subv(right, fi.bodies[2].position0, fi.bodies[1].position0);
    v3subv(fwd, fi.bodies[0].position0, axleCenter);
		
    v3normalizev(right, right);
    v3normalizev(fwd, fwd);
		
    v3subv(up, fi.bodies[3].position0, centroid);
    v3normalizev(up, up);
    v3crossv(tmp,fwd,right);
    if(v3dot(up,tmp)<0.2){
        v3mulv(up,tmp,1.0);
    }
    
    v3copy(targetPosition, centroid);
    //var at=v3addv(tmp,from,fwd);
    //fast.matrix4.cameraLookAt(world,from,at,up);
    v3subv(centroid,centroid,v3mulv(tmp2,up,-0.4));
    v3subv(centroid,centroid,v3mulv(tmp2,fwd,-0.75));
    var at = v3subv(tmp, centroid, up);

    fast.matrix4.cameraLookAt(fi.matrix, centroid, at, v3mulv(tmp2,right,-1.0));
    
    var controls=fi.controls;
   
    var vl = fi.bodies[3].linearVelocity; //Top ball
    v3addv(vl, vl, v3mulv(tmp, up, controls.inputs.thrust * 0.85));	//Rotor Thrust
    v3addv(vl, vl, v3mulv(tmp, [0, 1, 0], controls.inputs.thrust * 0.15)); //Rotor vertical balance thrust
    if(controls.flipOver){
        v3subv(vl,vl, v3mulv(tmp,gravity,3.1));
        v3subv(vl,vl, v3mulv(tmp,right,0.001));
    //	v3addv(vl, vl, v3mulv(tmp, [0, 1, 0], 0.15)); //Rotor vertical balance thrust
    }
		
    v3addv(vl, vl, v3mulv(tmp, tmp2, controls.inputs.roll));	//RollImpulse
		
    vl = fi.bodies[0].linearVelocity; //Rear ballw
    //v3addv(vl,vl,v3mulv(tmp,up,v3dot(vl,up)*-0.001));		//Damp tail u-d sphere tangential velocity
    v3addv(vl, vl, v3mulv(tmp, right, controls.inputs.yaw));    //Yaw
    v3addv(vl, vl, v3mulv(tmp, up, controls.inputs.pitch));	//Pitch as a function of fwd velocity
		
    if(fi.bodies[3].position[1]>200.0){
        for(var i=0;i<4;i++){	//Damp vertical velocity if above hard deck
            var lv=fi.bodies[i].linearVelocity;
            if(lv[1]>0.0){
                lv[1]*=0.9;
            }
        }
    }

    for(var i=0;i<4;i++){	//Damp lateral velocities
        var vl = fi.bodies[i].linearVelocity; //Front left
        v3addv(vl,vl,v3mulv(tmp,right,v3dot(vl,right)*-0.003));	//Damp l->r lateral velocity
    }
    if(g_targetFixture==fi){
        cameraTrackFixture(fwd,up,right);

    }else{
        //chopperTrackTarget(fi);
    }
    var controls=fi.controls;
    var abt=Math.abs(controls.inputs.thrust);
    if(abt>0.01){
        if(fi.engineSound.active==false)
            fi.engineSound.emit("helo",fi.controls.inputs.thrust/fi.controls.ranges.thrust[1],true,20.0);
        else
            fi.engineSound.volume=fi.controls.inputs.thrust/fi.controls.ranges.thrust[1];
    }else{
        if(fi.engineSound.active==true)
            fi.engineSound.stop();
    }
}


function makeDumbellFixture(position, def, updater) {

    var ibase = bodies.length;
    var tscale = 1.0;
    var cons=[[0, -0.51, 0],[0, 0.51, 0]];
    var nbodies=[];
    for(var i=0;i<cons.length;i++){
      var bod=addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, cons[i], tscale)));
      bod.mass=0.01;
      nbodies.push(bod);
    }
    for (var t = 0; t < cons.length; t++) bodies[ibase + t].visible = g_debugBodies;
    cons=[0,1];
    for(var i=0;i<cons.length;i+=2)
        addDistanceConstraint(bodies[ibase+cons[i]], bodies[ibase+cons[i+1]]);
    var fix=addFixture(nbodies,  def.model,  def.shaderConst, def.shaderPer, updater);
    g_cameraTargetList.push([fix, ibase]);

}

function makeCarFixture(position, def, updater) {
    var ibase = bodies.length;
    var tscale = 1.0;
    var cons=[[-1.0,0.0, -1.0],[ 1.0,0.0, -1.0],[1.0,0.0, 1.0],[-1.0,0.0, 1.0]];
    var nbodies=[];
    for(var i=0;i<cons.length;i++)
        nbodies.push(addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, cons[i], tscale))));

    for (var t = 0; t < cons.length; t++) bodies[ibase + t].visible = g_debugBodies;
    cons=[0,1,1,2, 2,3,3,0, 0,2,3,1];
    for(var i=0;i<cons.length;i+=2)
        addDistanceConstraint(bodies[ibase+cons[i]], bodies[ibase+cons[i+1]]);
    var fix=addFixture(nbodies,  def.model,  def.shaderConst, def.shaderPer, updater);
    g_cameraTargetList.push([fix, ibase]);
}

function copy(obj){
    var b={}
    for(var k in obj)b[k]=obj[k];
    return b;
}

function newHeliComponent(fix){
    return{
        init:function (fix){
            fix.shaderPer=copy(fix.shaderPer);
            fix.shaderPer.rotorSpins=new Float32Array(3);
            fix.depthShaderPer=copy(fix.shaderPer);
        },
        controls: function(fix){ fix.shaderPer.rotorSpins[0] += (fix.controls.inputs.thrust*5.0);
        }
    }
}

function initFixture(fix){
    for(var c in fix.components){
        var cmp=fix.components[c];
        if(cmp.init)cmp.init(fix);
    }
}

function makePlaneFixture(position, def, updater) {
    var ibase = bodies.length;
    var fw = 3.0;
    var rw = 1.5;
    
    var cons=[[-fw,0.0, -2.0],[ fw,0.0, -2.0],[-rw,0.0, 2.0],[rw,0.0, 2.0],
    [0.0, 1.5, 0.0]];
    var nbodies=[];
    for(var i=0;i<cons.length;i++)
        nbodies.push(addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, cons[i])));

    for (var t = 0; t < cons.length; t++) bodies[ibase + t].visible = g_debugBodies;
    cons=[0,1,1,2, 2,3,3,0, 0,2,3,1, 0,4,1,4,2,4,3,4];
    for(var i=0;i<cons.length;i+=2)
        addDistanceConstraint(bodies[ibase+cons[i]], bodies[ibase+cons[i+1]]);
    var fix=addFixture(nbodies,  def.model,  def.shaderConst, def.shaderPer, updater);
    //    g_targetBody = ibase;
    g_cameraTargetList.push([fix, ibase]);
}

function makeHeliFixture(position, model, Const, Per, updater) {
    var fix=makeTetraFixture(position,model,Const,Per, updater);
    fix.components.heliComponent = newHeliComponent();
    initFixture(fix);
    return fix;
}

function makeTetraFixture(position, model, Const, Per, updater) {
    var ibase = bodies.length;
    var tscale = 1.3;
    addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, [0, -0.5, 1], tscale)));
    addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, [-0.866, -0.5, -0.5], tscale)));
    addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, [0.866, -0.5, -0.5], tscale)));
    addBody(sphere, sphereConst, spherePer, v3addv(v3t0, position, v3mulv(v3t1, [0, 0.5, 0], tscale)));
    for (var t = 0; t < 4; t++){
        var bod=bodies[ibase + t]
        bod.visible = g_debugBodies;
        bod.radius = 0.5;
    }
    addDistanceConstraint(bodies[ibase], bodies[ibase + 1]);
    addDistanceConstraint(bodies[ibase + 1], bodies[ibase + 2]);
    addDistanceConstraint(bodies[ibase + 2], bodies[ibase]);
    addDistanceConstraint(bodies[ibase + 3], bodies[ibase]);
    addDistanceConstraint(bodies[ibase + 3], bodies[ibase + 1]);
    addDistanceConstraint(bodies[ibase + 3], bodies[ibase + 2]);
    var fix=addFixture([bodies[ibase], bodies[ibase + 1], bodies[ibase + 2], bodies[ibase + 3]], model, Const, Per, updater);
	
    g_cameraTargetList.push([fix, ibase + 3]);
    return fix;
}
