
/* Human readable keyCode index */
var KEY = {
    'BACKSPACE': 8,
    'TAB': 9,
    'NUM_PAD_CLEAR': 12,
    'ENTER': 13,
    'SHIFT': 16,
    'CTRL': 17,
    'ALT': 18,
    'PAUSE': 19,
    'CAPS_LOCK': 20,
    'ESCAPE': 27,
    'SPACEBAR': 32,
    'PAGE_UP': 33,
    'PAGE_DOWN': 34,
    'END': 35,
    'HOME': 36,
    'ARROW_LEFT': 37,
    'ARROW_UP': 38,
    'ARROW_RIGHT': 39,
    'ARROW_DOWN': 40,
    'PRINT_SCREEN': 44,
    'INSERT': 45,
    'DELETE': 46,
    'SEMICOLON': 59,
    'WINDOWS_LEFT': 91,
    'WINDOWS_RIGHT': 92,
    'SELECT': 93,
    'NUM_PAD_ASTERISK': 106,
    'NUM_PAD_PLUS_SIGN': 107,
    'NUM_PAD_HYPHEN-MINUS': 109,
    'NUM_PAD_FULL_STOP': 110,
    'NUM_PAD_SOLIDUS': 111,
    'NUM_LOCK': 144,
    'SCROLL_LOCK': 145,
    'SEMICOLON2': 186,
    'EQUALS_SIGN': 187,
    'COMMA': 188,
    'HYPHEN-MINUS': 189,
    'FULL_STOP': 190,
    'SOLIDUS': 191,
    'GRAVE_ACCENT': 192,
    'LEFT_SQUARE_BRACKET': 219,
    'REVERSE_SOLIDUS': 220,
    'RIGHT_SQUARE_BRACKET': 221,
    'APOSTROPHE': 222
};

(function () { /* 0 - 9 */
	var i;
    for (i = 48; i <= 57; i++) {
        KEY['' + (i - 48)] = i;
    } /* A - Z */
    for (i = 65; i <= 90; i++) {
        KEY['' + String.fromCharCode(i)] = i;
    } /* NUM_PAD_0 - NUM_PAD_9 */
    for (i = 96; i <= 105; i++) {
        KEY['NUM_PAD_' + (i - 96)] = i;
    } /* F1 - F12 */
    for (i = 112; i <= 123; i++) {
        KEY['F' + (i - 112 + 1)] = i;
    }
})();

function v3dot(va, vb) {
    return (va[0] * vb[0]) + (va[1] * vb[1]) + (va[2] * vb[2]);
}

function v3cross(va, vb) {
    return [va[1] * vb[2] - va[2] * vb[1], va[2] * vb[0] - va[0] * vb[2], va[0] * vb[1] - va[1] * vb[0]];
}

function v3sqlen(va){
    return va[0]*va[0]+va[1]*va[1]+va[2]*va[2];
}

var v3_min_len=0.0000001
function v3len(va) {
    var vd=v3dot(va, va);
    if(vd>(v3_min_len*v3_min_len))
       return Math.sqrt(vd);
    else return 0.0;//v3_min_len;
}

function v3add(va, vb) {
    return [va[0] + vb[0], va[1] + vb[1], va[2] + vb[2]];
}

function v3sub(va, vb) {return [va[0] - vb[0], va[1] - vb[1], va[2] - vb[2]];}

function v3mul(va, vx) {
    return [va[0] * vx, va[1] * vx, va[2] * vx];
}

function v3div(va, vx) {
    return [va[0] / vx, va[1] / vx, va[2] / vx];
}

var gotnan=false;
function nanicheck(v,idx){
    if(gotnan)return;
    if(isNaN(v)){
        console.log("Got NaN:"+idx);
        gotnan=true;
    }
}

function v3normalize(va) {
    var ln = v3len(va);
    if(ln<v3_min_len){
        console.log("bad normalize");
        return [0,1,0];
    }
    return [va[0] / ln, va[1] / ln, va[2] / ln];
}


function v3addv(vr, va, vb) {
    vr[0] = va[0] + vb[0];
    vr[1] = va[1] + vb[1];
    vr[2] = va[2] + vb[2];
    return vr;
}

function v3subv(vr, va, vb) {
    vr[0] = va[0] - vb[0];
    vr[1] = va[1] - vb[1];
    vr[2] = va[2] - vb[2];
    return vr;
}

function v3mulv(vr, va, vx) {
    vr[0] = va[0] * vx;
    vr[1] = va[1] * vx;
    vr[2] = va[2] * vx;
    return vr;
}

function v3divv(vr, va, vx) {
    vr[0] = va[0] / vx;
    vr[1] = va[1] / vx;
    vr[2] = va[2] / vx;
    return vr;
}

function v3crossv(vr, va, vb) {
    vr[0]=va[1] * vb[2] - va[2] * vb[1];
    vr[1]=va[2] * vb[0] - va[0] * vb[2];
    vr[2]=va[0] * vb[1] - va[1] * vb[0];
    return vr;
}

function v3normalizev(vr, va) {
    var ln = v3len(va);
    if(ln<v3_min_len)return v3copy(vr,va);
    vr[0] = va[0] / ln;
    vr[1] = va[1] / ln;
    vr[2] = va[2] / ln;
    return vr;
}

function vec3f(vx,vy,vz) {
//    var v=new Float64Array(3);v[0]=vx;v[1]=vy;v[2]=vz;return v;   //avg time 120
//    var v=new Float32Array(3);v[0]=vx;v[1]=vy;v[2]=vz;return v;     //avg time 91
    return [vx,vy,vz];                                            //avg time 65 - 73
}

function vec3(va) {
    return vec3f(va[0],va[1],va[2])
}

function v3copy(va, vb) {
    va[0] = vb[0];
    va[1] = vb[1];
    va[2] = vb[2];
    return va;
}

function v3set(va, vx, vy, vz) {
    va[0] = vx;
    va[1] = vy;
    va[2] = vz;
    return va;
}

var v3td0=[0,0,0];
function v3dist(va,vb){return v3len(v3subv(v3td0,vb,va));}






(function(global) {
    "use strict";

    var elementPrototype = (global.HTMLElement || global.Element)["prototype"];
    var getter;

    var mouseEventPrototype = global.MouseEvent.prototype;
    
    if(!("movementX" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementX", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementX || this.mozMovementX || 0; }
        });
    }
    
    if(!("movementY" in mouseEventPrototype)) {
        Object.defineProperty(mouseEventPrototype, "movementY", {
            enumerable: true, configurable: false, writeable: false,
            get: function() { return this.webkitMovementY || this.mozMovementY || 0; }
        });
    }
    
    // Navigator pointer is not the right interface according to spec.
    // Here for backwards compatibility only
    if(!navigator.pointer) {
        navigator.pointer = navigator.webkitPointer || navigator.mozPointer;
    }

    // Document event: pointerlockchange
    function pointerlockchange(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockchange", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockchange", pointerlockchange, false);
    document.addEventListener("webkitpointerlocklost", pointerlockchange, false);
    document.addEventListener("mozpointerlockchange", pointerlockchange, false);
    document.addEventListener("mozpointerlocklost", pointerlockchange, false);

    // Document event: pointerlockerror
    function pointerlockerror(oldEvent) {
        var newEvent = document.createEvent("CustomEvent");
        newEvent.initCustomEvent("pointerlockerror", true, false, null);
        document.dispatchEvent(newEvent);
    }
    document.addEventListener("webkitpointerlockerror", pointerlockerror, false);
    document.addEventListener("mozpointerlockerror", pointerlockerror, false);

    // document.pointerLockEnabled
    if(!document.hasOwnProperty("pointerLockEnabled")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitPointerLockEnabled" in document) {
                return function() { return document.webkitPointerLockEnabled; };
            }
            if("mozPointerLockEnabled" in document) {
                return function() { return document.mozPointerLockEnabled; };
            }
    
            // Early versions of the spec managed mouselock through the pointer object
            if(navigator.pointer) {
                if(typeof(navigator.pointer.isLocked) === "boolean") {
                    // Chrome initially launched with this interface
                    return function() { return navigator.pointer.isLocked; };
                } else if(typeof(navigator.pointer.isLocked) === "function") {
                    // Some older builds might provide isLocked as a function
                    return function() { return navigator.pointer.isLocked(); };
                } else if(typeof(navigator.pointer.islocked) === "function") {
                    // For compatibility with early Firefox build
                    return function() { return navigator.pointer.islocked(); };
                }
            }

            return function() { return !!document.pointerLockElement; };
        })();
        
        Object.defineProperty(document, "pointerLockEnabled", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    
    if(!document.hasOwnProperty("pointerLockElement")) {
        getter = (function() {
            // These are the functions that match the spec, and should be preferred
            if("webkitPointerLockElement" in document) {
                return function() { return document.webkitPointerLockElement; };
            }
            if("mozPointerLockElement" in document) {
                return function() { return document.mozPointerLockElement; };
            }
            return function() { return null; }; // not supported
        })();
        
        Object.defineProperty(document, "pointerLockElement", {
            enumerable: true, configurable: false, writeable: false,
            get: getter
        });
    }
    // element.requestPointerLock
    if(!elementPrototype.requestPointerLock) {
        elementPrototype.requestPointerLock = (function() {
            if(elementPrototype.webkitRequestPointerLock) {
                return function() {
                    this.webkitRequestPointerLock();
                };
            }

            if(elementPrototype.mozRequestPointerLock) {
                return function() {
                    this.mozRequestPointerLock();
                };
            }

            if(navigator.pointer) {
                return function() {
                    var elem = this;
                    navigator.pointer.lock(elem, pointerlockchange, pointerlockerror);
                };
            }

            GameShim.supports.pointerLock = false;

            return function(){}; // not supported
        })();
}

// document.exitPointerLock
if(!document.exitPointerLock) {
    document.exitPointerLock = (function() {
        return  document.webkitExitPointerLock ||
                document.mozExitPointerLock ||
                function(){
                    if(navigator.pointer) {
                        var elem = this;
                        navigator.pointer.unlock();
                    }
                };
    })();
}

})((typeof(exports) != 'undefined') ? global : window); // Account for CommonJS environments