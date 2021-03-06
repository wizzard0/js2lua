/// Copyright (c) 2012 Ecma International.  All rights reserved. 
/// Ecma International makes this code available under the terms and conditions set
/// forth on http://hg.ecmascript.org/tests/test262/raw-file/tip/LICENSE (the 
/// "Use Terms").   Any redistribution of this code must retain the above 
/// copyright and this notice and otherwise comply with the Use Terms.
/**
 * @path ch15/15.2/15.2.3/15.2.3.6/15.2.3.6-3-249-1.js
 * @description Object.defineProperty - 'Attributes' is an Array object that uses Object's [[Get]] method to access the 'set' property of prototype object (8.10.5 step 8.a)
 */


function testcase() {
        var obj = {};
        var data = "data";
        try {
            Array.prototype.set = function (value) {
                data = value;
            };
            var arrObj = [];

            Object.defineProperty(obj, "property", arrObj);
            obj.property = "overrideData";

            return obj.hasOwnProperty("property") && data === "overrideData";
        } finally {
            delete Array.prototype.set;
        }
    }
runTestCase(testcase);
