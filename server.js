var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mime = require('mime');
var fs = require('fs');
var randomstring = require("randomstring");

var users = [];
var youtube = {
    amnesia : "dq3i027HkZE?start=52",
    geazy : "l_lblj8Cq0o?start=213",
    lie : "NFtnolPuLd4?start=67",
    nosleep : "n5rS9vNbCDg?start=752",
    mammal : "z1GwbvxJ4aM?start=80"
};

app.get('*.*', (request, response) => {
    var url = '.' + request.url;

    fs.stat(url, function(err){
        if(err == null){
            var type = mime.lookup(url);
            var file = fs.readFileSync(url);
            response.writeHead(200, {'Content-Type': type});
            response.end(file);
        }
        else{
            response.status(404);
            response.send('Nincs ilyen file! :(')
        }
    });
})

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
    var address = socket.handshake.address;
    var ip = socket.request.connection.remoteAddress;
    var key = null;
    var name = null;

    socket.on('login', function(msg){
        var dup = false;

        msg = msg.trim().replace(/[^0-9a-zA-Z_]*/g, '');

        if(msg == '') return;

        users.forEach(function(val){
            if(val.name == msg){
                console.log('Failed login (dup): ' + msg + ' from ' + ip);
                socket.emit('login', {
                    success : false,
                    error : 'This name is already in use. You filthy bastard.'
                });
                dup = true;
            }
        });

        if(!dup){
            console.log('Successful login: ' + msg + ' from ' + ip);
            key = randomstring.generate(56);
            name = msg;

            users.push({
                name : msg,
                ip: ip,
                key : key,
                socket: socket
            });

            var people = [];
            users.forEach(function(val){
                people.push(val.name);
            });

            socket.emit('login', {success : true, key : key, people: people});
            io.sockets.emit('action', { type : 1, name : msg });
        }
    });

    socket.on('message', function(data){
        if(key == data.key && data.msg.trim() != ''){
            console.log('User ' + name + ' with ip ' + ip + ' sent message: ' + data.msg);

            if(data.msg.substring(0, 1) == '/'){
                var command = data.msg.substring(1, data.msg.length);
                var params = command.split(' '); 
                command = params[0];
                params.shift();

                console.log(params);

                switch(command){
                    case 'help':
                        socket.emit('help', {success : true, youtube : Object.keys(youtube)});
                    break;
                    case 'w':
                        if(params.length >= 2){
                            var exist = false;
                            users.forEach(function(val){
                                if(val.name == params[0]){
                                    exist = true;
                                    val.socket.emit('whisper', {success : true, from: name, msg: params[1]});
                                }
                            });

                            if(exist){
                                socket.emit('whisper', {success : true, to: params[0], msg: params[1]});
                            }
                            else{
                                socket.emit('whisper', {success : false, msg: 'This user is not online.'});
                            }
                        }
                        else{
                            socket.emit('whisper', {success : false, msg: 'No username or message given.'});
                        }
                    break;
                    default:
                        if(youtube[command]){
                            io.sockets.emit('youtube', {from: name, msg: youtube[command]});
                        }
                        else{
                            var url = './assets/audio/' + command + '.mp3';
        
                            fs.stat(url, function(err){
                                if(err == null){
                                    io.sockets.emit('play', {success: true, from: name, msg: command});
                                }
                                else{
                                    socket.emit('play', {sucess: false, msg: command});
                                }
                            });
                        }
                }
            }
            else{
                socket.broadcast.emit('message', {from: name, msg: data.msg});
            }
        }
    });

    socket.on('disconnect', function(){
        if(key != null){
            users.forEach(function(val, index){
                if(val.key == key){
                    io.sockets.emit('action', { type : 0, name : val.name });
                    users.splice(index, 1);
                }
            });
        }
        console.log('User disconnected');
    });

    console.log("New connection.");
});

http.listen(81, function(){
    console.log('listening on *:81');
});