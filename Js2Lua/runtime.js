var $ERROR = function (s) {
    print("ERROR: ", s);
}

var $PRINT = function (s) {
    print("INFO: ", s);
}

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