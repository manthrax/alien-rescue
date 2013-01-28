var GOAL_STRIPES=0;
var GOAL_SOLIDS=1;
var GOAL_8BALL=2;
var GOAL_SCRATCH=3;
var GOAL_OPEN=4;
var pcl;

function Pool8BallClient(){

    pcl=this;
    this.players=[{goal:GOAL_OPEN},{isAI:true,goal:GOAL_OPEN}]
    this.reportElem=document.getElementById("gameState");
    this.reports=["Game:"];
    this.report=function(msg){
        console.log(msg);
        if(reports.length>5){
            for(var i=1;i<reports.length-1;i++)reports[i]=reports[i+1];
            reports[reports.length-1]=msg;
        }else
            reports.push(msg);
        this.reportElem.innerHTML=reports.join("<br>");
    }
    
    this.goalToString=function(g){
        if(g==GOAL_STRIPES)return "stripes";
        else if(g==GOAL_SOLIDS)return "solids";
        else if(g==GOAL_8BALL)return "8ball";
        else if(g==GOAL_OPEN)return "open";
        else return "scratch";
    }
    
    this.playerEndTurn=function (){
        pcl.curPlayerIndex=(pcl.curPlayerIndex+1)%pcl.players.length;
        pcl.curPlayer=pcl.players[pcl.curPlayerIndex];
        
        if(pcl.sidesChosen){
            var remaining=pcl.sidesChosen?pcl.goalBallsRemaining(pcl.curPlayer.goal):0;
            if(remaining==0){
                pcl.curPlayer.goal=GOAL_8BALL;
                pcl.report("Player:"+pcl.curPlayerIndex+" is shooting the "+goalToString(pcl.curPlayer.goal));
            }
            pcl.report("Player:"+pcl.curPlayerIndex+"s turn shooting "+(pcl.sidesChosen?goalToString(pcl.curPlayer.goal)+".. "+remaining+"+ remaining.":"open table..."));
        }else
            pcl.report("Player:"+pcl.curPlayerIndex+"s turn shooting open table...");        
        
        g_poolSim.curPlayerGoal=pcl.curPlayer.goal;

    }
    
    this.aiCueAngle=0.0;
    this.aiCueForce=0.0;

    this.findBest=function(list,cmpFn){
        var best=null;
        for(var i=0;i<list.length;i++){
            if(best==null)best=list[0];
            else
                best=cmpFn(best,list[i]);
        }
        return best;
    }
    
    g_poolSim.on("frame",function(){
        
        if(pcl.curPlayer.isAI){
            if(pcl.aiFrame>1000)return;
            if(pcl.aiFrame==0){
                if(pcl.isBreak){
                    //Do a random break...
                    pcl.report("AI BREAK");
                    pcl.aiCueAngle=0.0;
                    pcl.aiCueForce=3.0;
                }else{
                    //Pick a random shot
                    //console.log("AI LINEUP SHOT");
                    var shots=g_poolSim.getShotCandidates(pcl.curPlayer.goal,pcl.shotWasScratch);
                    var best=pcl.findBest(shots,function(sa,sb){
                        if(sa.incidence<sb.incidence)return sa;
                        return sb;
                    });
                    if(best==null){
                        pcl.report("AI HAS NO SHOT")
                        pcl.aiCueAngle=Math.random()*Math.PI*2.0;
                        pcl.aiCueForce=1.0;
                    }else{
                        pcl.report("AI TAKING BEST SHOT")
                        var cueBall=g_poolSim.bodies[15];
                        v3normalizev(v3t0,v3subv(v3t0,best.ack,cueBall.position));
                        pcl.aiCueAngle=Math.atan2(v3t0[1],v3t0[0])-(Math.PI*1.5);
                        pcl.aiCueForce=1.0;
                    }
                }
            }else if(pcl.aiFrame<120){
                g_poolSim.cueAngle+=(pcl.aiCueAngle-g_poolSim.cueAngle)*0.1;
                g_poolSim.cuePull+=(pcl.aiCueForce-g_poolSim.cuePull)*0.1;
            }else if(pcl.aiFrame==120){
                //takeTheShot()
                console.log("AI TAKE SHOT");
                g_poolSim.takeTheShot(g_poolSim.cueAngle,pcl.aiCueForce);
            }
            pcl.aiFrame++;
        }
    });

    g_poolSim.on("cue_scratch",function(msg){
        pcl.shotWasScratch=true;
    });
    
    g_poolSim.on("balls_racked",function(msg){
        pcl.report("BALLS RACKED");
        pcl.sidesChosen=false;
        pcl.curPlayerIndex=0;
        pcl.curPlayer=pcl.players[pcl.curPlayerIndex];
        pcl.shotValidContact=false;
        pcl.goalBallSunk=false;
        pcl.gameOver=false;
        pcl.isBreak=true;
        pcl.aiFrame=0;
        pcl.shotStarted=false;
        pcl.shotWasScratch=false;
        for(var t=0;t<pcl.players.length;t++)
            pcl.players[t].goal=GOAL_OPEN;
        g_poolSim.curPlayerGoal=GOAL_OPEN;
    });
    
    g_poolSim.on("cue_strike",function(msg){
        pcl.shotHadContact=false;
        pcl.shotValidContact=false;
        pcl.shotWasScratch=false;
        pcl.goalBallSunk=false;
        pcl.shotStarted=true;
    });
    
    function ballGoal(bidx){
        if(bidx<7)return GOAL_SOLIDS;
        if(bidx==7)return GOAL_8BALL;
        if(bidx==15)return GOAL_SCRATCH
        return GOAL_STRIPES;
    }
    
    this.goalBallsRemaining = function(g){
        var ct=0;
        for(var t=0;t<15;t++){
            var b=g_poolSim.bodies[t];
            if(ballGoal(t)==g && b.enabled){
                ct++;
            }
        }
        return ct;
    }
    
    g_poolSim.on("sim_asleep",function(msg){
        if(!pcl.shotStarted)
            return;
        if(pcl.shotWasScratch==true){
            pcl.report("Player:"+pcl.curPlayerIndex+" scratched.");
            pcl.playerEndTurn();
            var sps=g_poolSim.findScratchSetups(pcl.curPlayer.goal);
            v3copy(g_poolSim.bodies[15].position,sps[0].position);  //Move the cue to a scratch spot..
            v3copy(g_poolSim.bodies[15].targetPos,sps[0].position);  //Move the cue to a scratch spot..
        }else if( pcl.shotValidContact==false||
            pcl.goalBallSunk==false){
            pcl.playerEndTurn();
        }
        else{

            if(pcl.sidesChosen==false&&pcl.isBreak){
                pcl.report("Table is still open after the break..");
            }else{
                
                var remaining=pcl.goalBallsRemaining(pcl.curPlayer.goal);
                if(remaining>0){
                    pcl.report("Player:"+pcl.curPlayerIndex+" keeps shooting "+(pcl.sidesChosen?goalToString(pcl.curPlayer.goal)+".. "+remaining+"+ remaining.":"open table..."));
                }else{
                    pcl.curPlayer.goal=GOAL_8BALL;
                    pcl.report("Player:"+pcl.curPlayerIndex+" is shooting the "+goalToString(pcl.curPlayer.goal));
                }
            }
        }
        pcl.isBreak=false;
        pcl.aiFrame=0;
    });
    
    g_poolSim.on("ball_sunk",function(ball){
        if(!pcl.shotStarted)
            return;

        var bgoal=ballGoal(ball.index);
        if(bgoal==GOAL_8BALL){
            if(pcl.curPlayer.goal!=GOAL_8BALL){
                if(pcl.isBreak){
                    pcl.report("Player:"+pcl.curPlayerIndex+" GOT AN 8BALL BREAK!!");                    
                    pcl.goalBallSunk=false;
                }else{
                    //GAME OVER, EARLY 8 BALL
                    pcl.report("Player:"+pcl.curPlayerIndex+" has lost.");
                    pcl.goalBallSunk=false;
                }
            }else{
                //GAME OVER, WIN WITH 8 BALL!!!
                pcl.report("Player:"+pcl.curPlayerIndex+" has won!!");
                pcl.goalBallSunk=true;
            }
            pcl.gameOver=true;
            pcl.report("GAME OVER");
        }else{
            if(pcl.sidesChosen==false || bgoal==pcl.curPlayer.goal){
                pcl.goalBallSunk=true;
                pcl.report("Player:"+pcl.curPlayerIndex+" sank a target ball...");
                
                if(pcl.sidesChosen==false && pcl.isBreak==false){
                    pcl.sidesChosen=true;
                    pcl.report("Player:"+pcl.curPlayerIndex+" taking "+pcl.goalToString(bgoal));
                    pcl.curPlayer.goal=bgoal;
                    pcl.players[(pcl.curPlayerIndex+1)%pcl.players.length].goal=(bgoal==GOAL_SOLIDS)?GOAL_STRIPES:GOAL_SOLIDS;
                    
                    g_poolSim.curPlayerGoal=pcl.curPlayer.goal;
                }
            }
        }
    });
    
    g_poolSim.on("balls_hit",function(msg){
        if(!pcl.shotStarted)
            return;
        var ball=msg.nearestA;
        var ballB=msg.nearestB;
        if(ball.index!=15){ball=msg.nearestB;ballB=msg.nearestA;}
        if(ball.index==15){
            var bgoal=ballGoal(ballB.index);
            if(pcl.shotHadContact==false){
                pcl.shotHadContact=true;
                if(pcl.sidesChosen==false || pcl.curPlayer.goal==bgoal && (bgoal==GOAL_STRIPES||bgoal==GOAL_SOLIDS)){
                    pcl.shotValidContact=true;
                    pcl.report("Player:"+pcl.curPlayerIndex+" had a valid ball contact...");
                }
            }
        }
    });    
}


var g_poolSim=null;
var ballRadius=1.0;

var g_dynamicCanvas=document.getElementById("dynamicCanvas");
var dynCtx = g_dynamicCanvas.getContext('2d');
var g_paused=true;
var g_viewZoom=10.0;
var g_worldViewOrigin=[0,0];
var g_screenViewOrigin=[0,0];

var g_mouseDown=false;
var g_lastMouseCoord=[0,0];
var g_ballsInPlay=false;


function Ball(){
    
    this.position=[0,0,0]
    this.rotation=[0,0,0,1]
    this.velocityL=[0,0,0]
    this.velocityA=[0,0,0]
    this.radius=1.0
    this.mass=1.0
    this.isSphere = true;
    this.enabled=true;
    this.imageDirty=true;
    this.index=0;
    this.targetPos=[0,0,0];
    this.animationFrame=0;
}

function Plane(p,n){
    this.normal=n;
    this.position=p;
    this.isPlane=true;
}


Ball.prototype.colors=[
    'yellow','blue','red','purple','orange',
    'green','brown','black','yellow','blue',
    'red','purple','orange','green','brown',
    'white','white','white','white','white',
];
Ball.prototype.names=[
    'one','two','three','four','five',
    'six','seven','eight','nine','ten',
    'eleven','twelve','thirteen','fourteen','fifteen','cue'
];  

v3moveTo = function(va,vb,amt){
    v3addv(va,va,v3mulv(v3t0,v3subv(v3t0,vb,va),amt));
}

q4rotatexy = function(q, x, y, angle){
    var n = Math.sqrt(x*x + y*y);
    var s = Math.sin(0.5*angle)/n;
    var q2x = x*s;
    var q2y = y*s;
    var q2w = Math.cos(0.5*angle);
    var dx, dy, dz, dw;
    dx = q[0] * q2w + q[3] * q2x - q[2] * q2y;
    dy = q[1] * q2w + q[3] * q2y + q[2] * q2x;
    dz = q[2] * q2w + q[0] * q2y - q[1] * q2x;
    dw = q[3] * q2w - q[0] * q2x - q[1] * q2y;
    q[0] = dx;
    q[1] = dy;
    q[2] = dz;
    q[3] = dw;
}

q4rotatev=function(q,v){
    var vx, vy, vz, vw;
    vx = (q[3] * v[0] + q[1] * v[2] - q[2] * v[1]);
    vy = (q[3] * v[1] + q[2] * v[0] - q[0] * v[2]);
    vz = (q[3] * v[2] + q[0] * v[1] - q[1] * v[0]);
    vw = (-q[0] * v[0] - q[1] * v[1] - q[2] * v[2]);
    v[0] = vx * q[3] - vw * q[0] - vy * q[2] + vz * q[1];
    v[1] = vy * q[3] - vw * q[1] - vz * q[0] + vx * q[2];
    v[2] = vz * q[3] - vw * q[2] - vx * q[1] + vy * q[0];
}


q4normalize=function( q){
    var len = Math.sqrt(q[0]*q[0] + q[1]*q[1] + q[2]*q[2] + q[3]*q[3]);
    q[0] /= len;
    q[1] /= len;
    q[2] /= len;
    q[3] /= len;
}

function getSpherePointInterceptT(pa,pb,sumRadii,movevec)
{
    // Early Escape test: if the length of the movevec is less
    // than distance between the centers of these circles minus 
    // their radii, there's no way they can hit. 
    var dist = v3len(v3subv(v3t0,pb,pa));
    dist -= sumRadii;
    if(v3len(movevec) < dist)return 2.0;
    
    // Normalize the movevec
    var N=v3normalizev(v3t0,movevec);
    
    // Find C, the vector from the center of the moving 
    // circle A to the center of B
    var C = v3subv(v3t1,pb,pa);
    
    // D = N . C = ||C|| * cos(angle between N and C)
    var D = v3dot(N,C);
    
    // Another early escape: Make sure that A is moving 
    // towards B! If the dot product between the movevec and 
    // B.center - A.center is less that or equal to 0, 
    // A isn't isn't moving towards B
    if(D <= 0)return 2.0;
    
    // Find the length of the vector C
    var lengthC = v3len(C);
    var F = (lengthC * lengthC) - (D * D);
    
    // Escape test: if the closest that A will get to B 
    // is more than the sum of their radii, there's no 
    // way they are going collide
    var sumRadiiSquared = sumRadii * sumRadii;
    if(F >= sumRadiiSquared)return 2.0;
    
    // We now have F and sumRadii, two sides of a right triangle. 
    // Use these to find the third side, sqrt(T)
    var T = sumRadiiSquared - F;
    
    // If there is no such right triangle with sides length of 
    // sumRadii and sqrt(f), T will probably be less than 0. 
    // Better to check now than perform a square root of a 
    // negative number. 
    if(T < 0)return 2.0;
    
    // Therefore the distance the circle has to travel along 
    // movevec is D - sqrt(T)
    var distance = D - Math.sqrt(T);

    // Get the magnitude of the movement vector
    var mag = v3len(movevec);

    // Finally, make sure that the distance A has to move 
    // to touch B is not greater than the magnitude of the 
    // movement vector. 
    if(mag < distance)return 2.0;

    // Set the length of the movevec so that the circles will just 
    // touch
    //movevec.normalize();
    //movevec.times(distance);
    return distance/mag;
    
}

function getSphereSphereInterceptT(sa,sb,movevec)
{
    // Early Escape test: if the length of the movevec is less
    // than distance between the centers of these circles minus 
    // their radii, there's no way they can hit. 
    var dist = v3len(v3subv(v3t0,sb.position,sa.position));
    var sumRadii = (sb.radius + sa.radius);
    dist -= sumRadii;
    if(v3len(movevec) < dist)return 2.0;
    
    // Normalize the movevec
    var N=v3normalizev(v3t0,movevec);
    
    // Find C, the vector from the center of the moving 
    // circle A to the center of B
    var C = v3subv(v3t1,sb.position,sa.position);
    
    // D = N . C = ||C|| * cos(angle between N and C)
    var D = v3dot(N,C);
    
    // Another early escape: Make sure that A is moving 
    // towards B! If the dot product between the movevec and 
    // B.center - A.center is less that or equal to 0, 
    // A isn't isn't moving towards B
    if(D <= 0)return 2.0;
    
    // Find the length of the vector C
    var lengthC = v3len(C);
    var F = (lengthC * lengthC) - (D * D);
    
    // Escape test: if the closest that A will get to B 
    // is more than the sum of their radii, there's no 
    // way they are going collide
    var sumRadiiSquared = sumRadii * sumRadii;
    if(F >= sumRadiiSquared)return 2.0;
    
    // We now have F and sumRadii, two sides of a right triangle. 
    // Use these to find the third side, sqrt(T)
    var T = sumRadiiSquared - F;
    
    // If there is no such right triangle with sides length of 
    // sumRadii and sqrt(f), T will probably be less than 0. 
    // Better to check now than perform a square root of a 
    // negative number. 
    if(T < 0)return 2.0;
    
    // Therefore the distance the circle has to travel along 
    // movevec is D - sqrt(T)
    var distance = D - Math.sqrt(T);

    // Get the magnitude of the movement vector
    var mag = v3len(movevec);

    // Finally, make sure that the distance A has to move 
    // to touch B is not greater than the magnitude of the 
    // movement vector. 
    if(mag < distance)return 2.0;

    // Set the length of the movevec so that the circles will just 
    // touch
    //movevec.normalize();
    //movevec.times(distance);
    return distance/mag;
}


var v3tmpcache=null;
var v3tmptop=-1;
function v3tmp(){
    if(v3tmpcache==null){
        v3tmpcache=new Array(256);
        for(var t=0;t<256;t++)v3tmpcache[t]=[0,0,0];
    }
    return v3tmpcache[(++v3tmptop)%256];
}

/*
function getSphereLineInterceptT(ba,va,vb,lineVector,movevec){
    var pa=v3copy(v3tmp(),ba.position);
    var pb=v3addv(v3tmp(),ba.position,movevec);
    var vlen=v3dot(v3subv(v3tmp(),vb,va),lineVector);
    //var vla=v3dot(v3subv(v3tmp(),ba.position,va),lineVector);
    var sb=v3tmp();//
    v3subv(sb,v3addv(sb,ba.position,deltaV),t.verts[vi]);
//    if(vlen<)
    var ic=getSpherePointInterceptT(ba.position,va,ba.radius,movevec);
    if(ic<2.0)return ic;
    ic=getSpherePointInterceptT(ba.position,vb,ba.radius,movevec);
    if(ic<2.0)return ic;
    return 2.0;
}
*/

function getTriangleInterceptT(ba,t,deltaV,partId){
    var rad=ba.radius;
    var possibleVertex=-1;
    var da,db;
    var nearestT=2.0;
    partId.value=-1;
    for(var vi=0;vi<3;vi++){
        var sa=v3subv(v3t4,ba.position,t.verts[vi]);
        var sb=v3subv(v3t5,v3addv(v3t5,ba.position,deltaV),t.verts[vi]);
        if(vi==0){
            da=v3dot(sa,t.faceNormal);
            db=v3dot(sb,t.faceNormal);
            if((da>rad&&db>rad)||
                (da<-rad&&db<-rad))
                return 2.0; //No face plane collision early exit..
        }
        
        da=v3dot(sa,t.edgeNormals[vi])+ba.radius;
        db=v3dot(sb,t.edgeNormals[vi])+ba.radius;
        
        if((da>=0.0&&db<0.0) ||
            (da<0.0&&db<0.0) || (da>=0.0&&db>=0.0))
            continue;   //No edge plane intersection or exiting plane (unpossible!)
        //if(da<0.0&&db>=0.0)
        {
            var ic=Math.abs(da)/(Math.abs(da)+Math.abs(db));            
            sb=v3subv(v3t5,v3addv(v3t5,ba.position,v3mulv(v3t5,deltaV,ic)),t.verts[vi]);
            da=v3dot(sb,t.edgeVectors[vi]);
            
            //Sb is now the sphere pos projected onto edge plane minus the vert..
            //Check if sphere is off this edge..
            if(da>=0.0&&da<=t.edgeLengths[vi])
            {
                if(ic<nearestT){
                    partId.value=vi*2;//0 2 4 for edges... 1 3 5 for vertices
                    nearestT=ic;
                }
            }
        }
    }
    for(vi=0;vi<3;vi++){
        //Check sphere->point against possibleVertex
        var isp=getSpherePointInterceptT(ba.position,t.verts[vi],ba.radius,deltaV);
        if(isp<nearestT){
            partId.value=(vi*2)+1;
            nearestT=isp;
        }
    }
    return nearestT;
}

function getPlaneInterceptT(ba,pb,deltaV){
    var sa=v3subv(v3t4,ba.position,pb.position);
    var sb=v3subv(v3t5,v3addv(v3t5,ba.position,deltaV),pb.position);
    
    var da=v3dot(sa,pb.normal)-ba.radius;
    var db=v3dot(sb,pb.normal)-ba.radius;
    if((da>0.0&&db<0.0)||(da<0.0&&db>0.0))
        return Math.abs(da)/(Math.abs(da)+Math.abs(db));
    return 2.0;// pb.normal
}

//Bar Pool table is 7ft by 3.5ft, playable area
function PoolSim(canvas){
    this.cueAngle=0.0;
    this.lastCuePull=0.0;
    this.cuePull=0.0;
    this.cueTarget=[0,0,0];
    this.bodies=new Array(16);
    this.tableLength=50;
    this.tableWidth=this.tableLength/2;
    var htl=this.tableLength/2;
    var htw=this.tableWidth/2;
    this.planes=[
        new Plane([0,0,2],[0,0,1]),
        new Plane([htw,0,0],[-1,0,0]),
        new Plane([-htw,0,0],[1,0,0]),
        new Plane([0,-htl,0],[0,1,0]),
        new Plane([0,htl,0],[0,-1,0])
    ];
    this.pocketLocations=[
        [-htw,0,0],
        [ htw,0,0],
        [-htw,-htl,0],
        [-htw, htl,0],
        [ htw,-htl,0],
        [ htw, htl,0],
    ];
    for(var i=0;i<this.bodies.length;i++){
        var b=this.bodies[i]=new Ball();
        var rax=Math.random()*Math.PI;
        var rang=Math.random()*Math.PI*2.0;
        b.index=i;
        q4rotatexy(b.rotation,Math.sin(rax),Math.cos(rax),rang);
        q4normalize(b.rotation);
    }
    this.subSteps=0;
    this.sumEnergy=0.0;
    this.requiredImageCount=6;
    this.loadedImageCount=0;
    //this.testTri=colTri([0,-10,0],[-7,-21,0],[7,-21,0]);
    this.testTri=colTri([30,-7,0],[30+-10,13,0],[30+10,13,0]);
    this.initGame=function(){
        this.createImageBuffers();
        this.addHandlers();
        var iosocket=connectToChatServer();
        iosocket.on("connect",function(){
            networkAttachClientListeners();
        })
    }
    
    this.assetLoaded=function(){
        this.loadedImageCount++;
        if(this.loadedImageCount==this.requiredImageCount){
            this.initGame();
        }
    }
    
    this.rackPos = function (pos,idx,rad){
        idx=[0,9,14,3,7,5,6,4,8,1,10,11,12,13,2,15,16][idx];
        var rowIdxs=[0,1,1,2,2,2,3,3,3,3,4,4,4,4,4];
        var rowBases=[0,1,1,3,3,3,6,6,6,6,10,10,10,10,10];
        var row=rowIdxs[idx];
        var col=idx-rowBases[idx];
        pos[0]=(col*1.0*rad)-(row*rad*0.5);
        pos[1]=(row*-0.880*rad);
        pos[1]-=this.tableLength*0.25;
       // pos[1]-=rad*5.5;
    }
    
    this.rerack = function(){
        for(var i=0;i<this.bodies.length;i++){
            var b=this.bodies[i];
            v3set(b.velocityL,0,0,0);
            b.enabled=true;
            b.animationFrame=0;
        }
        for(i=0;i<15;i++){
            this.rackPos(this.bodies[i].position,i,2.000001);
            this.bodies[i].rotation=[0,0,0,1];
            q4rotatexy(this.bodies[i].rotation, 1.0,0.0,Math.PI*0.5);
            q4rotatexy(this.bodies[i].rotation, 0.0,1.0,Math.PI*0.5);
        }
        this.bodies[15].position[0]=this.bodies[0].position[0]+(this.tableWidth*0.15);
        this.bodies[15].position[1]=this.bodies[0].position[1]+(this.tableLength*0.6);//280.0;
        this.bodies[15].velocityL[0]=0.0;
        this.bodies[15].velocityL[1]=0.0;//-5.5;//-15.22;
        this.broadcast("balls_racked");
    }
     // shim layer with setTimeout fallback
    window.requestAnimFrame = (function(){
      return  window.requestAnimationFrame       || 
              window.webkitRequestAnimationFrame || 
              window.mozRequestAnimationFrame    || 
              window.oRequestAnimationFrame      || 
              window.msRequestAnimationFrame     || 
              function( callback ){
                window.setTimeout(callback, 1000 / 60);
              };
    })();

    this.setPaused=function(paused){
        if(paused==g_paused)
            return;
        g_paused=paused;
    }
    this.strokeStarted=false;
    this.strokeStartTime = new Date().getTime();
    this.strokeSampStart = new Date().getTime();
    this.strokeStartPull = 0.0;
    this.lastStrokeForce=0.0;
    
    this.lastStrokeAngle=0.0;
    
    this.replayBreak = function(){
        var cueBall=this.bodies[15];
        var fvec=[Math.sin(this.lastStrokeAngle)*this.lastStrokeForce,-Math.cos(this.lastStrokeAngle)*this.lastStrokeForce,0.0];
        cueBall.velocityL=fvec;            
        this.setPaused(false);
    }
    this.getCueVector = function(vec,ang,force){
        v3set(vec,Math.sin(ang)*force,-Math.cos(ang)*force,0.0);        
        return vec;
    }
    this.forceToVolume = function(f){
        if(f>10.0)return 1;
        return ((f/10.0)*0.9)+0.1;
    
    }
    
    this.pullForce = 0.0;
    
    this.updateCue = function(){
        var cueHitThresh=0.4;
        var cueBall=this.bodies[15];
        if(this.lastCuePull!=this.cuePull&&!g_ballsInPlay){
            //Hit cue ball with cue tip
                var now=new Date().getTime();
            
            if(this.lastCuePull>this.cuePull){
                if(this.strokeStarted==false){
                    this.strokeStarted=true;
                    this.strokeStartTime=new Date().getTime();
                    this.strokeStartPull=this.lastCuePull;
                }else if(now>this.strokeStartTime){
                    this.pullForce=(this.strokeStartPull-this.cuePull)/(now-this.strokeStartTime);
                    this.pullForce*=20.0;
                    if(this.pullForce<0.001)this.pullForce=0.001;
                    if(this.pullForce>7.0)this.pullForce=7.0;
                }

            }else{
                this.strokeStarted=false;
                this.pullForce=0;            
            }
            
            if(this.lastCuePull>=cueHitThresh && this.cuePull<cueHitThresh){
                var strokeTime=now-this.strokeSampStart;
                this.strokeSampStart=now;
                
                var force=this.pullForce;
                
                this.lastStrokeForce=force;
                this.lastStrokeAngle=this.cueAngle;
                this.takeTheShot(this.cueAngle,force);
            }
        }
        this.lastCuePull=this.cuePull;
        if(v3len(cueBall.velocityL)<0.003){
            v3moveTo(this.cueTarget,cueBall.position,0.1);
        }else{
            var defqstroke=2.0;
            this.cuePull+=(defqstroke-this.cuePull)*0.1;
            
        }
//            v3copy(this.cueTarget,cueBall.position);
    }

    this.checkBallInPocket = function(ball) {
        for(var i=0;i < this.pocketLocations.length;i++){
            v3subv(v3t0,ball.position,this.pocketLocations[i]);
            if(v3dot(v3t0,v3t0) < (2.0*2.0)){
                console.log("Sunk:"+Ball.prototype.names[ball.index] + " ball.");
                this.broadcast("ball_sunk",ball);
                ball.enabled=false;
                ball.animationFrame=0;  //Start the ball tunneling into the pocket
                v3copy(ball.targetPos,v3mulv(v3t0,this.pocketLocations[i],1.03));
            }
        }
    }
    
    this.drawRails=function(ctx){
        ctx.fillStyle="#1F3F0F";
        for(var i=0;i<this.planes.length;i++){
            var p=this.planes[i];
            var swapNormal=[p.normal[1],p.normal[0]*-1,0.0];
            ctx.beginPath();
            ctx.moveTo(p.position[0]+(swapNormal[0]*-30.0),p.position[1]+(swapNormal[1]*-30.0));
            ctx.lineTo(p.position[0]+(swapNormal[0]*30.0),p.position[1]+(swapNormal[1]*30.0));
            
            ctx.stroke();
            //ctx.fillRect(p.position[0],p.position[1],p.normal.x*1.0,swapNormal.y*20.0);
        }
    }
    
    this.drawTri=function(ctx,tri){
        ctx.strokeStyle="#FF00FF";
        ctx.beginPath();
        ctx.moveTo(tri.verts[0][0],tri.verts[0][1]);
        ctx.lineTo(tri.verts[1][0],tri.verts[1][1]);
        ctx.lineTo(tri.verts[2][0],tri.verts[2][1]);
        ctx.lineTo(tri.verts[0][0],tri.verts[0][1]);
        ctx.stroke();
        this.drawPockets(ctx);
    }

    this.drawPockets=function(ctx){
        ctx.beginPath();
        for(var i=0;i < this.pocketLocations.length;i++){
            var loc=this.pocketLocations[i];
            ctx.moveTo(loc[0]-1,loc[1]);
            ctx.lineTo(loc[0]+1,loc[1]);
            ctx.moveTo(loc[0],loc[1]-1);
            ctx.lineTo(loc[0],loc[1]+1);
        }
        ctx.stroke();
    }
    
    this.findScratchSetups = function(goal){
        //TODO: pick an empty spot in the kitchen..
        var cueBall=this.bodies[15];
        var setups=[];
        for(var x=-5;x<6;x++)
        for(var y=7;y<13;y++){
            v3set(v3t1,ballRadius*x*2,y*ballRadius*2,0.0);
            var bad=false;
            for(var bi=0;bi<this.bodies.length;bi++){
                var b=this.bodies[bi];
                if(b==cueBall)continue;
                if(v3len(v3subv(v3t0,b.position,v3t1))<(ballRadius*2))
                {
                    bad=true;
                    break;
                }
            }
            //Found a valid spot
            if(!bad){
                var pos=vec3(v3t1);
                var cuePos=vec3(cueBall.position);
                v3copy(cueBall.position,pos);
                var shots=this.getShotCandidates(goal);
                offscreenCtx.fillStyle="rgba(255,0,0,"+(shots.length/8)+")";
                offscreenCtx.fillRect(pos[0]-ballRadius,pos[1]-ballRadius,ballRadius*2,ballRadius*2);
                setups.push({position:pos,shots:shots});
                v3copy(cueBall.position,cuePos);
            }
//            v3set(ba.targetPos,0,8*ballRadius*2,0);
        }
        return setups;
    }
    
    this.hitRecord={
        nearestB:null,
        nearestA:null,
        nearestPart:0,
        nearestT:2.0
    }
    
    this.nearestPartB={value:0};
    this.bChk={value:0};
    
    this.getNearestCollision=function(){
        var nearestA=null;
        var nearestB=null;
        var nearestT=2.0;
        var tstNormal=v3t3;
        var normalAtB=v3t4;
        //Loop through all balls for timestep.. find earliest collision
        for( i=0;i<this.bodies.length;i++){
            ba=this.bodies[i];
            if(ba.enabled==false||(ba.velocityL[0]==ba.velocityL[1]==ba.velocityL[2]==0))
                continue;
            for(var j=0;j<this.bodies.length;j++){
                var bb=this.bodies[j];
                if(ba==bb || (bb.enabled==false))
                    continue;
                var deltaV=v3subv(v3t7,ba.velocityL,bb.velocityL);
                var colT=getSphereSphereInterceptT(ba,bb,deltaV);
                if(colT<nearestT){
                    nearestT=colT;
                    nearestA=ba;
                    nearestB=bb;
                }
            }
            for(j=0;j<this.planes.length;j++){
                var pb=this.planes[j];
                deltaV=v3copy(v3t7,ba.velocityL);
                colT=getPlaneInterceptT(ba,pb,deltaV);
                if(colT<nearestT){
                    nearestT=colT;
                    nearestA=ba;
                    nearestB=pb;
                }
            }
            
            deltaV=v3copy(v3t7,ba.velocityL);
            colT=getTriangleInterceptT(ba,this.testTri,deltaV,this.bChk);
            if(colT<nearestT){
                nearestT=colT;
                nearestA=ba;
                nearestB=this.testTri;
                this.nearestPartB.value=this.bChk.value;
            }
        }
        if(nearestB==null){

            return false;
        }
//        if((nearestT>1.0&&nearestT!=2.0)||nearestT<0.0)
//            nearestT=1.0;
        this.hitRecord.nearestA=nearestA;
        this.hitRecord.nearestB=nearestB;
        this.hitRecord.nearestT=nearestT;
        this.hitRecord.nearestPart=this.nearestPartB.value;
        return true;
    
    }
    
    this.curPlayerGoal=this.GOAL_SOLIDS;
    
    this.takeTheShot = function(angle,force){
        var cueBall=this.bodies[15];
        this.getCueVector(cueBall.velocityL,angle,force);
        this.setPaused(false);
        this.playSound("ballCue",this.forceToVolume(force));
        console.log("Cue strike:"+force);
        this.broadcast("cue_strike");
    }
    
    this.update = function(ctx) {
        
        this.updateCue();
        
        var  stepTime=0.0;
        this.subSteps=0;
        this.sumEnergy=0.0;
        this.startEnergy=0.0;

        //Compute total energy... and update animations
        for(var i=0;i<this.bodies.length;i++){
            var ba=this.bodies[i];
            if(ba.enabled==false){
                ba.animationFrame++;
                if(ba.animationFrame==60){  //Move the dropped ball to its storage spot
                    if(ba.index<8)
                        v3set(ba.targetPos,this.tableWidth*0.8,(ba.index+1)*ballRadius*2,0);    //Solids
                    else if(ba.index==15){//Cue ball
                        this.broadcast("cue_scratch");
                        //this.findScratchSetups(this.curPlayerGoal);
                    }else
                        v3set(ba.targetPos,this.tableWidth*0.8,-(ba.index-7)*ballRadius*2,0);//Stripes
                }
                if(ba.animationFrame<128)
                    v3moveTo(ba.position,ba.targetPos,0.2);
                else if(ba.animationFrame==128){
                    if(ba.index==15){//Cue ball
                        v3copy(ba.position,ba.targetPos);
                        v3set(ba.velocityL,0,0,0);
                        ba.enabled=true;                        
                    }
                }else
                    v3mulv(ba.velocityL,ba.velocityL,0.97)
                
                continue;
            }
            if(ba.velocityL[0]==ba.velocityL[1]==ba.velocityL[2]==0)
                continue;
            this.startEnergy+=v3len(ba.velocityL);
        }
        
        
        while(stepTime<1.0){
            var stepLength=1.0-stepTime;
            
            //Check for collisions...
            if(!this.getNearestCollision()){
                for(i=0;i<this.bodies.length;i++){  //No collision so Advance full timestep sim to T and bails
                    ba=this.bodies[i];
                    if(ba.enabled){
                        v3addv(ba.position,ba.position,v3mulv(v3t2,ba.velocityL,stepLength));
                    }
                }
                break;
            }
            //Resolve collision..
            var nearestA=this.hitRecord.nearestA;
            var nearestB=this.hitRecord.nearestB;
            var nearestT=this.hitRecord.nearestT;
            var nearestPart=this.hitRecord.nearestPart;
            //nearestT*=0.99999999;
            for(i=0;i<this.bodies.length;i++){  //Advance sim to T
                ba=this.bodies[i];
                if(ba.enabled)
                    v3addv(ba.position,ba.position,v3mulv(v3t2,ba.velocityL,stepLength*nearestT));
                    //v3addv(ba.position,ba.position,v3mulv(v3t2,ba.velocityL,nearestT));
            }
            //Resolve collision at T
            if(nearestB.isSphere){
                //Sphere sphere collision
                var cnormal=v3normalizev(v3t0,v3subv(v3t0,nearestA.position,nearestB.position));
                var da=v3dot(nearestA.velocityL,cnormal);
                var db=v3dot(nearestB.velocityL,cnormal);
                var pops = (2.0 * (da - db)) / (nearestA.mass + nearestB.mass);
                v3subv(v3t1,nearestA.velocityL,v3mulv(v3t1,cnormal,pops * nearestB.mass));
                v3addv(v3t2,nearestB.velocityL,v3mulv(v3t2,cnormal,pops * nearestA.mass));
                v3copy(nearestA.velocityL,v3t1);
                v3copy(nearestB.velocityL,v3t2);
                
                var force=Math.abs(db-da);
                this.playSound("ballBall",this.forceToVolume(force));
                this.broadcast("balls_hit",this.hitRecord);
            }else if(nearestB.isPlane){
                //Plane collision...
                da=v3dot(nearestA.velocityL,nearestB.normal);
                v3addv(nearestA.velocityL,nearestA.velocityL,v3mulv(v3t0,nearestB.normal,-2.0*da));
                this.checkBallInPocket(nearestA);
                
                this.playSound("ballRail",this.forceToVolume(Math.abs(da)));

            }else{  //We've hit a triangle...
                var part=nearestPart;
                if((part&1)===0){//Hit edge
                    part=parseInt(part/2);
                    da=v3dot(nearestA.velocityL,nearestB.edgeNormals[part]);
                    v3addv(nearestA.velocityL,nearestA.velocityL,v3mulv(v3t0,nearestB.edgeNormals[part],-2.0*da));
                    console.log("hit edge:"+part);
                }else{  //Hit corner vertex
                    part=parseInt(part/2);
                    v3mulv(v3t1,v3subv(v3t1,nearestA.position,nearestB.verts[part]),1.0/nearestA.radius);
                    da=v3dot(nearestA.velocityL,v3t1);
                    v3addv(nearestA.velocityL,nearestA.velocityL,v3mulv(v3t0,v3t1,-2.0*da));
                    console.log("hit corner:"+part);
                }
            }
            //v3set(nearestA.velocityL,0,0,0);
            stepTime=nearestT;
            this.subSteps++;
            if(this.subSteps>300)
                break;
        }
        
        this.sumEnergy=0.0;
        for(i=0;i<this.bodies.length;i++){  //Apply frictions
            ba=this.bodies[i];
            var vmag=v3len(ba.velocityL);
            this.sumEnergy+=vmag;
            
            var fric=0.98;
            if(vmag<0.05)fric=0.95;
            else if(vmag<0.1)fric=0.99;
            v3mulv(ba.velocityL,ba.velocityL,fric);
        }
        
        if(this.sumEnergy>0.01){
            if(g_ballsInPlay==false){
                this.broadcast("sim_awake");
                g_ballsInPlay=true;
            }
        }else{
            if(g_ballsInPlay==true){
                this.broadcast("sim_asleep");
                g_ballsInPlay=false;
            }
        }
        this.broadcast("frame");
        /*
        if(this.sumEnergy!=0.0){//Conserve the energy...
            var escale=this.startEnergy/this.sumEnergy;
            //escale *= 0.98;    //Lose energy
            for(i=0;i<this.bodies.length;i++){
                ba=this.bodies[i];
                if(ba.velocityL[0]==ba.velocityL[1]==ba.velocityL[2]==0)
                    continue;
                v3mulv(ba.velocityL,ba.velocityL,escale);
            }
        }*/
        this.draw();
    }
    
    this.updateViewTransform = function(ctx){
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.lineWidth=1.0/g_viewZoom;
        ctx.translate((ctx.canvas.width / 2), (ctx.canvas.height / 2));
        ctx.scale(g_viewZoom,g_viewZoom);
        ctx.translate(g_worldViewOrigin[0],g_worldViewOrigin[1]);
        //ctx.rotate(Math.PI*0.5);
    }



    this.audioChannels=null;
    this.audioChannelTop=0;
    this.loadedSounds={};
    this.maxSoundChannels=16;    
    this.playSound=function(name,volume){
        var snd=this.loadedSounds[name];
        if(!snd){
            snd=this.loadedSounds[name]=document.getElementById(name);
            if(snd==null){
                console.log("sound missing:"+name);
                return;
            }
        }
        if(this.audioChannels==null){
            this.audioChannels=[];
            for(var ci=0;ci<this.maxSoundChannels;ci++){
                this.audioChannels.push(document.createElement("audio"));
            }
        }
        for(var t=0;t<this.maxSoundChannels;t++){
            var chan=this.audioChannels[this.audioChannelTop++];
            this.audioChannelTop=this.audioChannelTop % this.audioChannels.length;
            if(chan.paused){
                chan.src=snd.src;
                chan.volume=volume?volume:1.0;
                chan.play();
                break;
            }
        }
    }
    
    this.loadFrame=0;
    
    this.drawLoadScreen = function(){

        var ctx=dynCtx;
        ctx.strokeStyle="#000000"
        ctx.fillStyle="#003F00";
        //ctx.fillStyle = "rgba(0, 70, 0, 0.1)";
        ctx.fillStyle = "rgba(0, 70, 0, 0.5)";
        ctx.fillRect(-ctx.canvas.width,-ctx.canvas.height,ctx.canvas.width*2.0,ctx.canvas.height*2.0);
       
        ctx.fillStyle='white';
        ctx.lineStyle='white';
        ctx.font="1px sans-serif";
        ctx.fillText("Loading...", 0,0);

        this.loadFrame++;
    }
    
    this.getShotCandidates = function(goal,isScratch){
        var potentialShots=[];
        var startIndex=8;
        var endIndex=15;

        if(goal==GOAL_SOLIDS)
        {
            startIndex=0;
            endIndex=7;
        }else if(goal==GOAL_8BALL){
            startIndex=7;
            endIndex=8;
        }else if(goal==GOAL_OPEN){
            startIndex=0;
            endIndex=15;
        }
        var cueBall=this.bodies[15];
        for(var idx=startIndex;idx<endIndex;idx++){
            var ba=this.bodies[idx];
            if(goal==GOAL_OPEN && idx==7){
                //If searching for open table shot, skip the 8 ball...
                continue;
            }
            if(!ba.enabled)
                continue;
            var kitchenLine=this.tableLength*0.25;
            
            if(isScratch&&ba.position[1]<kitchenLine)   //If it was a scratch, don't consider targets in the kitchen...
                continue;
            for(var pi=0;pi<this.pocketLocations.length;pi++){
                var ploc=v3copy(v3t11,this.pocketLocations[pi]);

                if(ploc[1]>0)ploc[1]-=ballRadius*0.99;
                else if(ploc[1]<0)ploc[1]+=ballRadius*0.99;
                if(ploc[0]>0)ploc[0]-=ballRadius*0.99;
                else if(ploc[0]<0)ploc[0]+=ballRadius*0.99;

                var dpock=v3t9;
                v3subv(dpock,ploc,ba.position)
                v3copy(v3t8,ba.velocityL);
                v3copy(ba.velocityL,dpock);
                if(this.getNearestCollision()){
                    if(!this.hitRecord.nearestB.isSphere||!this.hitRecord.nearestA.isSphere){
                        //Can hit the pocket
                        var dist=v3len(dpock);
                        potentialShots.push({
                            ball:ba,
                            target:vec3(ploc),
                            ack:vec3(v3addv(dpock,ba.position,v3mulv(dpock,dpock,(1.0/dist)*-2.0*ballRadius))),
                            dist:dist
                        });
                    }
                }
                v3copy(ba.velocityL,v3t8);                    
            }
        }
        
        var reachableShots=[];
        for(var ps=0;ps<potentialShots.length;ps++){
            var s=potentialShots[ps];
            v3copy(v3t8,cueBall.velocityL);
            
            dpock=v3t9;
            v3subv(dpock,s.ack,cueBall.position)
            v3copy(v3t8,cueBall.velocityL);
            v3mulv(cueBall.velocityL,dpock,1.001);
            if(this.getNearestCollision()){
                if(this.hitRecord.nearestA==s.ball && this.hitRecord.nearestB==cueBall)
                {
                    var incidence=v3dot(v3normalizev(v3t1,v3subv(v3t1,s.ack,cueBall.position)),v3normalizev(v3t0,v3subv(v3t0,s.ack,s.ball.position)));
                    if(incidence<0.0){
                        s.incidence=incidence;
                        reachableShots.push(s);
                    }
                }
            }
            v3copy(cueBall.velocityL,v3t8);       
        }
        
        for(var rs=0;rs<reachableShots.length;rs++){
            s=reachableShots[rs];
            var idim=0.25;
            var id2=idim*2;
            offscreenCtx.beginPath();
            //if(v3dot(v3subv(v3t1,s.ack,cueBall.position),v3subv(v3t0,s.ack,s.ball.position))<0.0)
                offscreenCtx.strokeStyle="red";
            //else
            //    continue;//offscreenCtx.strokeStyle="black";
            
            offscreenCtx.moveTo(cueBall.position[0],cueBall.position[1]);
            offscreenCtx.lineTo(s.ack[0],s.ack[1]);
            offscreenCtx.moveTo(s.ball.position[0],s.ball.position[1]);
            offscreenCtx.lineTo(s.target[0],s.target[1]);
            
        offscreenCtx.stroke();
            offscreenCtx.drawImage(compCanvases[7],s.ack[0]-idim,s.ack[1]-idim,id2,id2);
        }
        return reachableShots;
    }

    var routingTable={};
    this.on=function(msg,fn){
        if(routingTable[msg]) routingTable[msg]={next:routingTable[msg],fn:fn};
        else routingTable[msg]={fn:fn};
    }
    
    this.broadcast=function(message,data){
        var rt=routingTable[message];
        if(rt)for(;rt;rt=rt.next)rt.fn(data);
        //console.log("broadcast:"+message);
    }
    
    this.draw = function(){

        if(imgBuffers==null)    //Not loaded yet, so bail...
        {
            this.drawLoadScreen();
            return;
        }
        var ctx=offscreenCtx;
        if(ctx.canvas.width!=window.innerWidth||ctx.canvas.height!=window.innerHeight){
            ctx.canvas.width=window.innerWidth;
            ctx.canvas.height=window.innerHeight;

            dynCtx.canvas.width=window.innerWidth;
            dynCtx.canvas.height=window.innerHeight;
            
        }
        this.updateViewTransform(ctx);

    //
    //          g_dynamicCanvas.height = window.innerHeight;
    //    else
    //        g_dynamicCanvas.width = document.documentElement.offsetWidth;
        
        ctx.strokeStyle="#000000"
        ctx.fillStyle="#003F00";
        
        //ctx.fillStyle = "rgba(0, 70, 0, 0.1)";
        ctx.fillStyle = "rgba(0, 70, 0, 1.0)";
        ctx.fillRect(-ctx.canvas.width,-ctx.canvas.height,ctx.canvas.width*2.0,ctx.canvas.height*2.0);
        
        var railSize=2.85*this.tableLength/50;
 //       ctx.drawImage(tableCanvas,-(htw+railSize),-(htl+railSize),this.tableWidth+(railSize*2),this.tableLength+(railSize*2));
        
        //ctx.drawImage(cueCanvas,-64/32,this.cuePull,128/32,1024/32);
        
        //this.drawRails(ctx);
        //this.drawPockets(ctx);
        
        ctx.drawImage(tableCanvas,-(htw+railSize),-(htl+railSize),this.tableWidth+(railSize*2),this.tableLength+(railSize*2));
        
        //context.lineWidth=1;
        ctx.fillStyle='white';
        ctx.lineStyle='white';
        ctx.font="1px sans-serif";
        ctx.fillText("s:"+this.subSteps+" e:"+(""+this.sumEnergy).substring(0,6), -12, -25.25);
        
        
        //this.getShotCandidates(this.curPlayerGoal);
        //this.findScratchSetups(this.curPlayerGoal);
        
        for(i=0;i<this.bodies.length;i++){  //Draw the balls
            ba=this.bodies[i];
            if(i>4)
                ctx.strokeStyle='white';
            
            //ctx.fillStyle=Ball.prototype.colors[i];
            //ctx.beginPath();
            //ctx.arc(ba.position[0],ba.position[1],ba.radius,2*Math.PI,false);
            //ctx.fill();
            //ctx.stroke();
            this.renderBall(ctx,i);
        }
        
        /*
        for(var i=0;i<this.bodies.length;i++){  //Draw the intercepts
            var ba=this.bodies[i];

            if(ba.velocityL[0]==0.0&&ba.velocityL[1]==0.0)continue;
            var it=getSphereSphereInterceptT(ba,this.bodies[0],ba.velocityL)
            if(it<1.0){
                ctx.beginPath();
                var bvx=ba.velocityL[0]*it;
                var bvy=ba.velocityL[1]*it;
                ctx.arc(bx+bvx,by+bvy,ba.radius,2*Math.PI,false);
                ctx.fill();
                ctx.stroke();          
            }
        }
        
        ctx.strokeStyle="#00FFFF"
        for(var i=0;i<this.bodies.length;i++){  //Draw the velocities
            var ba=this.bodies[i];
            if(ba.velocityL[0]==0.0&&ba.velocityL[1]==0.0)continue;
            ctx.beginPath();
            var bx=ba.position[0];
            var by=ba.position[1];
            ctx.moveTo(bx,by);
            ctx.lineTo(bx+(ba.velocityL[0]),by+(ba.velocityL[1]));
            //ctx.fill();
            ctx.stroke();
        }
        */
       
        
        //dbg Write the rendered ball image to the scratch buffer
        //compCtx.putImageData(imgBuffers[17+7], 0,0);// ballId*ballDim);
        ///dbg  Draw the ImageData at the balls (x,y) coordinates.
        //ctx.drawImage(compCanvas,-18.0,-30.0,4.0,4.0);
        
        var cueBall=this.bodies[15];
        ctx.translate(this.cueTarget[0],this.cueTarget[1]);  //Cueball
        ctx.rotate(this.cueAngle);
    //    if(this.cuePull<0.4)
    //        this.cuePull=0.4;
        ctx.drawImage(cueCanvas,-64/32,this.cuePull,128/32,1024/32);
        
        this.updateViewTransform(ctx);
        
        ctx.fillRect(this.tableWidth,-5.0,0.1,10);
        ctx.fillStyle="red";
        ctx.fillRect(this.tableWidth,0,0.1,this.pullForce*10.0/7.0);
        
        
        
      //  if(false && g_paused)
        if(g_ballsInPlay==false)    //Draw the 1 level hit prediction indicator
        {
            v3copy(v3t8,cueBall.velocityL); //Save the velocity
            
            for(var tang=0;tang<Math.PI*2.0;tang+=Math.PI/64)
            {
                this.getCueVector(cueBall.velocityL,this.cueAngle+tang,200.0);
                if(this.getNearestCollision()){
                    v3addv(v3t0,cueBall.position,v3mulv(v3t2,cueBall.velocityL,this.hitRecord.nearestT));

                    //compCtxs[7].putImageData(imgBuffers[17+7], 0,0);// ballId*ballDim);
                    var idim=0.25;
                    var id2=idim*2;
                    ctx.drawImage(compCanvases[7],v3t0[0]-idim,v3t0[1]-idim,id2,id2);
                    
                }
                break;
            }
            v3copy(cueBall.velocityL,v3t8); //Restore the velocity
        }
        
        this.drawTri(ctx,this.testTri);
        
        
  //      ctx.setTransform(saveTfm);//1, 0, 0, 1, 0, 0);

        
        dynCtx.drawImage(offscreenCanvas,0,0);
    }
    
    var TEX_SIZE=128;
    var ballDim=32;
    var imgBuffers = null;//new Array(ballDim*ballDim*4);
    var compCanvases = [];
    var compCtxs=[];
    var texCanvas = null;
    var texCtx=null;
    var cueCanvas = null;
    var cueImage=null;
    var tableImage=null;
    var tableCanvas=null;
    var offscreenCanvas=null;
    var offscreenCtx=null;
    
    this.createImageBuffers = function(){
        
        //Build texture compositing buffer
        texCanvas = document.createElement("canvas");
        texCanvas.style = "display:none";
        //document.body.appendChild(compCanvas);
        texCanvas.width=TEX_SIZE;
        texCanvas.height=TEX_SIZE;
        texCtx = texCanvas.getContext('2d');
        
        for(var t=0;t<17;t++){
            //Build ball compositing buffers
            var compCanvas = compCanvases[t] = document.createElement("canvas");
            compCanvas.style = "display:none";
            //document.body.appendChild(compCanvas);
            compCanvas.width=ballDim;
            compCanvas.height=ballDim;
            compCtx = compCtxs[t] = compCanvas.getContext('2d');
        }
        
        //Build table buffer/image
        tableImage=document.getElementById("tableImage");
        //Build cue buffer/image
        cueImage=document.getElementById("cueImage");
        cueCanvas = document.createElement("canvas");
        cueCanvas.style = "display:none";
        //document.body.appendChild(cueCanvas);
        cueCanvas.width=64;
        cueCanvas.height=600;
        cueCanvas.getContext('2d').drawImage(cueImage,0,0);
        
        offscreenCanvas = document.createElement("canvas");
        offscreenCtx = offscreenCanvas.getContext('2d');
        
        tableCanvas = document.createElement("canvas");
        tableCanvas.style = "display:none";
        //document.body.appendChild(cueCanvas);
        tableCanvas.width=tableImage.width;
        tableCanvas.height=tableImage.height;
        tableCanvas.getContext('2d').drawImage(tableImage,0,0);

        var rdim=TEX_SIZE;
        var hbdim=rdim/2;
        var edgeWidth=rdim*2/7;
        var dotWidth=rdim*2/15;
        
        imgBuffers=[];
        for(t=0;t<17;t++){
            texCtx.fillStyle=Ball.prototype.colors[t];
            texCtx.fillRect(0,0,rdim,rdim);
            texCtx.fillStyle='white';
            if(t>7){
                texCtx.fillRect(0,0,rdim,edgeWidth);
                texCtx.fillRect(0,rdim-edgeWidth,rdim,edgeWidth);
            }
            texCtx.beginPath();
            texCtx.scale(0.5,1.0);
            texCtx.arc(hbdim*2,hbdim,dotWidth,2*Math.PI,false);
            //compCtx.scale(1.0,1.0);
            texCtx.fill();
            texCtx.fillStyle='black';
            texCtx.font="24px sans-serif";
            var str=(t==15)?"MS":""+(t+1);
            var chrWid=dotWidth*0.3;
            texCtx.fillText(str, (hbdim*2)-(chrWid*str.length), hbdim+(dotWidth*0.5));
            texCtx.setTransform(1, 0, 0, 1, 0, 0);
            imgBuffers.push(texCtx.getImageData(0, 0, rdim, rdim));
        }

        for(t=0;t<17;t++){  //Make compositing buffers
            imgBuffers.push(compCtxs[t].getImageData(0, 0, ballDim, ballDim));
        }
        /*
        for(var im=0;im<17*2;im++){
            imgd = imgBuffers[im];
            pix = imgd.data;
            for (var i = 0, n = pix.length; i < n; i+=4)pix[i+3]=0;
        }        
        */
    }
    this.renderBall=function(ctx,ballId){
        var ball=this.bodies[ballId];
        var hbdim=ballDim/2;
        
        var pix = imgBuffers[17+ballId].data;
        var ipix = imgBuffers[ballId].data;
        
        if(!this.vertCache)
        {
            this.vertCache=new Array(ballDim*ballDim);
            var i=0;
            for( var py=0;py<ballDim;py++){
                for( var px=0;px<ballDim;px++){
                    var ix=px-hbdim;
                    var iy=py-hbdim;
                    var pi=(px+(py*ballDim))*4;
                    if((ix*ix)+(iy*iy) < (hbdim*hbdim)){
                     //   this.vertCache[i]=
                        var x = (2*px - (ballDim-0.5))/ballDim;
                        var y = (2*py - (ballDim-0.5))/ballDim;
                        var z2 = (x*x + y*y); 
                        var z = Math.sqrt(1.0 - z2);
                        this.vertCache[i]=[x,y,z];
                    }else
                        this.vertCache[i]=null;
                    i++;
                }
            }
        }
        
        if(ball.imageDirty){

            var contrast=400;//256;//400;
            var brightness=300;//256;//300;
            var lighty=0.25;
            pi=0;
            for(  py=0,vi=0;py<ballDim;py++){
                for(  px=0;px<ballDim;px++){
                    var v=this.vertCache[vi++];
                    if(v==null){pi+=4;continue;}
                    var vert=v3copy(v3t0,v);
                    //var ix=px-hbdim;
                    //var iy=py-hbdim;
                  //  var pi=(px+(py*ballDim))*4;

                     x=vert[0];
                     y=vert[1];
                     z=vert[2];

                    var alpha = parseInt(z*2.0*255);
                    if (alpha > 255) alpha = 255;
                    var brighten=((z+(-lighty*y))*contrast)-brightness;    //Add some fake lighting/shading..

                    q4rotatev(ball.rotation, vert);
                    var theta = Math.acos(vert[2]);
                    var phi = (Math.atan2(vert[1],vert[0]) + Math.PI);
                    var ty = parseInt((theta/Math.PI)*TEX_SIZE);
                    var tx = TEX_SIZE - parseInt((phi/(Math.PI*2))*TEX_SIZE);
                    tx &= TEX_SIZE-1;
                    ty &= TEX_SIZE-1;
                    var ipi=(tx+(ty*TEX_SIZE))*4;
                    pix[pi] = ipix[ipi]+brighten;//parseInt(Math.random()*256.0);
                    pix[pi+1] = ipix[ipi+1]+brighten;//parseInt(Math.random()*256.0);
                    pix[pi+2] = ipix[ipi+2]+brighten;//parseInt(Math.random()*256.0);
                    pix[pi+3] = alpha;
                    pi+=4;
                }
            }
            //Write the rendered ball image to the scratch buffer
            compCtxs[ballId].putImageData(imgBuffers[17+ballId], 0,0);// ballId*ballDim);
        }
        
        
        //Apply rotation based on velocity...
        var vel=v3len(ball.velocityL);//[0];
        if(vel!=0.0){
            var dir=v3mulv(v3t0,ball.velocityL,1.0/vel);
            q4rotatexy(ball.rotation, dir[1], -dir[0],vel*2.0);
            q4normalize(ball.rotation);
            ball.imageDirty=true;
        }else
            ball.imageDirty=false;

        // Draw the ImageData at the balls (x,y) coordinates.
        var scl=ball.radius;
        var scl2=ball.radius*2;
        ctx.drawImage(compCanvases[ballId],ball.position[0]-scl,ball.position[1]-scl,scl2,scl2);
    }

    this.addHandlers=function(){    
        
        var canv=document.getElementById("dynamicCanvas");

        canv.onmousewheel=function(e){
            g_viewZoom+=(e.wheelDelta*0.01);
        }

        canv.onmousedown=function(e){
            e.preventDefault();
            g_mouseDown=true;
            g_lastMouseCoord=[e.pageX,e.pageY];
        }

        canv.onmouseup=function(e){
            e.preventDefault();
            g_mouseDown=false;
        }

        canv.onmousemove=function(e){
            var dx=g_lastMouseCoord[0]-e.pageX;
            var dy=g_lastMouseCoord[1]-e.pageY;
            g_lastMouseCoord[0]=e.pageX;
            g_lastMouseCoord[1]=e.pageY;
            if(g_mouseDown){
                g_poolSim.cuePull+=dy*-0.05;
                if(g_poolSim.cuePull>12.0)g_poolSim.cuePull=12.0;
            }else{
                if(e.shiftKey)
                    g_poolSim.cueAngle+=dx*0.001;
                else
                    g_poolSim.cueAngle+=dx*0.01;
            }
        }

        canv.onkeypress=function(e){
            //var charCode = (typeof e.which == "number") ? e.which : e.keyCode
            if(e.keyCode==KEY.A)g_poolSim.bodies[15].position[0]-=0.25;
            else if(e.keyCode==KEY.D)g_poolSim.bodies[15].position[0]+=0.25;
            else if(e.keyCode==KEY.W)g_poolSim.bodies[15].position[1]-=0.25;
            else if(e.keyCode==KEY.S)g_poolSim.bodies[15].position[1]+=0.25;
            else if(e.keyCode==KEY.J)g_poolSim.bodies[15].velocityL[0]-=0.25;
            else if(e.keyCode==KEY.L)g_poolSim.bodies[15].velocityL[0]+=0.25;
            else if(e.keyCode==KEY.I)g_poolSim.bodies[15].velocityL[1]-=0.25;
            else if(e.keyCode==KEY.K)g_poolSim.bodies[15].velocityL[1]+=0.25;
            else if(e.keyCode==KEY.R)g_poolSim.rerack();
            else if(e.keyCode==KEY.T)g_poolSim.replayBreak();
            else if(e.keyCode==KEY.SPACEBAR)g_poolSim.setPaused(g_paused?false:true);
        }
    }
}

g_poolSim = new PoolSim(g_dynamicCanvas);
Pool8BallClient();
g_poolSim.rerack();

requestAnimFrame(function animloop(){
    //if(g_paused==false)
    requestAnimFrame(animloop);
    g_poolSim.update();
  });
