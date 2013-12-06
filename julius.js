(function () {
    "use strict";
    
    
    function log(s) {    console.log('awesome: julius: '+s);    }
    function err(s) {    console.error('awesome: julius: '+s);    }
    
    var command,
        command_path = 'julius',
        conf_path = './julius_config/awesome.jconf',
        disabled = false,
        emitter = new (require('events').EventEmitter);
    
    // TODO: general detection of the location of executable?
    // may not be found in path when plugin is run from
    // PS plugins directory
    
    // note that if you run this 'built-in' to PS by putting the plugin 
    // inside the Photoshop CC/Plug-ins folder, the above path will fail - 
    // command_path will need to be '/usr/bin/julius' or whatever.
    
    
    
    
    // check for command and set up
    // and handle case where it isn't found
    var s = spawnChild( command_path, ['-version'] );
    s.on('error', function() {
        err("\n   === Dependency missing for voice recognition! \n   === Couldn't find julius library at: '"+ command_path +"'\n   === Voice rec feature disabled.");
        disabled = true;
    });
    
    
    
    
    
    
    
    
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
    
    
    
    
    
    // start and stop functions
    // these spawn and kill the process
    
    var isStarted = false;
    
    function start() {
        if (isStarted) { return; }
        if (disabled) { 
            log("Voice rec not starting because executable not found.");
            return;
        }
        command = spawnChild( 
            command_path,
            ['-C', conf_path],  
            { cwd:__dirname },
            onCmdData, onCmdData, onCmdEnd );
        log('started listening.');
        isStarted = true;
    }
    
    function stop() {
        if (!isStarted) { return; }
        log('stopping.');
        command.kill();
        isStarted = false;
    }
    
    
    
    
    
    // process event handlers
    
    function onCmdData( buffer ) {
        // look for sentence output
        // don't think it's possible to have two commands in one buffer
        // but support it just in case
        var re = /sentence1: <s>.*?<\/s>/mg;
        var matches = buffer.toString().match(re);
        if (matches) {
            var commands = matches.map( function(s){ return s.slice(15,-5); } );
            commands.map( function(s){ processCommand(s); } );
        }
    }
    
    function onCmdEnd( code ) {
        log('command ended. Exit code: '+code);
    }
    
    
    
    
    
    
    
    
    
    /********   do something in photoshop depending on commands  **/
    
    // simple FSM for command sequences
    var prefaced = false;
    var commanded = false;
    var enhancing = false;
    
    
    function processCommand(str) {
        // commands must be prefaced, since the voice engine assumes every noise is a command
        // valid prefaces are "OKAY PHOTO SHOP", or "THANKYOU" after a valid command
        if (str=='OKAY PHOTO SHOP' || (commanded && str=='THANKYOU')) {
            prefaced = true;
            commanded = false;
            log('preface ['+str+'] accepted');
            emitter.emit( 'voice-command', str );
            return;
        }
        // also, allow "ENHANCE" to be chained together, for humor's sake
        if (enhancing && str=='ENHANCE') {
            prefaced = true;
        }
        // ignore unprefaced commands
        if (!prefaced) {
            commanded = enhancing = false;
            log('command ['+str+'] not prefaced, ignoring');
            return;
        }
        // emit the command event
        log('command ['+str+'] accepted');
        emitter.emit( 'voice-command', str );
        commanded = true;
        prefaced = false;
        enhancing = (str=='ENHANCE');
    }
    
    
    
    
    
    
    
    
    // not sure if this is the usual way to expose event registration, but it works..
    function on(str,fcn) {
        emitter.on( str, fcn );
    }
    
    
    
    


    exports.start = start;
    exports.stop = stop;
    exports.on = on;

}());