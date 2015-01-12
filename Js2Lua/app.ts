import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");
import emitter = require("./emitter");
import glob = require("glob");


function RunProgram(src: string, ff: string) {
    fs.writeFileSync(ff, src);
    var rc = sh.exec("C:/bin/zbs/bin/lua " + ff);
    console.log(rc.stdout);
    console.log("Return Code", rc.code);
}

function ComparePrograms(fn: string) {
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
    try {
        //console.log(source);
        var luasrc = emitter.convertFile(source, fn);
        //console.log(luasrc);

        console.log("JS==");
        eval(jsRT + source);
        console.log("LUA==");
        RunProgram(luaRT + luasrc, flua);
    } catch (e) {
        if (!expectErrors) {
            console.log(e);
        }
    }
}

var arg = process.argv[2];
var filenames = glob.sync(arg.replace("\\", "/"));
filenames.forEach(function (fn) {
    ComparePrograms(fn);
});