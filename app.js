var connect = require('connect');
connect.createServer(
    connect.static(__dirname)
).listen((process.env.PORT || 3000));

var fs = require('fs')
    , http = require('http')
    , socketio = require('socket.io');
 
var chatServer = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-type': 'text/html'});
    res.end(fs.readFileSync(__dirname + '/index.html'));
}).listen(8989, function() {
    console.log('Listening at: http://localhost:'+8989);
});
 
socketio.listen(chatServer).on('connection', function (socket) {
    socket.on('message', function (msg) {
        console.log('Message Received: ', msg);
        socket.broadcast.emit('message', msg);
    });
});
