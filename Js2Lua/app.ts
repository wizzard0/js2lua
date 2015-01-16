import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");
import emitter = require("./emitter");
import glob = require("glob");
var vm = require("vm");


function RunProgram(src: string, ff: string) {
    fs.writeFileSync(ff, src);
    var rc = sh.exec("C:/bin/zbs/bin/lua " + ff);
    //console.log(rc.stdout);
    //console.log("Return Code", rc.code);
    return rc.stdout;
}

function ComparePrograms(fn: string): any {
    console.log(" TRYING " + fn);
    //process.stdout.write(".");
    var js_stdout = "";
    var print = function (s) {
        js_stdout += s + "\r\n";
       // console.log(s);
    };
    //var print = console.log;
    var flua = fn.replace(".js", ".lua");
    var source = fs.readFileSync(fn).toString();
    var polyfills = fs.readFileSync("polyfills.js").toString();
    var luaRT = fs.readFileSync("runtime.lua").toString();
    var jsRT = fs.readFileSync("runtime.js").toString();
    var ns = /@negative|negative: (.*)/.exec(source);
    var hasEval = /eval\(/.exec(source);
    var hasWith = /with[ ]?\(/.exec(source);
    var hasTry = /finally( {|{)/.exec(source);
    var hasSwitch = /switch/.exec(source);
    var hasOther = /LUA_SKIP/.exec(source);
    var onlyStrict = /\"use strict\"/.exec(source);
    var hasGlobalDeleteTest = /Compound Assignment Operator calls PutValue\(lref, v\)/.exec(source);
    var weirdTests = /S15\.9\.3\.1_A5|INFINITY/.exec(source);
    var hasAnythingToDoWithDate = /Date(\.|\()/.exec(source);
    var hasIntl = /testIntl|\bIntl\b/.exec(source);
    var expectErrors = false;
    var polyfillSrc = emitter.convertFile(polyfills, "polyfills.js");

    if (hasEval || hasWith
    //|| hasTry
        || hasSwitch
        || hasOther || weirdTests
       // || hasAnythingToDoWithDate
        || hasGlobalDeleteTest || hasIntl || onlyStrict
        ) {
        //console.log(" [SKIP]");
        return "skip";
    }
    if (ns) {
        expectErrors = true;
    }
    if (expectErrors) {
        try {
            var luasrc = emitter.convertFile(source, fn);
            vm.runInNewContext(jsRT + source, { print: print, console: { log: print } }, fn);
            var lua_stdout = RunProgram(luaRT + polyfillSrc + luasrc, flua);
            if (js_stdout.trim().length == 0 || lua_stdout.trim().length == 0) {
                console.log(" NEG FAIL! == " + fn);
                return false;
            } else {
                //console.log(" NEG OK");
                return true;
            }
        } catch (e) {
            //console.log(" [OK-]");
            return true;
        }
    } else {
        var luasrc = emitter.convertFile(source, fn);
        if (/--\[\[/.exec(luasrc)) {
            console.log(" [FAIL] NO CODE GENERATED " + fn);
            console.log("PARTIAL: ", luasrc);
            return "nocode";
        }
        var time1 = +new Date();
        try {
            vm.runInNewContext(jsRT + source, { print: print, console: { log: print } }, fn);
        } catch (e) {
            console.log("JS version failure: ", e);
            return "skip";
        }
        var time2 = +new Date();
        var lua_stdout = RunProgram(luaRT + polyfillSrc + luasrc, flua);
        var time3 = +new Date();
        var t1 = js_stdout.trim().replace(/\r\n/g, '\n');
        var t2 = lua_stdout.trim().replace(/\r\n/g, '\n');

    if ((t1 || t2) && ((t1 != t2) || (/ERROR/.exec(t2)))) {
            if (/expected|outside a vararg|undefined label/.exec(lua_stdout)
                && !/table expected, got/.exec(lua_stdout)
                && !/value expected/.exec(lua_stdout)
                && !/undefined label '__Continue6'/.exec(lua_stdout) // continue from try
                && !/string expected, got/.exec(lua_stdout)
                && !/number expected, got/.exec(lua_stdout)) {
                console.log(" [SYNTAX] FAIL == " + fn);
                console.log("JS:", js_stdout);
                console.log("\r\nLua SRC:", luasrc);
                console.log("\r\nLua:", lua_stdout);
                return "nocode"; // generated invalid Lua code
            } else {
                console.log(" [RUNTIME] FAIL == " + fn);
                console.log("JS:", js_stdout);
                console.log("Lua:", lua_stdout);
                console.log("TIME JS: ", time2 - time1, " TIME LUA: ", time3 - time2);
                return false;
            }
        } else {
            //console.log(" [OK+]");
            console.log("TIME JS: ", time2 - time1, " TIME LUA: ", time3 - time2);
            return true;
        }
    }
}

var arg = process.argv[2];
var maxSyntaxErrors = 999999;
if (process.argv[3]) {
    maxSyntaxErrors = parseInt(process.argv[3]);
}
var filenames = glob.sync(arg.replace("\\", "/"));
var total = filenames.length;
var passed = 0;
var failed = 0;
var skipped = 0;
var nocode = 0;
var start = +new Date();
filenames.forEach(function (fn) {
    var pass = ComparePrograms(fn);
    if (pass == "skip") { skipped++ }
    else if (pass == "nocode") {
        nocode++;
        if (nocode > maxSyntaxErrors) { // skip 1
            throw new Error("giving up");
        }
    }
    else if (pass) { passed++ } else { failed++ }
});
var end = +new Date();
console.log("Passed:", passed, "Failed:", failed, "Cannot Translate:", nocode, "Skipped:", skipped, "Total:", total, "Time: ", (end - start) * 0.001);