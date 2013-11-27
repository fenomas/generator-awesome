(function () {
    "use strict";
    
    
    function log(s) {    console.log('awesome: main: '+s);    }
    function err(s) {    console.error('awesome: main: '+s);    }
    

    
    // globals, as it were
    
    var PLUGIN_ID = require("./package.json").name,
        MENU_ID = "andy-generator-test",
        MENU_LABEL = "Awesome mode";
    
    var generator = null,
        config = null; 
    
    var jsxfunctions = require('./jsxfunctions.js'),
        julius = require('./julius.js'),
        leap = require('./leap.js'),
        speech = require('./speech'),
        speaking = false;
    
    
    
    
    
    
    /*********** INIT ***********/

    function init(gen, cfg) {
        generator = gen;
        config = cfg;

        
        
        function initLater() {
            generator.addMenuItem(MENU_ID, MENU_LABEL, true, false).then(
                function () { log("Menu created", MENU_ID); },
                function () { err("Menu creation failed", MENU_ID); }
            );
        }
        
        process.nextTick(initLater);

        
        
        generator.onPhotoshopEvent( "generatorMenuChanged",
                                    function(event) {
            var menu = event.generatorMenuChanged;
            if (menu && menu.name == MENU_ID) {
                onMenuClicked(menu);
            }
        });
        
        
        generator.on('close', function() {
            julius.stop();
            leap.stop();
        });
        
    }
    
    
    
    
    
    

    /*********** MENU EVENTS ***********/


    function onMenuClicked(menu) {
        var startingMenuState = generator.getMenuState(menu.name);
        // toggle
        var checked = (startingMenuState.checked) ? false : true;
        generator.toggleMenu(menu.name, true, checked);
        
        if (checked) {
            julius.start();
            leap.start();
            speaking = false;
        } else {
            julius.stop();
            leap.stop();
            speaking = false;
        }
    }
    
    
    
    
    
    
    // voice command handler for events from julius
    
    julius.on(
        'voice-command', function(cmd) {
            switch(cmd) {
                case 'DUPLICATE LAYER':
                    say('Your layer is duplicated.');
                    sendJSX('app.activeDocument.activeLayer.duplicate();');
                    break;
                case "NEW LAYER":
                    say('Here is a new layer.');
                    sendJSX('app.activeDocument.artLayers.add();');
                    break;
                case "DELETE LAYER":
                    say('Deleting your layer.');
                    sendJSX('app.activeDocument.activeLayer.remove();');
                    break;
                case "ZOOM IN":
                    break;
                case "ZOOM OUT":
                    break;
                case "UNDO":
                    callJSXfunction(jsxfunctions.undo);
                    break;
                case "RANDOM COLOR":
                    say('Here comes a color.');
                    callJSXfunction(jsxfunctions.randColor);
                    break;
                case "CLOUDS":
                   say('Generating clouds.'); sendJSX('app.activeDocument.activeLayer.applyClouds();');
                    break;
                case "ENHANCE":
                    say('Enhancing.');
                    // same as "UNDO". This is so that you can blur an image and then 
                    // say "Enhance", for that authentic Hollywood feel.
                    callJSXfunction(jsxfunctions.undo);
                    break;
                case "VOICE MODE":
                    speaking = ! speaking;
                    say('Voice mode activated.');
                    break;
                case "OKAY PHOTO SHOP":
                    say('Yes?');
                    break;
                case "THANKYOU":
                    say('Your welcome.');
                    break;
            }
        }
    );
    
    
    
    
    
    
    
    
    // leap motion handler for motion tracking events
    // right now, when 'hovering' (i.e. finger is on the person-side
    // of the leapmotion plane) this draws guides at the finger's x/y
    // and otherwise draws a brushstroke.
    // really slow right now, I'm probably not drawing the 
    // way PS expects.
    
    var guidesOn = false;
    var lastpt = null;
    
    leap.on(
        'leap-hover', function(hovering, touching, px, py) {
            // init pt data if necessary
            if (!lastpt) { lastpt = [px,py]; }
            // set guide visibility
            if (hovering && !touching) {
                if (!guidesOn) {
                    callJSXfunction(jsxfunctions.createGuides, [], true);
                    guidesOn = true;
                }
            } else {
                if (guidesOn) {
                    callJSXfunction(jsxfunctions.removeGuides, [], true);
                    guidesOn = false;
                }
            }
            // update guides or draw if necessary
            if (guidesOn) {
                callJSXfunction(jsxfunctions.updateGuides, [px,py], true);
            }
            if (touching) {
                callJSXfunction(jsxfunctions.drawLinePercent, 
                                [lastpt[0], lastpt[1], px,py], false);
            }
            // done
            lastpt = [px,py];
        }
    );
    
    
    
    
    
    
    
    
    // speech
    
    function say(str) {
        if (speaking) {
            speech.say(str);
        }        
    }
    
    
    
    
    
    
    /*********** HELPERS ***********/
    
    
    function callJSXfunction(fcn, args, quiet) {
        args = args || [];
        var str = "(" + fcn.toString() + ")("+ args.join() +")";
        sendJSX(str, quiet);
    }
    
    
    
    function sendJSX(str, quiet) {
        var res = generator.evaluateJSXString(str);
        if (!quiet) {
            res.then(
                function(result){ log("jsx result: "+result); },
                function(msg){ err("jsx error: "+msg); }
            );
        }
    }
    
    
//    function sendJavascript(str){
//        generator.evaluateJSXString(str).then(
//            function(result){
//                console.log(result);
//            },
//            function(err){
//                console.log(err);
//            });
//    }


    
    
    
    
    
    exports.init = init;
    
}());