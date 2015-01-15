var $ERROR = function (s) {
    print("ERROR: " + s);
}

var $PRINT = function (s) {
    print("INFO: " + s);
}

function $FAIL(message) {
    testFailed(message);
}


function $INCLUDE(message) { }

function runTestCase(testcase) {
    if (testcase() !== true) {
        $ERROR("Test case returned non-true value!");
    }
}

var __globalObject = Function("return this;")();
function fnGlobalObject() {
    return __globalObject;
}

function fnExists(/*arguments*/) {
    for (var i = 0; i < arguments.length; i++) {
        if (typeof (arguments[i]) !== "function") return false;
    }
    return true;
}

function Test262Error(message) {
    if (message) this.message = message;
}

Test262Error.prototype.toString = function () {
    return "Test262 Error: " + this.message;
};

function $FAIL(message) {
    testFailed(message);
}

function testFailed(message) {
    throw new Test262Error(message);
}

function compareArray(aExpected, aActual) {
    if (aActual.length != aExpected.length) {
        return false;
    }
    
    aExpected.sort();
    aActual.sort();
    
    var s;
    for (var i = 0; i < aExpected.length; i++) {
        if (aActual[i] !== aExpected[i]) {
            return false;
        }
    }
    return true;
}

function arrayContains(arr, expected) {
    var found;
    for (var i = 0; i < expected.length; i++) {
        found = false;
        for (var j = 0; j < arr.length; j++) {
            if (expected[i] === arr[j]) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }
    return true;
}

function dataPropertyAttributesAreCorrect(obj,
                                          name,
                                          value,
                                          writable,
                                          enumerable,
                                          configurable) {
    var attributesCorrect = true;
    
    if (obj[name] !== value) {
        if (typeof obj[name] === "number" &&
            isNaN(obj[name]) &&
            typeof value === "number" &&
            isNaN(value)) {
            // keep empty
        } else {
            attributesCorrect = false;
        }
    }
    
    try {
        if (obj[name] === "oldValue") {
            obj[name] = "newValue";
        } else {
            obj[name] = "OldValue";
        }
    } catch (we) {
    }
    
    var overwrited = false;
    if (obj[name] !== value) {
        if (typeof obj[name] === "number" &&
            isNaN(obj[name]) &&
            typeof value === "number" &&
            isNaN(value)) {
            // keep empty
        } else {
            overwrited = true;
        }
    }
    if (overwrited !== writable) {
        attributesCorrect = false;
    }
    
    var enumerated = false;
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && prop === name) {
            enumerated = true;
        }
    }
    
    if (enumerated !== enumerable) {
        attributesCorrect = false;
    }
    
    
    var deleted = false;
    
    try {
        delete obj[name];
    } catch (de) {
    }
    if (!obj.hasOwnProperty(name)) {
        deleted = true;
    }
    if (deleted !== configurable) {
        attributesCorrect = false;
    }
    
    return attributesCorrect;
}

function accessorPropertyAttributesAreCorrect(obj,
                                              name,
                                              get,
                                              set,
                                              setVerifyHelpProp,
                                              enumerable,
                                              configurable) {
    var attributesCorrect = true;
    
    if (get !== undefined) {
        if (obj[name] !== get()) {
            if (typeof obj[name] === "number" &&
                isNaN(obj[name]) &&
                typeof get() === "number" &&
                isNaN(get())) {
                // keep empty
            } else {
                attributesCorrect = false;
            }
        }
    } else {
        if (obj[name] !== undefined) {
            attributesCorrect = false;
        }
    }
    
    try {
        var desc = Object.getOwnPropertyDescriptor(obj, name);
        if (typeof desc.set === "undefined") {
            if (typeof set !== "undefined") {
                attributesCorrect = false;
            }
        } else {
            obj[name] = "toBeSetValue";
            if (obj[setVerifyHelpProp] !== "toBeSetValue") {
                attributesCorrect = false;
            }
        }
    } catch (se) {
        throw se;
    }
    
    
    var enumerated = false;
    for (var prop in obj) {
        if (obj.hasOwnProperty(prop) && prop === name) {
            enumerated = true;
        }
    }
    
    if (enumerated !== enumerable) {
        attributesCorrect = false;
    }
    
    
    var deleted = false;
    try {
        delete obj[name];
    } catch (de) {
        throw de;
    }
    if (!obj.hasOwnProperty(name)) {
        deleted = true;
    }
    if (deleted !== configurable) {
        attributesCorrect = false;
    }
    
    return attributesCorrect;
}

var prec;
function isEqual(num1, num2) {
    if ((num1 === Infinity) && (num2 === Infinity)) {
        return (true);
    }
    if ((num1 === -Infinity) && (num2 === -Infinity)) {
        return (true);
    }
    prec = getPrecision(Math.min(Math.abs(num1), Math.abs(num2)));
    return (Math.abs(num1 - num2) <= prec);
    //return(num1 === num2);
}

function getPrecision(num) {
    //TODO: Create a table of prec's,
    //      because using Math for testing Math isn't that correct.
    
    var log2num = Math.log(Math.abs(num)) / Math.LN2;
    var pernum = Math.ceil(log2num);
    return (2 * Math.pow(2, -52 + pernum));
    //return(0);
}

//Date_constants.js
// Copyright 2009 the Sputnik authors.  All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

var HoursPerDay = 24;
var MinutesPerHour = 60;
var SecondsPerMinute = 60;

var msPerDay = 86400000;
var msPerSecond = 1000;
var msPerMinute = 60000;
var msPerHour = 3600000;

var date_1899_end = -2208988800001;
var date_1900_start = -2208988800000;
var date_1969_end = -1;
var date_1970_start = 0;
var date_1999_end = 946684799999;
var date_2000_start = 946684800000;
var date_2099_end = 4102444799999;
var date_2100_start = 4102444800000;

function testBuiltInObject(obj, isFunction, isConstructor, properties, length) {
    
    if (obj === undefined) {
        $ERROR("Object being tested is undefined.");
    }
    
    var objString = Object.prototype.toString.call(obj);
    if (isFunction) {
        if (objString !== "[object Function]") {
            $ERROR("The [[Class]] internal property of a built-in function must be " +
                    "\"Function\", but toString() returns " + objString);
        }
    } else {
        if (objString !== "[object Object]") {
            $ERROR("The [[Class]] internal property of a built-in non-function object must be " +
                    "\"Object\", but toString() returns " + objString);
        }
    }
    
    if (!Object.isExtensible(obj)) {
        $ERROR("Built-in objects must be extensible.");
    }
    
    if (isFunction && Object.getPrototypeOf(obj) !== Function.prototype) {
        $ERROR("Built-in functions must have Function.prototype as their prototype.");
    }
    
    if (isConstructor && Object.getPrototypeOf(obj.prototype) !== Object.prototype) {
        $ERROR("Built-in prototype objects must have Object.prototype as their prototype.");
    }
    
    // verification of the absence of the [[Construct]] internal property has
    // been moved to the end of the test
    
    // verification of the absence of the prototype property has
    // been moved to the end of the test
    
    if (isFunction) {
        
        if (typeof obj.length !== "number" || obj.length !== Math.floor(obj.length)) {
            $ERROR("Built-in functions must have a length property with an integer value.");
        }
        
        if (obj.length !== length) {
            $ERROR("Function's length property doesn't have specified value; expected " +
                length + ", got " + obj.length + ".");
        }
        
        var desc = Object.getOwnPropertyDescriptor(obj, "length");
        if (desc.writable) {
            $ERROR("The length property of a built-in function must not be writable.");
        }
        if (desc.enumerable) {
            $ERROR("The length property of a built-in function must not be enumerable.");
        }
        if (desc.configurable) {
            $ERROR("The length property of a built-in function must not be configurable.");
        }
    }
    
    properties.forEach(function (prop) {
        var desc = Object.getOwnPropertyDescriptor(obj, prop);
        if (desc === undefined) {
            $ERROR("Missing property " + prop + ".");
        }
        // accessor properties don't have writable attribute
        if (desc.hasOwnProperty("writable") && !desc.writable) {
            $ERROR("The " + prop + " property of this built-in function must be writable.");
        }
        if (desc.enumerable) {
            $ERROR("The " + prop + " property of this built-in function must not be enumerable.");
        }
        if (!desc.configurable) {
            $ERROR("The " + prop + " property of this built-in function must be configurable.");
        }
    });
    
    // The remaining sections have been moved to the end of the test because
    // unbound non-constructor functions written in JavaScript cannot possibly
    // pass them, and we still want to test JavaScript implementations as much
    // as possible.
    
    var exception;
    if (isFunction && !isConstructor) {
        // this is not a complete test for the presence of [[Construct]]:
        // if it's absent, the exception must be thrown, but it may also
        // be thrown if it's present and just has preconditions related to
        // arguments or the this value that this statement doesn't meet.
        try {
            /*jshint newcap:false*/
            var instance = new obj();
        } catch (e) {
            exception = e;
        }
        if (exception === undefined || exception.name !== "TypeError") {
            $ERROR("Built-in functions that aren't constructors must throw TypeError when " +
                "used in a \"new\" statement.");
        }
    }
    
    if (isFunction && !isConstructor && obj.hasOwnProperty("prototype")) {
        $ERROR("Built-in functions that aren't constructors must not have a prototype property.");
    }
    
    // passed the complete test!
    return true;
}

