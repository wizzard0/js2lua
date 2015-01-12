var esprima = require("esprima");
var util = require("util");
var print = console.log;
var tc = function t() {
    print("foobar", 2 + 2);
};
var source = tc.toString();
console.log('js2lua');
console.log(source);
var ast = esprima.parse(source);
console.log(util.inspect(ast, false, 999, true));
var luasrc = "";
var emit = function (code) {
    luasrc += code;
    process.stdout.write(code);
};
function EmitProgram(ast, emit) {
    // hack
    emit("\r\n-- BEGIN\r\n");
    var rootFunctionBody = ast.body[0].body.body;
    for (var si = 0; si < rootFunctionBody.length; si++) {
        var stmt = rootFunctionBody[si];
        switch (stmt.type) {
            case "ExpressionStatement":
                EmitExpression(stmt.expression, emit);
                break;
            default:
                emit("--[[");
                emit(stmt.type);
                emit("]]");
                break;
        }
    }
    emit("\r\n-- END\r\n");
}
function EmitExpression(ex, emit) {
    switch (ex.type) {
        case "CallExpression":
            EmitCall(ex, emit);
            break;
        case "Identifier":
            emit(ex.name);
            break;
        case "Literal":
            EmitLiteral(ex, emit);
            break;
        default:
            emit("--[[");
            emit(ex.type);
            emit("]]");
            break;
    }
}
function EmitCall(ast, emit) {
    EmitExpression(ast.callee, emit);
    emit("(");
    for (var si = 0; si < ast.arguments.length; si++) {
        var arg = ast.arguments[si];
        EmitExpression(arg, emit);
        if (si != ast.arguments.length - 1) {
            emit(",");
        }
    }
    emit(")");
}
function EmitLiteral(ex, emit) {
    emit(JSON.stringify(ex.value)); // TODO
}
EmitProgram(ast, emit);
//# sourceMappingURL=app.js.map