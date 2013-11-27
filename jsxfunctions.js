(function () {
    "use strict";
    
    function log(s) {    console.log('jsxfunctions: '+s);    }
    function err(s) {    console.error('jsxfunctions: '+s);    }
    
    
    
    
    
    // These are all JSX functions meant to be run inside 
    // Photoshop's extendscript VM
    
    
    
    
    // randomize color
    function randColor() {
        var col = app.foregroundColor;
        col.rgb.red = Math.floor( Math.random()*256 );
        col.rgb.green = Math.floor( Math.random()*256 );
        col.rgb.blue = Math.floor( Math.random()*256 );
        app.foregroundColor = col;
    }
    
    
    
    
    // surely there's an easier way to trigger an "undo", but I can't find it
    function undo() {
        var doc = app.activeDocument;
        var states = doc.historyStates;
        
        var curr = 0;
        for (var i=0; i<states.length; i++) {
            if (states[i] == doc.activeHistoryState) {
                curr = i;
            }
        }
        
        var prev = curr - 1;
        if (prev >= 0) {
            doc.activeHistoryState = states[prev];
            return true;
        } else {
            return false;
        }
    }
    
    
    
    
    
    // some functions for creating, moving, and removing guide lines
    function createGuides() {
        var g = app.activeDocument.guides;
        g.removeAll();
        g.add( Direction.HORIZONTAL, 0 );
        g.add( Direction.VERTICAL, 0 );
        return 1;
    }
    function updateGuides(u,v) {
        var doc = app.activeDocument
        var g = doc.guides;
        var x = UnitValue(u, "%");
        var y = UnitValue(v, "%");
        x.baseUnit = doc.width;
        y.baseUnit = doc.height;
        g[0].coordinate = y;
        g[1].coordinate = x;
        return 1;
    }
    function removeGuides() {
        var g = app.activeDocument.guides;
        g.removeAll();
        return 1;
    }
    
    
    
    
    
    
    
    // draw a line with the brush tool
    function drawLinePercent(x1, y1, x2, y2) {
        // preliminaries
        var cacheDisplayDialogs = app.displayDialogs
        app.displayDialogs = DialogModes.NO
        var doc = app.activeDocument;
        
        // prepare numbers
        // args are in percentages, but path APIs seem to assume pixels @ 72dpi
        var resfix = doc.resolution/72;
        var wf = doc.width.value/100/resfix;
        var hf = doc.height.value/100/resfix;
        var start = [ x1*wf, y1*hf ];
        var stop = [ x2*wf, y2*hf ];
        
        // below here is copied from docs...
        var startPoint = new PathPointInfo();
        startPoint.anchor = start;
        startPoint.leftDirection = start;
        startPoint.rightDirection = start;
        startPoint.kind = PointKind.CORNERPOINT;
        
        var stopPoint = new PathPointInfo();
        stopPoint.anchor = stop;
        stopPoint.leftDirection = stop;
        stopPoint.rightDirection = stop;
        stopPoint.kind = PointKind.CORNERPOINT;
        
        var spi = new SubPathInfo();
        spi.closed = false;
        spi.operation = ShapeOperation.SHAPEXOR;
        spi.entireSubPath = [startPoint, stopPoint];
        
        var line = doc.pathItems.add("Line", [spi]);
        line.strokePath(ToolType.BRUSH);
        line.remove();
        
        // cleanup
        app.displayDialogs = cacheDisplayDialogs;
        return 1;
    }
    
    
    
    
    


    exports.undo = undo;
    exports.randColor = randColor;
    exports.createGuides = createGuides;
    exports.updateGuides = updateGuides;
    exports.removeGuides = removeGuides;
    exports.drawLinePercent = drawLinePercent;

}());




