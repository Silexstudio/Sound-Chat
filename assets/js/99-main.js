var Main = (function(){
    var socket = io();

    var Chat = {
        waiting : false,
        key : null,
        name : null,
        audio : null,
        iframeTimeout : null,
        init : function(){
            $('#join').click(function(){
                if(!Chat.waiting){
                    Chat.waiting = true;
                    $(this).attr('disabled', true);
                    Chat.name = $('#username').val();
                    socket.emit('login', $('#username').val());
                }
            });

            $('#input').keyup(function(e){
                if(e.keyCode == 13){
                    $('#send').click();
                }
            });

            $('#username').keyup(function(e){
                if(e.keyCode == 13){
                    $('#join').click();
                }
            });

            $('#send').click(Chat.send);

            socket.on('login', Chat.login);
            socket.on('message', Chat.message);
            socket.on('action', Chat.action);
            socket.on('play', Chat.play);
            socket.on('youtube', Chat.youtube);
            socket.on('help', Chat.help);
            socket.on('whisper', Chat.whisper);
        },
        whisper: function(data){
            if(data.success){
                if(data.from){
                    $('#channels .content').append('<p class="whisper">from ' + data.from + ': ' +  data.msg + '</p>');
                }
                else{
                     $('#channels .content').append('<p class="whisper">to ' + data.to + ': ' + data.msg + '</p>');
                }
            }
            else{
                $('#channels .content').append('<p><span>' + data.msg + '</span></p>');
            }

            $('#channels .log').scrollTop($('#channels .content').height());
        },
        help : function(data){
            $('#channels .content').append('<p><span>Available commands are:</p>');
            data.youtube.forEach(function(val){
                $('#channels .content').append('<p>/' + val + '</p>');
            });
            $('#channels .log').scrollTop($('#channels .content').height());
        },
        login : function(msg){
            Chat.waiting = false;
            $('#join').removeAttr('disabled');
            if(!msg.success){
                Chat.error(msg.error);
            }
            else{
                Chat.key = msg.key;
                msg.people.forEach(function(val){
                    $('#users .content').append('<p name="' + val + '">@' + val + '</p>');
                });

                $('#login').addClass('hideme');
                setTimeout(function(){
                    $('#cont').addClass('open');
                    $('#input').focus();
                }, 300);
            }
        },
        message : function(data){
            $('#channels .content').append('<p><span>' + data.from + '</span>: ' + data.msg + '</p>');
            $('#channels .log').scrollTop($('#channels .content').height());
        },
        action : function(data){
            if(data.type == 1){
                $('#channels .content').append('<p><span>@' + data.name + ' has joined the channel!</span></p>');
                if(data.name != Chat.name) $('#users .content').append('<p name="' + data.name + '">@' + data.name + '</p>');
            }
            else{
                $('#users .content p[name="' + data.name + '"]').remove();
                $('#channels .content').append('<p><span>@' + data.name + ' has left the channel!</span></p>');
            }
            $('#channels .log').scrollTop($('#channels .content').height());
        },
        play : function(data){
            if(data.success){
                $('#channels .content').append('<p><span>' + data.from + '</span> started playing a song!</p>');
                if(Chat.audio){
                    Chat.audio.pause();
                }

                Chat.audio = new Audio('assets/audio/' + data.msg + '.mp3');
                Chat.audio.play();
            }
            else{
                $('#channels .content').append('<p><span>Sorry but command /' + data.msg + ' does not exist!</span></p>');
            }
            $('#channels .log').scrollTop($('#channels .content').height());
            $('iframe').attr('src', 'https://www.google.com').addClass('d-none');
        },
        youtube : function(data){
            $('iframe').attr('src', 'https://www.youtube.com/embed/' + data.msg + '&autoplay=1&modestbranding=1&autohide=1&showinfo=0&controls=0&rel=0&vq=hd720p60').removeClass('d-none');
            $('#channels .content').append('<p><span>' + data.from + '</span> started playing a music video!</p>');
            $('#channels .log').scrollTop($('#channels .content').height());

            if(Chat.iframeTimeout){
                clearTimeout(Chat.iframeTimeout);
            }

            if(Chat.audio){
                Chat.audio.pause();
            }

            Chat.iframeTimeout = setTimeout(function(){
                $('iframe').attr('src', 'https://www.google.com').addClass('d-none');
            }, 30000);
        },
        send : function(){
            socket.emit('message', {key : Chat.key, msg: $('#input').val()});
            $('#channels .content').append('<p><span>' + Chat.name + '</span>: ' + $('#input').val());
            $('#input').val('');
            $('#channels .log').scrollTop($('#channels .content').height());
        },
        errorTimeout : null,
        error : function(msg){
            $('#alert').addClass('active').find('p').html(msg);
            if(Chat.errorTimeout != null) clearTimeout(Chat.errorTimeout);
            Chat.errorTimeout = setTimeout(function(){
                $('#alert').removeClass('active');
            }, 2600);
        }
    }

    var Init = {
        initFont : function(){
            WebFontConfig = {
                active: function() {
                    sessionStorage.fonts = true;
                }
            }

            WebFont.load({
                google: {
                  families: ['Roboto']
                }
            });

        },
        initAll : function(){
            Init.initFont();
            Chat.init();
        }
    }

    return {
        init : Init.initAll
    }
})(jQuery);

Main.init();