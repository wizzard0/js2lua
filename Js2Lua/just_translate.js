var emitter = require("./emitter");
var fs = require("fs");
// ripped from rw
function decode(options) {
    if (options) {
        if (typeof options === "string")
            return encoding(options);
        if (options.encoding !== null)
            return encoding(options.encoding);
    }
    return identity();
}
;
function identity() {
    var chunks = [];
    return {
        push: function (chunk) {
            chunks.push(chunk);
        },
        value: function () {
            return Buffer.concat(chunks);
        }
    };
}
function encoding(encoding) {
    var chunks = [];
    return {
        push: function (chunk) {
            chunks.push(chunk);
        },
        value: function () {
            return Buffer.concat(chunks).toString(encoding);
        }
    };
}
function encode(data, options) {
    return typeof data === "string" ? new Buffer(data, typeof options === "string" ? options : options && options.encoding !== null ? options.encoding : "utf8") : data;
}
;
function readStdinSync(options) {
    var fd = process.stdin.fd;
    var decoder = decode();
    while (true) {
        try {
            var buffer = new Buffer(32768), bytesRead = fs.readSync(fd, buffer, 0, 32768, undefined);
        }
        catch (e) {
            if (e.code === "EOF")
                break;
            fs.closeSync(fd);
            throw e;
        }
        if (bytesRead === 0)
            break;
        decoder.push(buffer.slice(0, bytesRead));
    }
    fs.closeSync(fd);
    return decoder.value();
}
function writeStdoutSync(data, options) {
    var fd = process.stdout.fd, bytesWritten = 0, bytesTotal = (data = encode(data, options)).length;
    while (bytesWritten < bytesTotal) {
        try {
            bytesWritten += fs.writeSync(fd, data, bytesWritten, bytesTotal - bytesWritten, null);
        }
        catch (error) {
            if (error.code === "EPIPE")
                break; // ignore broken pipe, e.g., | head
            fs.closeSync(fd);
            throw error;
        }
    }
    fs.closeSync(fd);
}
;
try {
    var data = readStdinSync().toString().replace(/\0/g, '');
    //process.stderr.write("READ OK\r\n");
    //process.stderr.write("ERRx:" + encodeURIComponent(data) + ">>\r\n");
    //console.log(data);
    var translated = emitter.convertFile(data, '__evalcode__', false);
    // no polyfills here, because we're supposed to eval in context
    //console.log(translated);
    //process.stderr.write("WRITING\r\n");
    writeStdoutSync(translated);
}
catch (e) {
    //process.stderr.write("TRANSLATE FAIL\r\n");
    //console.log(e.message);
    if (e.message.substr(0, 5) == 'Line ') {
        console.log("SyntaxError ", e);
    }
    else {
        console.log(e.toString());
    }
}
//# sourceMappingURL=just_translate.js.map