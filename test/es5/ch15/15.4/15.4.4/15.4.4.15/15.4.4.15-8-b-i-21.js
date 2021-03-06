/// Copyright (c) 2012 Ecma International.  All rights reserved. 
/// Ecma International makes this code available under the terms and conditions set
/// forth on http://hg.ecmascript.org/tests/test262/raw-file/tip/LICENSE (the 
/// "Use Terms").   Any redistribution of this code must retain the above 
/// copyright and this notice and otherwise comply with the Use Terms.
/**
 * @path ch15/15.4/15.4.4/15.4.4.15/15.4.4.15-8-b-i-21.js
 * @description Array.prototype.lastIndexOf - element to be retrieved is inherited accessor property without a get function on an Array
 */


function testcase() {
        try {
            Object.defineProperty(Array.prototype, "0", {
                set: function () { },
                configurable: true
            });
            return [, ].lastIndexOf(undefined) === 0;
        } finally {
            delete Array.prototype[0];
        }
    }
runTestCase(testcase);
