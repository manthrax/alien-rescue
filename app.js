var express = require('express'),
    sio = require('socket.io'),
	http = require('http');
var app = express();
var httpServer = http.createServer(app);
app.use(express.static(__dirname));
var port = (process.env.PORT || 3000)

httpServer.listen(port);

var io = sio.listen(httpServer);

io.set('log level',0);

io.sockets.on('message', function (msg) {
	//console.log('Message Received: ', msg);
	socket.broadcast.emit('message', msg);
});

io.sockets.on('connection', function (socket) {
    //console.log('Connect Received: ');
    socket.on('message', function (msg) {
        //console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});