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
