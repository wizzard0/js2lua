import esprima = require("esprima");
import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");

var print = console.log;

var tc = function t() {
    var s = 2 + 2;
    var adder = function (a, b) {
        return a + b;
    }
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
                emit(";\r\n");
                break;
            case "VariableDeclaration":
                EmitVariableDeclaration((<esprima.Syntax.VariableDeclaration>stmt), emit);
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

function EmitVariableDeclaration(ex: esprima.Syntax.VariableDeclaration, emit: (s: string) => void) {
    for (var i = 0; i < ex.declarations.length; i++) {
        var vd = ex.declarations[i];
        emit("local ");
        EmitExpression(vd.id, emit); // identifier
        emit(" = ");
        EmitExpression(vd.init, emit);
        emit(";\r\n");
    }
}

function EmitExpression(ex: esprima.Syntax.Expression, emit: (s: string) => void) {
    //console.warn(ex.type);
    switch (ex.type) {
        case "CallExpression":
            EmitCall(<esprima.Syntax.CallExpression>ex, emit);
            break;
        case "BinaryExpression":
            EmitBinary(<esprima.Syntax.BinaryExpression>ex, emit);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(<esprima.Syntax.FunctionExpression>ex, emit);
            break;
        case "Identifier":
            emit((<esprima.Syntax.Identifier>ex).name);
            break;
        case "Literal":
            EmitLiteral(<esprima.Syntax.Literal>ex, emit);
            break;
        default:
            emit("--[["); emit(ex.type); emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}

function EmitFunctionExpr(ast: esprima.Syntax.FunctionExpression, emit: (s: string) => void) {
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

function EmitBlock(ast: esprima.Syntax.BlockStatement, emit: (s: string) => void) {
    if (ast.type != 'BlockStatement') {
        emit("--[["); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        EmitStatement(arg, emit);
        emit("\r\n");
    }
}

function EmitStatement(ex: esprima.Syntax.Statement, emit: (s: string) => void) {
    //console.warn(ex.type);
    switch (ex.type) {
        case "ReturnStatement":
            EmitReturn(<esprima.Syntax.ReturnStatement>ex, emit);
            break;
        default:
            emit("--[["); emit(ex.type); emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}

function EmitReturn(ast: esprima.Syntax.ReturnStatement, emit: (s: string) => void) {
    emit("return ");
    EmitExpression(ast.argument, emit);
}


function EmitBinary(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void) {
    emit("(");
    EmitExpression(ast.left, emit);
    emit(ast.operator);
    EmitExpression(ast.right, emit);
    emit(")");
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

function RunProgram(src: string) {
    fs.writeFileSync("x.lua", src);
    var rc = sh.exec("C:/bin/zbs/bin/lua x.lua");
    console.log(rc.stdout);
    console.log("Return Code", rc.code);
}

EmitProgram(ast, emit);

console.log("JS==");
tc();
console.log("LUA==");
RunProgram(luasrc);
