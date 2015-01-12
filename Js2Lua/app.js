var esprima = require("esprima");
var util = require("util");
var print = console.log;
var tc = function t() {
    var s = 2 + 2;
    var adder = function (a, b) {
        return a + b;
    };
    print(s);
    print(adder(s, s));
    print("foobar");
};
var source = tc.toString();
console.log('js2lua');
console.log(source);
var ast = esprima.parse(source);
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
                emit(";\r\n");
                break;
            case "VariableDeclaration":
                EmitVariableDeclaration(stmt, emit);
                break;
            default:
                emit("--[[");
                emit(stmt.type);
                emit("]]");
                console.log(util.inspect(stmt, false, 999, true));
                break;
        }
    }
    emit("\r\n-- END\r\n");
}
function EmitVariableDeclaration(ex, emit) {
    for (var i = 0; i < ex.declarations.length; i++) {
        var vd = ex.declarations[i];
        emit("local ");
        EmitExpression(vd.id, emit); // identifier
        emit(" = ");
        EmitExpression(vd.init, emit);
        emit(";\r\n");
    }
}
function EmitExpression(ex, emit) {
    switch (ex.type) {
        case "CallExpression":
            EmitCall(ex, emit);
            break;
        case "BinaryExpression":
            EmitBinary(ex, emit);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(ex, emit);
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
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}
function EmitFunctionExpr(ast, emit) {
    emit("function (");
    for (var si = 0; si < ast.params.length; si++) {
        var arg = ast.params[si];
        EmitExpression(arg, emit);
        if (si != ast.params.length - 1) {
            emit(",");
        }
    }
    emit(")");
    EmitBlock(ast.body, emit);
    emit(" end"); // any breaks?
}
function EmitBlock(ast, emit) {
    if (ast.type != 'BlockStatement') {
        emit("--[[");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        EmitStatement(arg, emit);
        emit("\r\n");
    }
}
function EmitStatement(ex, emit) {
    switch (ex.type) {
        case "ReturnStatement":
            EmitReturn(ex, emit);
            break;
        default:
            emit("--[[");
            emit(ex.type);
            emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}
function EmitReturn(ast, emit) {
    emit("return ");
    EmitExpression(ast.argument, emit);
}
function EmitBinary(ast, emit) {
    emit("(");
    EmitExpression(ast.left, emit);
    emit(ast.operator);
    EmitExpression(ast.right, emit);
    emit(")");
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