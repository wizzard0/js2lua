var rte = require("readtoend");
var emitter = require("./emitter");
rte.readToEnd(process.stdin, function (err, data) {
    try {
        //console.log(data);
        var translated = emitter.convertFile(data.toString(), '__evalcode__', false);
        // no polyfills here, because we're supposed to eval in context
        console.log(translated);
    }
    catch (e) {
        //console.log(e.message);
        if (e.message.substr(0, 5) == 'Line ') {
            console.log("SyntaxError ", e);
        }
        else {
            console.log(e);
        }
    }
});
//# sourceMappingURL=just_translate.js.map