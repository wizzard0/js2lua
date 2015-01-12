import esprima = require("esprima");
import util = require("util");

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
}

function EmitProgram(ast: esprima.Syntax.Program, emit: (s: string) => void) {
    // hack
    emit("\r\n-- BEGIN\r\n");
    var rootFunctionBody = (<esprima.Syntax.FunctionDeclaration>ast.body[0]).body.body;
    for (var si = 0; si < rootFunctionBody.length; si++) {
        var stmt = rootFunctionBody[si];
        //console.warn(stmt.type);
        switch (stmt.type) {
            case "ExpressionStatement":
                EmitExpression((<esprima.Syntax.ExpressionStatement>stmt).expression, emit);
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

function EmitExpression(ex: esprima.Syntax.Expression, emit: (s: string) => void) {
    //console.warn(ex.type);
    switch (ex.type) {
        case "CallExpression":
            EmitCall(<esprima.Syntax.CallExpression>ex, emit);
            break;
        case "Identifier":
            emit((<esprima.Syntax.Identifier>ex).name);
            break;
        case "Literal":
            EmitLiteral(<esprima.Syntax.Literal>ex, emit);
            break;
        default:
            emit("--[[");
            emit(ex.type);
            emit("]]");
            break;
    }
}

function EmitCall(ast: esprima.Syntax.CallExpression, emit: (s: string) => void) {
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

function EmitLiteral(ex: esprima.Syntax.Literal, emit: (s: string) => void) {
    emit(JSON.stringify(ex.value)); // TODO
}


EmitProgram(ast, emit);