var fs = require("fs");
var sh = require("execsync-ng");
var emitter = require("./emitter");
var glob = require("glob");
var vm = require("vm");
function RunProgram(src, ff) {
    fs.writeFileSync(ff, src);
    var rc = sh.exec("C:/bin/zbs/bin/lua " + ff);
    //console.log(rc.stdout);
    //console.log("Return Code", rc.code);
    return rc.stdout;
}
function ComparePrograms(fn) {
    process.stdout.write("Test: " + fn);
    var js_stdout = "";
    var print = function (s) {
        js_stdout += s + "\r\n";
    };
    //var print = console.log;
    var flua = fn.replace(".js", ".lua");
    var source = fs.readFileSync(fn).toString();
    var luaRT = fs.readFileSync("runtime.lua").toString();
    var jsRT = fs.readFileSync("runtime.js").toString();
    var ns = /@negative|negative: (.*)/.exec(source);
    var hasEval = /eval\(/.exec(source);
    var hasWith = /with[ ]?\(/.exec(source);
    var hasTry = /try( {|{)/.exec(source);
    var hasOther = /LUA_SKIP/.exec(source);
    var onlyStrict = /\"use strict\"/.exec(source);
    var hasGlobalDeleteTest = /Compound Assignment Operator calls PutValue\(lref, v\)/.exec(source);
    var expectErrors = false;
    if (hasEval || hasWith || hasTry || hasOther || hasGlobalDeleteTest || onlyStrict) {
        console.log(" [SKIP]");
        return "skip";
    }
    if (ns) {
        //console.log("NEG: ", ns[1]);
        expectErrors = true;
    }
    if (expectErrors) {
        try {
            var luasrc = emitter.convertFile(source, fn);
            vm.runInNewContext(jsRT + source, { print: print }, fn);
            //eval(jsRT + source);
            var lua_stdout = RunProgram(luaRT + luasrc, flua);
            if (js_stdout.trim().length == 0 || lua_stdout.trim().length == 0) {
                console.log(" NEG FAIL!\r\n===========================================");
                return false;
            }
            else {
                console.log(" NEG OK");
                return true;
            }
        }
        catch (e) {
            console.log(" [OK-]");
            return true;
        }
    }
    else {
        var luasrc = emitter.convertFile(source, fn);
        vm.runInNewContext(jsRT + source, { print: print }, fn);
        var lua_stdout = RunProgram(luaRT + luasrc, flua);
        if (js_stdout.trim().length != 0 || lua_stdout.trim().length != 0) {
            console.log(" POS FAIL!\r\n===========================================");
            console.log("JS:", js_stdout);
            console.log("Lua:", lua_stdout);
            return false;
        }
        else {
            console.log(" [OK+]");
            return true;
        }
    }
}
var arg = process.argv[2];
var filenames = glob.sync(arg.replace("\\", "/"));
var total = filenames.length;
var passed = 0;
var failed = 0;
var skipped = 0;
filenames.forEach(function (fn) {
    var pass = ComparePrograms(fn);
    if (pass == "skip") {
        skipped++;
    }
    else if (pass) {
        passed++;
    }
    else {
        failed++;
    }
});
console.log("Passed:", passed, "Failed:", failed, "Skipped:", skipped, "Total:", total);
//# sourceMappingURL=app.js.map