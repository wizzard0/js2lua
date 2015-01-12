import esprima = require("esprima");
import util = require("util");
import fs = require("fs");
import sh = require("execsync-ng");

var print = console.log;

var tc = function t() { 
    var $ERROR = function (s) {
        print("ERROR: ", s);
    }
    var s = 2 + 2;
    var adder = function (a, b) {
        return a + b;
    }
    function fac(n) {
        if (n == 0) {
            return 1;
        } else {
            return n * fac(n - 1);
        }
    }

    function S8_3_A1_T1() {
        if (x !== undefined) {
            $ERROR("#0 x !== undefined, but actual is " + x);
        }

        ////////////////////////////////////////////////////////////////////////
        // CHECK#1
        var x = true;
        var y = false;

        if (x !== true) {
            $ERROR("#1.1 x !== true, but actual is " + x);
        }

        if (y !== false) {
            $ERROR("#1.1 y !== false, but actual is " + y);
        } 
    }
    print(s);
    print(adder(s, s));
    print(fac(6));
    print("==TEST262");
    S8_3_A1_T1();
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
        EmitStatement(stmt, emit);
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
            var ein = (<esprima.Syntax.Identifier>ex).name;
            ein = ein.replace("$", "_USD_");
            emit(ein);
            break;
        case "Literal":
            EmitLiteral(<esprima.Syntax.Literal>ex, emit);
            break;
        default:
            emit("--[[2"); emit(ex.type); emit("]]");
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

function EmitFunctionDeclaration(ast: esprima.Syntax.FunctionDeclaration, emit: (s: string) => void) {
    emit("local ");
    EmitExpression(ast.id, emit);
    emit(";");
    EmitExpression(ast.id, emit);
    emit(" = ");
    EmitFunctionExpr(ast, emit);
}

function EmitBlock(ast: esprima.Syntax.BlockStatement, emit: (s: string) => void) {
    if (ast.type != 'BlockStatement') {
        emit("--[[3"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        EmitStatement(arg, emit);
        emit("\r\n");
    }
}

function EmitStatement(stmt: esprima.Syntax.Statement, emit: (s: string) => void) {
    //console.warn(ex.type);
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(<esprima.Syntax.ReturnStatement>stmt, emit);
            break;
        case "IfStatement":
            EmitIf(<esprima.Syntax.IfStatement>stmt, emit);
            break;
        case "BlockStatement":
            EmitBlock(<esprima.Syntax.BlockStatement>stmt, emit);
            break;
        case "ExpressionStatement":
            EmitExpression((<esprima.Syntax.ExpressionStatement>stmt).expression, emit);
            break;
        case "VariableDeclaration":
            EmitVariableDeclaration((<esprima.Syntax.VariableDeclaration>stmt), emit);
            break;
        case "FunctionDeclaration":
            EmitFunctionDeclaration((<esprima.Syntax.FunctionDeclaration>stmt), emit);
            emit("\r\n");
            break;
        default:
            emit("--[[1"); emit(stmt.type); emit("]]");
            console.log(util.inspect(stmt, false, 999, true));
            break;
    }
}

function EmitIf(ast: esprima.Syntax.IfStatement, emit: (s: string) => void) {
    emit("if ");
    EmitExpression(ast.test, emit);
    emit(" then ");
    EmitStatement(ast.consequent, emit);
    if (ast.alternate) {
        emit(" else ");
        EmitStatement(ast.alternate, emit);
    }
    emit(" end");
}

function EmitReturn(ast: esprima.Syntax.ReturnStatement, emit: (s: string) => void) {
    emit("return ");
    EmitExpression(ast.argument, emit);
}


function EmitBinary(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void) {
    var aop = ast.operator;
    if (aop == '!==' || aop == '!=') {
        aop = '~=';
    }
    emit("(");
    EmitExpression(ast.left, emit);
    emit(aop);
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
