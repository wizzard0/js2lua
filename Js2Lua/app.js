var fs = require("fs");
var sh = require("execsync-ng");
var emitter = require("./emitter");
var glob = require("glob");
function RunProgram(src, ff) {
    fs.writeFileSync(ff, src);
    var rc = sh.exec("C:/bin/zbs/bin/lua " + ff);
    console.log(rc.stdout);
    console.log("Return Code", rc.code);
}
function ComparePrograms(fn) {
    console.log("Test: ", fn);
    var print = console.log;
    var flua = fn.replace(".js", ".lua");
    var source = fs.readFileSync(fn).toString();
    var luaRT = fs.readFileSync("runtime.lua").toString();
    var jsRT = fs.readFileSync("runtime.js").toString();
    var ns = /negative: (.*)/.exec(source);
    var expectErrors = false;
    if (ns) {
        console.log("NEG: ", ns[1]);
        expectErrors = true;
    }
    if (expectErrors) {
        try {
            var luasrc = emitter.convertFile(source, fn);
            console.log("JS==");
            eval(jsRT + source);
            console.log("LUA==");
            RunProgram(luaRT + luasrc, flua);
        }
        catch (e) {
        }
    }
    else {
        var luasrc = emitter.convertFile(source, fn);
        console.log("JS==");
        eval(jsRT + source);
        console.log("LUA==");
        RunProgram(luaRT + luasrc, flua);
    }
}
var arg = process.argv[2];
var filenames = glob.sync(arg.replace("\\", "/"));
filenames.forEach(function (fn) {
    ComparePrograms(fn);
});
//# sourceMappingURL=app.js.map