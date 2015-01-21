var fs = require("fs");
//import sh = require("execsync-ng");
var emitter = require("./emitter");
var proc = require("child_process");
var fn = process.argv[2];
var flua = fn.replace(".js", ".lua");
if (fn == flua)
    throw new Error("cannot overwrite files!");
var luaRT = fs.readFileSync("runtime.lua").toString();
var source = fs.readFileSync(fn).toString();
var polyfills = fs.readFileSync("polyfills.js").toString();
var luasrc = emitter.convertFile(polyfills + source, fn, false);
fs.writeFileSync(flua, luaRT + luasrc);
var profile = false;
//(profile ? "-jp=a " : "") + flua
var rc = proc.spawn("cmd", ["/c \\bin\\luajit\\luajit " + (profile ? "-jp=a " : "") + flua], { stdio: 'inherit' });
//# sourceMappingURL=run.js.map