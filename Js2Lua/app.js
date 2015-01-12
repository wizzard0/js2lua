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
    var print = console.log;
    var source = fs.readFileSync(fn);
    console.log(source);
    var luasrc = emitter.convertFile(source, fn);
    console.log("JS==");
    tc();
    console.log("LUA==");
    RunProgram(luasrc);
}
//# sourceMappingURL=app.js.map