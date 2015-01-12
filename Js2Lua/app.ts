import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");
import emitter = require("./emitter");


function RunProgram(src: string) {
    fs.writeFileSync("x.lua", src);
    var rc = sh.exec("C:/bin/zbs/bin/lua x.lua");
    console.log(rc.stdout);
    console.log("Return Code", rc.code);
}

function ComparePrograms(fn: string) {
    var print = console.log;
    var source = fs.readFileSync(fn);
    console.log(source);
    var luasrc = emitter.convertFile(source, fn);

    console.log("JS==");
    tc();
    console.log("LUA==");
    RunProgram(luasrc);
}