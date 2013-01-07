
var log = function(msg) {
   document.getElementById('log').innerHTML = document.getElementById('log').innerHTML + msg + "<br/>";
};

var videoStream = document.getElementById('sourcevid'),
	video = document.getElementById('video'),//getElementsByTagName('video')[0],
	heading = document.getElementsByTagName('h1')[0];

if(navigator.webkitGetUserMedia) {
    navigator.webkitGetUserMedia({video:true},//, audio:true},
        function(stream){
            //videoStream.src=window.webkitURL.createObjectURL(stream);
            video.src=window.webkitURL.createObjectURL(stream);
        }
    );
} else {
    heading.textContent = "Native web camera streaming is not supported in this browser!";
};


//var img=document.getElementById("frame");
var g_dynamicCanvas=document.getElementById("dynamicCanvas");
var dynCtx = g_dynamicCanvas.getContext('2d');
dynCtx.font        = "normal 12px Arial";
dynCtx.fillStyle="#FFFFFF";
dynCtx.strokeStyle = "#000000";
//dynCtx.font = 'italic 40px Calibri';
var g_videoImageBuffers={};

function renderPlayerImage(player,img)
{
    var id = player.id;
    var idx=player.index;
    var xpos=parseInt(idx/4);
    var ypos = (idx-(xpos*4))*100;
    xpos*=200; 
    dynCtx.drawImage(img, xpos,ypos,128,96);//w/5, h/8);
    dynCtx.fillText(id, 5+xpos, 40+ypos);
    dynCtx.strokeText(id, 5+xpos, 40+ypos);
}

function videoImageOnLoad(){
    renderPlayerImage(this.player,this);
    updateDynamicTexture();
}
//function videoBufferLoaded
function videoStreamHandler(data) {
    
    var imgBuffer=g_videoImageBuffers[data.id];
    //console.log("Got data from id:"+data.id+":"+g_networkId);
    if(!imgBuffer){
        imgBuffer = document.createElement('img');//new Image();
        imgBuffer.player=g_playerList[data.id];
        imgBuffer.onload=videoImageOnLoad;
       // imgBuffer.busy=true;
        g_videoImageBuffers[data.id] = imgBuffer;
    }//else if(imgBuffer.busy==true)
    //    return;
    //console.log("Data:"+data.data);
    imgBuffer.src=data.data;
    renderPlayerImage(imgBuffer.player,imgBuffer);
    //updateDynamicTexture();
}

//var back = document.createElement('canvas');
var backCanvas = document.getElementById('output');
var backcontext = backCanvas.getContext('2d');

cw = 128;//240;//video.clientWidth;
ch = 96;//400;//video.clientHeight;
log('width = ' + ch);
backCanvas.width = cw;
backCanvas.height = ch;

drawVideo(video, backcontext, cw, ch);

function drawVideo(v, bc, w, h) {
    if(v.videoWidth>0 && v.videoHeight>0 && g_playerList[g_networkId]){
        // First, draw it into the backing canvas
        bc.drawImage(v, 0, 0, w,h);//w/5, h/8);
        
        
        var idx=g_playerList[g_networkId].index;
        var xpos=parseInt(idx/4);
        var ypos = (idx-(xpos*4))*100;
        xpos*=200;
        
        
        dynCtx.drawImage(v, 0, ypos , w,h);//w/5, h/8);
        
        dynCtx.fillText("local", 5, 40+ypos);
        dynCtx.strokeText("local", 5, 40+ypos);
        
        // Grab the pixel data from the backing canvas
        // and send it on the wire
        if (iosocket != null) {
            iosocket.emit("video",backCanvas.toDataURL());
        } else {
            //log ('not ready yet');
        }
    }

    // Start over! 10 frames a second = 100milliseconds
    setTimeout(function(){ drawVideo(v, bc, w, h); },4000);
}


