var fs = require("fs");
var sh = require("execsync-ng");
var emitter = require("./emitter");
function RunProgram(src) {
    fs.writeFileSync("x.lua", src);
    var rc = sh.exec("C:/bin/zbs/bin/lua x.lua");
    console.log(rc.stdout);
    console.log("Return Code", rc.code);
}
function ComparePrograms(fn) {
    console.log("Test: ", fn);
    var print = console.log;
    var source = fs.readFileSync(fn).toString();
    var luaRT = fs.readFileSync("runtime.lua").toString();
    var jsRT = fs.readFileSync("runtime.js").toString();
    console.log(source);
    var luasrc = emitter.convertFile(source, fn);
    //console.log(luasrc);
    console.log("JS==");
    eval(jsRT + source);
    console.log("LUA==");
    RunProgram(luaRT + luasrc);
}
ComparePrograms(".\\test\\language\\types\\boolean\\S8.3_A1_T2.js");
//# sourceMappingURL=app.js.map