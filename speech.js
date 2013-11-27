(function () {
    "use strict";
    
    
    function log(s) {    console.log('awesome: say: '+s);    }
    function err(s) {    console.error('awesome: say: '+s);    }
    
    
    
    var command,
        command_path = 'say',
        voice = 'Vicki',
        disabled = false;
    
    // TODO: general detection of the location of executable?
    
    
    
    
    // check for command and set up
    // and handle case where it isn't found
    var s = spawnChild( command_path, ['-v ?'] );
    s.on('error', function() {
        err("\n   === Dependency missing for speaking! \n   === Couldn't find 'say' library at: '"+ command_path +"'\n   === Speech feature disabled.");
        disabled = true;
    });
    
    
    
    
    
    
    // say something!
    
    function say(str) {
        if (disabled) { return; }
        command = spawnChild( 
            command_path,
            ['-v', voice, str]
        );
        
    }
    
    
    
    
    
    
    // child process handling
    
    function spawnChild( cmd, args, opts, onData, onErr, onEnd) {
        var spawn = require('child_process').spawn;
        var child = spawn( cmd, args, opts );
        if (onData) {
            child.stdout.on('data', function(data) { onData(data); } );
        }
        if (onErr) {
            child.on('error', function(data) { onErr(data); } );
//            child.stderr.on('data', function(data) { onErr(data); } );
        }
        if (onEnd) {
            child.on('exit', function (code) { onEnd(code); } );
        }
        return child;
    }
    
    
    
    
    
    
    
    
    


    exports.say = say;

}());