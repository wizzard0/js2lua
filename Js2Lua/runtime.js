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
