import emitter = require("./emitter");
import fs = require("fs");

// ripped from rw
function decode(options: any): any {
    if (options) {
        if (typeof options === "string") return encoding(options);
        if (options.encoding !== null) return encoding(options.encoding);
    }
    return identity();
};

function identity() {
    var chunks = [];
    return {
        push: function (chunk) { chunks.push(chunk); },
        value: function () { return Buffer.concat(chunks); }
    };
}

function encoding(encoding) {
    var chunks = [];
    return {
        push: function (chunk) { chunks.push(chunk); },
        value: function () { return Buffer.concat(chunks).toString(encoding); }
    };
}


function readStdinSync(options?) {

    var fd = (<any>process.stdin).fd;
    var decoder = decode(options);

    while (true) {
        try {
            var buffer = new Buffer(32768),
                bytesRead = fs.readSync(fd, buffer, 0, 32768, undefined);
        } catch (e) {
            if (e.code === "EOF") break;
            fs.closeSync(fd);
            throw e;
        }
        if (bytesRead === 0) break;
        decoder.push(buffer.slice(0, bytesRead));
    }

    fs.closeSync(fd);
    return decoder.value();
}


try {
    var data = readStdinSync();
    //console.log(data);
    var translated = emitter.convertFile(data.toString(), '__evalcode__', false);
    // no polyfills here, because we're supposed to eval in context
    console.log(translated);
} catch (e) {
    //console.log(e.message);
    if (e.message.substr(0, 5) == 'Line ') {
        console.log("SyntaxError ", e);
    } else {
        console.log(e);
    }
}
