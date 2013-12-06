(function () {
    "use strict";
    
    
    function log(s) {    console.log('awesome: leap: '+s);    }
    function err(s) {    console.error('awesome: leap: '+s);    }
    
    
    var Leap,
        controller,
        emitter = new (require('events').EventEmitter),
        isStarted = false;
    
    
    // check for leapjs and set up
    try {
        Leap = require('leapjs');
    } catch(e) {
        err("\n   === Dependency missing! \n   === Library 'leapjs' not found. Try running 'npm install' from the directory of this plugin.");
    }
    
    
    
    if (Leap) {
        // hairy bug fix here: leap controller decides whether it's 
        // running in Node or not by looking at process.title,
        // which apparently is different when running built-in in PS.
        // passing in inNode=true fixes this..
        controller = new Leap.Controller( {inNode:true} );
    }
        
    

    
    
    
    // start and stop routines
    // these really just manage the listener,  
    // the controller handles its own connecting and disconnecting
    
    function start() {
        if (isStarted) { return; }
        if (!controller) { 
            log("Not tracking because 'leapjs' library not found.");
            return;
        }
        controller.on('frame',onFrame);
        controller.connect();
        log('started motion tracking.');
        isStarted = true;
    }
    
    function stop() {
        if (!isStarted) { return; }
        if (!controller) { return; }
        controller.removeListener('frame',onFrame);
        controller.disconnect();
        log('stopped motion tracking.');
        isStarted = false;
    }
    
    
    
    
    
    // listener to motion tracking
    
    var every = 100; //ms
    var lasttime = -10000;
    var framesTouching = 0;
    
    function onFrame(frame) {
        if (!frame.valid) { return; }
        var ts = frame.timestamp;
        if (ts < lasttime+(every*1000) ) { return; }
        lasttime = ts;
        
        var f = frame.fingers;
        var hovering = (f && f.length==1 && f[0].valid);
//        log(f.length+" - "+hovering);
        if (!hovering) {
            framesTouching = 0;
            emitter.emit( 'leap-hover', false, false );
            return;
        }
        // one valid finger found, so treat it as hovering or touching
        var finger = f[0];
        var p = finger.stabilizedTipPosition;
        var np = frame.interactionBox.normalizePoint(p);
        //transform to 0..100% and invert y
        var x = 100*np[0];
        var y = 100 - 100*np[1];
        // treat as touching when finger is past the device's plane (z=1)
        var touching = (p[2] < 1);
        // smooth out the "touching" property - set it to false until 
        // n consecutive touching frames, to skip abberrant tracking
        framesTouching = (touching) ? framesTouching+1 : 0;
        touching = (framesTouching>3);
        // todo: tune that 3
        emitter.emit( 'leap-hover', hovering, touching, x, y );
    }
    
    
    
    
    
    
    // not sure if this is the usual way to expose event registration, but it works..
    function on(str,fcn) {
        emitter.on( str, fcn );
    }
    
    

    exports.start = start;
    exports.stop = stop;
    exports.on = on;

}());