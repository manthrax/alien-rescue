
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
dynCtx.fillStyle="#FFFF00";
dynCtx.strokeStyle = "#000000";
//dynCtx.textAlign(center);
//dynCtx.font = 'italic 40px Calibri';
var g_videoImageBuffers={};
var g_videoThumbWidth=128;
var g_videoThumbHeight=96;

function renderPlayerImage(player,img)
{
    var id = player.id;
    var idx=player.index;
    var xpos=parseInt(idx/4);
    var ypos = (idx-(xpos*4))* g_videoThumbHeight;
    xpos*=g_videoThumbWidth;
    dynCtx.drawImage(img, xpos,ypos,g_videoThumbWidth,g_videoThumbHeight);//w/5, h/8);
    var tx=xpos+(g_videoThumbHeight/2);
    var ty=ypos+11;
    
    dynCtx.strokeText(player.name, tx,ty);
    dynCtx.fillText(player.name, tx,ty);
    ty+=g_videoThumbHeight-12;
    dynCtx.strokeText(player.chat, tx,ty);
    dynCtx.fillText(player.chat, tx,ty);
}

function videoImageOnLoad(){
    renderPlayerImage(this.player,this);
    updateDynamicTexture();
    this.busy=false;
}

function getPlayerImageBuffer(playerId){
    
    var imgBuffer=g_videoImageBuffers[playerId];
    //console.log("Got data from id:"+data.id+":"+g_networkId);
    if(!imgBuffer){
        imgBuffer = document.createElement('img');//new Image();
        imgBuffer.player=g_playerList[playerId];
        imgBuffer.onload=videoImageOnLoad;
        imgBuffer.width=g_videoThumbWidth;
        imgBuffer.height=g_videoThumbHeight;
       // imgBuffer.busy=true;
        g_videoImageBuffers[playerId] = imgBuffer;
    }
    return imgBuffer;
}
//function videoBufferLoaded
function videoStreamHandler(data) {
    
    var imgBuffer=getPlayerImageBuffer(data.id);
    imgBuffer.busy=true;
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

function drawVideo(v, bc, w, h) {   //This renders a frame from the video, onto an image, and sends to server
    if(v.videoWidth>0 && v.videoHeight>0 && g_playerList[g_networkId]){
        // First, draw it into the backing canvas
        bc.drawImage(v, 0, 0, w,h);//w/5, h/8);
        
        renderPlayerImage(g_playerList[g_networkId],v);
        updateDynamicTexture();

        // Grab the pixel data from the backing canvas
        // and send it on the wire
        if (iosocket != null) {
            iosocket.emit("video",backCanvas.toDataURL());
        } else {
            //log ('not ready yet');
        }
    }

    // Start over! 10 frames a second = 100milliseconds
    setTimeout(function(){ drawVideo(v, bc, w, h); },1000);
}


