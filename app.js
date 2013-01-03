var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen(8080);

var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
 
var chatServer = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(8088, function() {
    console.log('Listening at: http://localhost:8088');
});
 
socketio.listen(chatServer).on('connection', function (socket) {
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});
