Object.defineProperties = function (obj, properties) {
    function convertToDescriptor(desc) {
        function hasProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        }
        
        function isCallable(v) {
            // NB: modify as necessary if other values than functions are callable.
            return typeof v === "function";
        }
        
        if (typeof desc !== "object" || desc === null)
            throw new TypeError("bad desc");
        
        var d = {};
        
        if (hasProperty(desc, "enumerable"))
            d.enumerable = !!obj.enumerable;
        if (hasProperty(desc, "configurable"))
            d.configurable = !!obj.configurable;
        if (hasProperty(desc, "value"))
            d.value = obj.value;
        if (hasProperty(desc, "writable"))
            d.writable = !!desc.writable;
        if (hasProperty(desc, "get")) {
            var g = desc.get;
            
            if (!isCallable(g) && typeof g !== "undefined")
                throw new TypeError("bad get");
            d.get = g;
        }
        if (hasProperty(desc, "set")) {
            var s = desc.set;
            if (!isCallable(s) && typeof s !== "undefined")
                throw new TypeError("bad set");
            d.set = s;
        }
        
        if (("get" in d || "set" in d) && ("value" in d || "writable" in d))
            throw new TypeError("identity-confused descriptor");
        
        return d;
    }
    
    if (typeof obj !== "object" || obj === null)
        throw new TypeError("bad obj");
    
    properties = Object(properties);
    
    var keys = Object.keys(properties);
    var descs = [];
    
    for (var i = 0; i < keys.length; i++)
        descs.push([keys[i], convertToDescriptor(properties[keys[i]])]);
    
    for (var i = 0; i < descs.length; i++)
        Object.defineProperty(obj, descs[i][0], descs[i][1]);
    
    return obj;
}

// From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
if (!Object.keys) {
    Object.keys = (function () {
        'use strict';
        var hasOwnProperty = Object.prototype.hasOwnProperty,
            hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
            dontEnums = [
                'toString',
                'toLocaleString',
                'valueOf',
                'hasOwnProperty',
                'isPrototypeOf',
                'propertyIsEnumerable',
                'constructor'
            ],
            dontEnumsLength = dontEnums.length;
        
        return function (obj) {
            if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                throw new TypeError('Object.keys called on non-object');
            }
            
            var result = [], prop, i;
            
            for (prop in obj) {
                if (hasOwnProperty.call(obj, prop)) {
                    result.push(prop);
                }
            }
            
            if (hasDontEnumBug) {
                for (i = 0; i < dontEnumsLength; i++) {
                    if (hasOwnProperty.call(obj, dontEnums[i])) {
                        result.push(dontEnums[i]);
                    }
                }
            }
            return result;
        };
    }());
}

// Production steps of ECMA-262, Edition 5, 15.4.4.19
// Reference: http://es5.github.io/#x15.4.4.19
if (!Array.prototype.map) {
    
    Array.prototype.map = function (callback, thisArg) {
        
        var T, A, k;
        
        if (this == null) {
            throw new TypeError(' this is null or not defined');
        }
        
        // 1. Let O be the result of calling ToObject passing the |this| 
        //    value as the argument.
        var O = Object(this);
        
        // 2. Let lenValue be the result of calling the Get internal 
        //    method of O with the argument "length".
        // 3. Let len be ToUint32(lenValue).
        var len = O.length >>> 0;
        
        // 4. If IsCallable(callback) is false, throw a TypeError exception.
        // See: http://es5.github.com/#x9.11
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        
        // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
        if (arguments.length > 1) {
            T = thisArg;
        }
        
        // 6. Let A be a new array created as if by the expression new Array(len) 
        //    where Array is the standard built-in constructor with that name and 
        //    len is the value of len.
        A = new Array(len);
        
        // 7. Let k be 0
        k = 0;
        
        // 8. Repeat, while k < len
        while (k < len) {
            
            var kValue, mappedValue;
            
            // a. Let Pk be ToString(k).
            //   This is implicit for LHS operands of the in operator
            // b. Let kPresent be the result of calling the HasProperty internal 
            //    method of O with argument Pk.
            //   This step can be combined with c
            // c. If kPresent is true, then
            if (k in O) {
                
                // i. Let kValue be the result of calling the Get internal 
                //    method of O with argument Pk.
                kValue = O[k];
                
                // ii. Let mappedValue be the result of calling the Call internal 
                //     method of callback with T as the this value and argument 
                //     list containing kValue, k, and O.
                mappedValue = callback.call(T, kValue, k, O);
                
                // iii. Call the DefineOwnProperty internal method of A with arguments
                // Pk, Property Descriptor
                // { Value: mappedValue,
                //   Writable: true,
                //   Enumerable: true,
                //   Configurable: true },
                // and false.
                
                // In browsers that support Object.defineProperty, use the following:
                // Object.defineProperty(A, k, {
                //   value: mappedValue,
                //   writable: true,
                //   enumerable: true,
                //   configurable: true
                // });
                
                // For best browser support, use the following:
                A[k] = mappedValue;
            }
            // d. Increase k by 1.
            k++;
        }
        
        // 9. return A
        return A;
    };
}

if (!Array.prototype.filter) {
    // Reference: http://es5.github.com/#x15.4.4.20
    Array.prototype.filter = function (fun /*, thisp */) {
        "use strict";
        
        if (this == null)
            throw new TypeError();
        
        var t = Object(this);
        var len = t.length >>> 0;
        if (typeof fun != "function")
            throw new TypeError();
        
        var res = [];
        var thisp = arguments[1];
        for (var i = 0; i < len; i++) {
            if (i in t) {
                var val = t[i];
                // in case fun mutates this
                if (fun.call(thisp, val, i, t))
                    res.push(val);
            }
        }
        
        return res;
    };
}

// Production steps of ECMA-262, Edition 5, 15.4.4.21
// Reference: http://es5.github.io/#x15.4.4.21
if (!Array.prototype.reduce) {
    Array.prototype.reduce = function (callback /*, initialValue*/) {
        'use strict';
        if (this == null) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if (typeof callback !== 'function') {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this), len = t.length >>> 0, k = 0, value;
        if (arguments.length == 2) {
            value = arguments[1];
        } else {
            while (k < len && !k in t) {
                k++;
            }
            if (k >= len) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k++];
        }
        for (; k < len; k++) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}


// Production steps of ECMA-262, Edition 5, 15.4.4.22
// Reference: http://es5.github.io/#x15.4.4.22
if ('function' !== typeof Array.prototype.reduceRight) {
    Array.prototype.reduceRight = function (callback /*, initialValue*/) {
        'use strict';
        if (null === this || 'undefined' === typeof this) {
            throw new TypeError('Array.prototype.reduce called on null or undefined');
        }
        if ('function' !== typeof callback) {
            throw new TypeError(callback + ' is not a function');
        }
        var t = Object(this), len = t.length >>> 0, k = len - 1, value;
        if (arguments.length >= 2) {
            value = arguments[1];
        } else {
            while (k >= 0 && !k in t) {
                k--;
            }
            if (k < 0) {
                throw new TypeError('Reduce of empty array with no initial value');
            }
            value = t[k--];
        }
        for (; k >= 0; k--) {
            if (k in t) {
                value = callback(value, t[k], k, t);
            }
        }
        return value;
    };
}


Array.prototype.slice = function (begin, end) {
    // IE < 9 gets unhappy with an undefined end argument
    end = (typeof end !== 'undefined') ? end : this.length;
    
    // For native Array objects, we use the native slice function
    //if (Object.prototype.toString.call(this) === '[object Array]'){
    //  return _slice.call(this, begin, end); 
    //}
    
    // For array like object we handle it ourselves.
    var i, cloned = [],
        size, len = this.length;
    
    // Handle negative value for "begin"
    var start = begin || 0;
    start = (start >= 0) ? start: len + start;
    
    // Handle negative value for "end"
    var upTo = (end) ? end : len;
    if (end < 0) {
        upTo = len + end;
    }
    
    // Actual expected size of the slice
    size = upTo - start;
    
    if (size > 0) {
        cloned = new Array(size);
        if (this.charAt) {
            for (i = 0; i < size; i++) {
                cloned[i] = this.charAt(start + i);
            }
        } else {
            for (i = 0; i < size; i++) {
                cloned[i] = this[start + i];
            }
        }
    }
    
    return cloned;
};


// Production steps of ECMA-262, Edition 5, 15.4.4.17
// Reference: http://es5.github.io/#x15.4.4.17
if (!Array.prototype.some) {
    Array.prototype.some = function (fun /*, thisArg*/) {
        'use strict';
        
        if (this == null) {
            throw new TypeError('Array.prototype.some called on null or undefined');
        }
        
        if (typeof fun !== 'function') {
            throw new TypeError();
        }
        
        var t = Object(this);
        var len = t.length >>> 0;
        
        var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
        for (var i = 0; i < len; i++) {
            if (i in t && fun.call(thisArg, t[i], i, t)) {
                return true;
            }
        }
        
        return false;
    };
}

Array.prototype.toLocaleString = Array.prototype.toString; // TODO

Array.prototype.join = function (sep) {
    var s = '';
    if (!arguments.length) sep = ',';
    for (var i = 0; i < this.length; i++) {
        if (i) s += sep;
        s += this[i];
    }
    return s;
}

if (!Array.prototype.splice) {
    Array.prototype.splice = function (index, howmany) {
        if (index < 0) {
            index = this.length + index;
        }        ;
        if (!howmany || howmany < 0) {
            howmany = 0;
        }        ;
        var selection = this.slice(index, index + howmany);
        this.copyFrom(
            this.slice(0, index)
            .concat(Array.prototype.slice.apply(arguments, [2]))
            .concat(this.slice(index + howmany)));
        return selection;
    };
};

if (!Array.prototype.copyFrom) {
    Array.prototype.copyFrom = function (source) {
        for (var i = 0; i < source.length; i++) {
            this[i] = source[i];
        }        ;
        this.length = source.length;
        return this;
    };
};


//======================================================================== NUMBER

Number.prototype.toLocaleString = Number.prototype.toString;
Number.prototype.toExponential = Number.prototype.toString;
Number.prototype.toPrecision = Number.prototype.toString;
Number.prototype.toFixed = Number.prototype.toString;

function isFinite(nx) {
    var n = 0 + nx;
    if (n == Infinity) return false;
    if (n == -Infinity) return false;
    if (n != n) return false;
    return true;
}
//============================ function
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }
        
        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () { },
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
            };
        
        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();
        
        return fBound;
    };
}
//======================================================= STRING
String.prototype.charAt = function (i) {
    if (i < 0 || i >= this.length) return '';
    return String.fromCharCode(this.charCodeAt(i));
}

if (!String.prototype.repeat) {
    String.prototype.repeat = function (count) {
        'use strict';
        if (this == null) {
            throw new TypeError('can\'t convert ' + this + ' to object');
        }
        var str = '' + this;
        count = +count;
        if (count != count) {
            count = 0;
        }
        if (count < 0) {
            throw new RangeError('repeat count must be non-negative');
        }
        if (count == Infinity) {
            throw new RangeError('repeat count must be less than infinity');
        }
        count = Math.floor(count);
        if (str.length == 0 || count == 0) {
            return '';
        }
        // Ensuring count is a 31-bit integer allows us to heavily optimize the
        // main part. But anyway, most current (august 2014) browsers can't handle
        // strings 1 << 28 chars or longer, so:
        if (str.length * count >= 1 << 28) {
            throw new RangeError('repeat count must not overflow maximum string size');
        }
        var rpt = '';
        for (;;) {
            if ((count & 1) == 1) {
                rpt += str;
            }
            count >>>= 1;
            if (count == 0) {
                break;
            }
            str += str;
        }
        return rpt;
    }
}
//====================== VARIOUS
var isFunction = function (val) {
    return to_string.call(val) === '[object Function]';
};
var isRegex = function (val) {
    return to_string.call(val) === '[object RegExp]';
};
var isArray = function isArray(obj) {
    return to_string.call(obj) === '[object Array]';
};
var isString = function isString(obj) {
    return to_string.call(obj) === '[object String]';
};

// NEEDS REGEXES
function _decodeURIComponent(source) { // @arg String: percent encoded string.
    // @ret String: decode string.
    // @throws: Error("invalid decodeURIComponent()")
    // @help: decodeURIComponent
    // @desc: decodeURIComponent
    return source.replace(/(%[\da-f][\da-f])+/g, function (match) {
        var rv = [],
            ary = match.split("%").slice(1), i = 0, iz = ary.length,
            a, b, c;
        
        for (; i < iz; ++i) {
            a = parseInt(ary[i], 16);
            
            if (a !== a) { // isNaN(a)
                throw new Error("invalid decodeURIComponent()");
            }
            
            // decode UTF-8
            if (a < 0x80) { // ASCII(0x00 ~ 0x7f)
                rv.push(a);
            } else if (a < 0xE0) {
                b = parseInt(ary[++i], 16);
                rv.push((a & 0x1f) << 6 | (b & 0x3f));
            } else if (a < 0xF0) {
                b = parseInt(ary[++i], 16);
                c = parseInt(ary[++i], 16);
                rv.push((a & 0x0f) << 12 | (b & 0x3f) << 6 
                                         | (c & 0x3f));
            }
        }
        return String.fromCharCode.apply(null, rv);
    });
}

console = {
    log: function () {
        var s = '', i, q;
        for (i = 0; i < arguments.length; i++) {
            try {
                q = arguments[i];
                if (undefined === q) {
                    s += 'undefined ';
                } else if (null === q) {
                    s += 'null ';
                } else {
                    s += q.toString() + ' ';
                }
            } catch (e) {
                s += '???:' + e + " ";
            }
        }
        print(s);
    }
};

function runTestCase(testcase) {
    if (testcase() !== true) {
        $ERROR("Test case returned non-true value!");
    }
}


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

var $ERROR = function (s) {
    print("ERROR: " + s);
}

var $PRINT = function (s) {
    print("INFO: " + s);
}
var testFailed = $ERROR;
function $FAIL(message) {
    testFailed(message);
}


function $INCLUDE(message) { }

function fnExists(/*arguments*/) {
    for (var i = 0; i < arguments.length; i++) {
        if (typeof (arguments[i]) !== "function") return false;
    }
    return true;
}

Object.isExtensible = function (obj) {
    return !obj.__NonExtensible;
}

Object.preventExtensions = function (obj) {
    obj.__NonExtensible = true;
}

Object.seal = Object.freeze = Object.preventExtensions; // TODO proper implementation

Object.isFrozen = Object.isSealed = function (obj) {
    return !Object.isExtensible(obj);
}; // TODO proper implementation
// non extensible = no newindex
// sealed = no newindex, all props nonconfigurable, but writable
// frozen = props nonconfigurable and readonly

//=====================================================================JSON

/*
    json_parse.js
    2012-06-20

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    This file creates a json_parse function.

        json_parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = json_parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

    This is a reference implementation. You are free to copy, modify, or
    redistribute.

    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.
*/

/*members "", "\"", "\/", "\\", at, b, call, charAt, f, fromCharCode,
    hasOwnProperty, message, n, name, prototype, push, r, t, text
*/

var json_parse = (function () {
    "use strict";
    
    // This is a function that can parse a JSON text, producing a JavaScript
    // data structure. It is a simple, recursive descent parser. It does not use
    // eval or regular expressions, so it can be used as a model for implementing
    // a JSON parser in other languages.
    
    // We are defining the function inside of another function to avoid creating
    // global variables.
    
    var at,     // The index of the current character
        ch,     // The current character
        escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        },
        text,

        error = function (m) {
            
            // Call error when something is wrong.
            
            throw {
                name: 'SyntaxError',
                message: m,
                at: at,
                text: text
            };
        },

        next = function (c) {
            
            // If a c parameter is provided, verify that it matches the current character.
            
            if (c && c !== ch) {
                error("Expected '" + !!c + c + "' instead of '" + ch + "'");
            }
            
            // Get the next character. When there are no more characters,
            // return the empty string.
            
            ch = text.charAt(at);
            at += 1;
            return ch;
        },

        number = function () {
            
            // Parse a number value.
            
            var number,
                string = '';
            
            if (ch === '-') {
                string = '-';
                next('-');
            }
            while (ch >= '0' && ch <= '9') {
                string += ch;
                next();
            }
            if (ch === '.') {
                string += '.';
                while (next() && ch >= '0' && ch <= '9') {
                    string += ch;
                }
            }
            if (ch === 'e' || ch === 'E') {
                string += ch;
                next();
                if (ch === '-' || ch === '+') {
                    string += ch;
                    next();
                }
                while (ch >= '0' && ch <= '9') {
                    string += ch;
                    next();
                }
            }
            number = +string;
            if (!isFinite(number)) {
                error("Bad number");
            } else {
                return number;
            }
        },

        string = function () {
            
            // Parse a string value.
            
            var hex,
                i,
                string = '',
                uffff;
            
            // When parsing for string values, we must look for " and \ characters.
            
            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }
                    if (ch === '\\') {
                        next();
                        if (ch === 'u') {
                            uffff = 0;
                            for (i = 0; i < 4; i += 1) {
                                hex = parseInt(next(), 16);
                                if (!isFinite(hex)) {
                                    break;
                                }
                                uffff = uffff * 16 + hex;
                            }
                            string += String.fromCharCode(uffff);
                        } else if (typeof escapee[ch] === 'string') {
                            string += escapee[ch];
                        } else {
                            break;
                        }
                    } else {
                        string += ch;
                    }
                }
            }
            error("Bad string");
        },

        white = function () {
            
            // Skip whitespace.
            
            while (ch && ch <= ' ') {
                next();
            }
        },

        word = function () {
            
            // true, false, or null.
            
            switch (ch) {
                case 't':
                    next('t');
                    next('r');
                    next('u');
                    next('e');
                    return true;
                case 'f':
                    next('f');
                    next('a');
                    next('l');
                    next('s');
                    next('e');
                    return false;
                case 'n':
                    next('n');
                    next('u');
                    next('l');
                    next('l');
                    return null;
            }
            error("Unexpected '" + ch + "'");
        },

        value,  // Place holder for the value function.

        array = function () {
            
            // Parse an array value.
            
            var array = [];
            
            if (ch === '[') {
                next('[');
                white();
                if (ch === ']') {
                    next(']');
                    return array;   // empty array
                }
                while (ch) {
                    array.push(value());
                    white();
                    if (ch === ']') {
                        next(']');
                        return array;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad array");
        },

        object = function () {
            
            // Parse an object value.
            
            var key,
                object = {};
            
            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object;   // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    if (Object.hasOwnProperty.call(object, key)) {
                        error('Duplicate key "' + key + '"');
                    }
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad object");
        };
    
    value = function () {
        
        // Parse a JSON value. It could be an object, an array, a string, a number,
        // or a word.
        
        white();
        switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
        }
    };
    
    // Return the json_parse function. It will have access to all of the above
    // functions and variables.
    
    return function (source, reviver) {
        var result;
        
        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error("Syntax error");
        }
        
        // If there is a reviver function, we recursively walk the new structure,
        // passing each name/value pair to the reviver function for possible
        // transformation, starting with a temporary root object that holds the result
        // in an empty key. If there is not a reviver function, we simply return the
        // result.
        
        return typeof reviver === 'function'
            ? (function walk(holder, key) {
            var k, v, value = holder[key];
            if (value && typeof value === 'object') {
                for (k in value) {
                    if (Object.prototype.hasOwnProperty.call(value, k)) {
                        v = walk(value, k);
                        if (v !== undefined) {
                            value[k] = v;
                        } else {
                            delete value[k];
                        }
                    }
                }
            }
            return reviver.call(holder, key, value);
        }({ '': result }, ''))
            : result;
    };
}());

var JSON = {};
JSON.parse = json_parse;

/*
    json2.js
    2014-02-04

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


     
    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, regexp: true */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/


(function () {
    'use strict';
    
    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }
    
    if (typeof Date.prototype.toJSON !== 'function') {
        
        Date.prototype.toJSON = function () {
            
            return isFinite(this.valueOf())
                ? this.getUTCFullYear() + '-' +
                    f(this.getUTCMonth() + 1) + '-' +
                    f(this.getUTCDate()) + 'T' +
                    f(this.getUTCHours()) + ':' +
                    f(this.getUTCMinutes()) + ':' +
                    f(this.getUTCSeconds()) + 'Z'
                : null;
        };
        
        String.prototype.toJSON =
            Number.prototype.toJSON =
            Boolean.prototype.toJSON = function () {
            return this.valueOf();
        };
    }
    
    var cx,
        //escapable,
        gap,
        indent,
        meta,
        rep;
    
    
    function quote(string) {
        
        // If the string contains no control characters, no quote characters, and no
        // backslash characters, then we can safely slap some quotes around it.
        // Otherwise we must also replace the offending characters with safe escape
        // sequences.
        // TODO no regexes yet!
        //escapable.lastIndex = 0;
        //return escapable.test(string) ? '"' + string.replace(escapable, function (a) {
        //    var c = meta[a];
        //    return typeof c === 'string'
        //        ? c
        //        : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
        //}) + '"' : '"' + string + '"';
        return '"' + string + '"';
    }
    
    
    function str(key, holder) {
        //console.log('stringifying ' + key);
        // Produce a string from holder[key].
        
        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];
        
        // If the value has a toJSON method, call it to obtain a replacement value.
        
        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }
        
        // If we were called with a replacer function, then call the replacer to
        // obtain a replacement value.
        
        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }
        
        // What happens next depends on the value's type.
        
        switch (typeof value) {
            case 'string':
                return quote(value);

            case 'number':
                
                // JSON numbers must be finite. Encode non-finite numbers as null.
                
                return isFinite(value) ? String(value) : 'null';

            case 'boolean':
            case 'null':
                
                // If the value is a boolean or null, convert it to a string. Note:
                // typeof null does not produce 'null'. The case is included here in
                // the remote chance that this gets fixed someday.
                
                return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

            case 'object':
                
                // Due to a specification blunder in ECMAScript, typeof null is 'object',
                // so watch out for that case.
                
                if (!value) {
                    return 'null';
                }
                
                // Make an array to hold the partial results of stringifying this object value.
                
                gap += indent;
                partial = [];
                
                // Is the value an array?
                
                if (Object.prototype.toString.apply(value) === '[object Array]') {
                    
                    // The value is an array. Stringify every element. Use null as a placeholder
                    // for non-JSON values.
                    
                    length = value.length;
                    for (i = 0; i < length; i += 1) {
                        partial[i] = str(i, value) || 'null';
                    }
                    
                    // Join all of the elements together, separated with commas, and wrap them in
                    // brackets.
                    
                    if (!partial.length) return '[]';
                    v = partial.length === 0
                    ? '[]'
                    : gap
                    ? '[\n' + gap + partial.join(',\n' + gap) + '\n' + mind + ']'
                    : '[' + partial.join(',') + ']';
                    gap = mind;
                    return v;
                }
                
                // If the replacer is an array, use it to select the members to be stringified.
                
                if (rep && typeof rep === 'object') {
                    length = rep.length;
                    for (i = 0; i < length; i += 1) {
                        if (typeof rep[i] === 'string') {
                            k = rep[i];
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                } else {
                    
                    // Otherwise, iterate through all of the keys in the object.
                    
                    for (k in value) {
                        if (Object.prototype.hasOwnProperty.call(value, k)) {
                            v = str(k, value);
                            if (v) {
                                partial.push(quote(k) + (gap ? ': ' : ':') + v);
                            }
                        }
                    }
                }
                
                // Join all of the member texts together, separated with commas,
                // and wrap them in braces.
                //console.log('joining...',typeof gap,gap,typeof mind, mind,typeof partial, partial)
              //  if (!partial.length) return '{}';
                v = partial.length === 0
                ? '{}'
                : 
                gap
                ? '{\n' + gap + partial.join(',\n' + gap) + '\n' + mind + '}'
                : '{' + partial.join(',') + '}';
                gap = mind;
                //console.log('Ajoining...')
                return v;
        }
    }
    
    // If the JSON object does not yet have a stringify method, give it one.
    
    if (typeof JSON.stringify !== 'function') {
        //escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g;
        meta = {
            // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        };
        JSON.stringify = function (value, replacer, space) {
            
            // The stringify method takes a value and an optional replacer, and an optional
            // space parameter, and returns a JSON text. The replacer can be a function
            // that can replace values, or an array of strings that will select the keys.
            // A default replacer method can be provided. Use of the space parameter can
            // produce text that is more easily readable.
            
            var i;
            gap = '';
            indent = '';
            
            // If the space parameter is a number, make an indent string containing that
            // many spaces.
            
            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }
            
            // If there is a replacer, it must be a function or an array.
            // Otherwise, throw an error.
            
            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                    typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }
            
            // Make a fake root object containing our value under the key of ''.
            // Return the result of stringifying the value.
            
            return str('', { '': value });
        };
    }
}());