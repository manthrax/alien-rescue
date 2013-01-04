var express = require('express'),
    sio = require('socket.io'),
	http = require('http');

var app = express();

var httpServer = http.createServer(app);

app.use(express.static(__dirname));
/*
app.get('/', function(req, res){
  res.send('<script src="/socket.io/socket.io.js"></script>\
<script>\
  var socket = io.connect("http://localhost:3000");\
  socket.on("news", function (data) {\
    alert(data.hello);\
  });\
</script>');
});
*/

httpServer.listen(3000);

var io = sio.listen(httpServer);

//io.sockets.on('connection', function (socket) {
//  socket.emit('news', { hello: 'world' });
//});
io.sockets.on('message', function (msg) {
	//console.log('Message Received: ', msg);
	socket.broadcast.emit('message', msg);
});

io.sockets.on('connection', function (socket) {
    console.log('Connect Received: ');
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});