/// Copyright (c) 2012 Ecma International.  All rights reserved. 
/// Ecma International makes this code available under the terms and conditions set
/// forth on http://hg.ecmascript.org/tests/test262/raw-file/tip/LICENSE (the 
/// "Use Terms").   Any redistribution of this code must retain the above 
/// copyright and this notice and otherwise comply with the Use Terms.
/**
 * @path ch15/15.2/15.2.3/15.2.3.7/15.2.3.7-5-b-145.js
 * @description Object.defineProperties - 'writable' property of 'descObj' is inherited accessor property (8.10.5 step 6.a)
 */


function testcase() {
        var obj = {};

        var proto = {};

        Object.defineProperty(proto, "writable", {
            get: function () {
                return true;
            }
        });

        var Con = function () { };
        Con.prototype = proto;

        var descObj = new Con();

        Object.defineProperties(obj, {
            property: descObj
        });

        obj.property = "isWritable";

        return obj.hasOwnProperty("property") && obj.property === "isWritable";
    }
runTestCase(testcase);
