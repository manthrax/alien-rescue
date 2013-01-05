
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

function sendData(msg){
    if (iosocket != null) {
        iosocket.emit("data",{data:msg});		
    } else {
        //log ('not ready yet');
    }
}

var img=document.getElementById("frame");

function videoStreamHandler(data) {
    //console.log("Got data..");
    img.src=data.data;
}

//var back = document.createElement('canvas');
var backCanvas = document.getElementById('output');
var backcontext = backCanvas.getContext('2d');

cw = 128;//240;//video.clientWidth;
ch = 100;//400;//video.clientHeight;
log('width = ' + ch);
backCanvas.width = cw;
backCanvas.height = ch;

drawVideo(video, backcontext, cw, ch);

function drawVideo(v, bc, w, h) {

    // First, draw it into the backing canvas
    bc.drawImage(v, 0, 0, w, h);
    
    // Grab the pixel data from the backing canvas
    var stringData=backCanvas.toDataURL();

    // send it on the wire
    sendData(stringData);

    // Start over! 10 frames a second = 100milliseconds
    setTimeout(function(){ drawVideo(v, bc, w, h); },1000/4);
}


