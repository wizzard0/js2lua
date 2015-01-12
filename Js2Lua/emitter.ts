import esprima = require("esprima");
import util = require("util");
import esutils = require("esutils");

function EmitProgram(ast: esprima.Syntax.Program, emit: (s: string) => void, alloc: () => number) {
    // hack
    emit("\r\n-- BEGIN\r\n");
    EmitBlock(ast, emit, alloc);
    //var rootFunctionBody = (<esprima.Syntax.FunctionDeclaration>ast.body[0]).body.body;
    //for (var si = 0; si < rootFunctionBody.length; si++) {
    //    var stmt = rootFunctionBody[si];
    //    EmitStatement(stmt, emit);
    //}
    emit("\r\n-- END\r\n");
}

function EmitVariableDeclaration(ex: esprima.Syntax.VariableDeclaration, emit: (s: string) => void, alloc: () => number) {
    for (var i = 0; i < ex.declarations.length; i++) {
        var vd = ex.declarations[i];
        EmitVariableDeclarator(vd, emit, alloc);
    }
}

function EmitVariableDeclarator(vd: esprima.Syntax.VariableDeclarator, emit: (s: string) => void, alloc: () => number) {
    emit("local ");
    EmitExpression(vd.id, emit, alloc); // identifier
    emit(" = ");
    EmitExpression(vd.init, emit, alloc);
    emit(";\r\n");
}

function EmitExpression(ex: esprima.Syntax.Expression, emit: (s: string) => void, alloc: () => number) {
    if (!ex) {
        emit('nil');
        return;
    }
    //console.warn(ex.type);
    switch (ex.type) {
        case "CallExpression":
            EmitCall(<esprima.Syntax.CallExpression>ex, emit, alloc);
            break;
        case "AssignmentExpression":
            EmitAssignment(<esprima.Syntax.AssignmentExpression>ex, emit, alloc);
            break;
        case "BinaryExpression":
            EmitBinary(<esprima.Syntax.BinaryExpression>ex, emit, alloc);
            break;
        case "LogicalExpression":
            EmitLogical(<esprima.Syntax.LogicalExpression>ex, emit, alloc);
            break;
        case "UpdateExpression":
            EmitUpdate(<esprima.Syntax.UpdateExpression>ex, emit, alloc);
            break;
        case "ArrayExpression":
            EmitArray(<esprima.Syntax.ArrayExpression>ex, emit, alloc);
            break;
        case "MemberExpression":
            EmitMember(<esprima.Syntax.MemberExpression>ex, emit, alloc);
            break;
        case "UnaryExpression":
            EmitUnary(<esprima.Syntax.UnaryExpression>ex, emit, alloc);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(<esprima.Syntax.FunctionExpression>ex, emit, alloc);
            break;
        case "Identifier":
            EmitIdentifier(<esprima.Syntax.Identifier>ex, emit, alloc);
            break;
        case "Literal":
            EmitLiteral(<esprima.Syntax.Literal>ex, emit, alloc);
            break;
        default:
            emit("--[[2"); emit(ex.type); emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}

function EmitForStatement(ast: esprima.Syntax.ForStatement, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ast, false, 999, true));
    EmitVariableDeclaratorOrExpression(ast.init, emit, alloc);
    emit("while ");
    EmitExpression(ast.test, emit, alloc);
    emit(" do\r\n");
    EmitStatement(ast.body, emit, alloc);
    emit("\r\n-- BODY END\r\n");
    EmitExpression(ast.update, emit, alloc);
    emit(" end"); // any breaks?
}

function EmitForInStatement(ast: esprima.Syntax.ForInStatement, emit: (s: string) => void, alloc: () => number) {
    emit("for ");
    EmitExpression(ast.left, emit, alloc);
    emit(",");
    EmitExpression({ type: 'Identifier', name: '_tmp' + alloc() }, emit, alloc);
    emit(" in ");
    EmitCall({
        type: 'CallExpression',
        callee: { 'type': 'Identifier', 'name': '__Iterate' },
        arguments: [ast.right]
    }, emit, alloc);
    emit(" do\r\n");
    EmitStatement(ast.body, emit, alloc);
    emit(" end"); // any breaks?
}


function EmitVariableDeclaratorOrExpression(ast: esprima.Syntax.VariableDeclaratorOrExpression, emit: (s: string) => void, alloc: () => number) {
    if (ast.type == 'VariableDeclaration') {
        EmitVariableDeclaration(<esprima.Syntax.VariableDeclaration><any>ast, emit, alloc);
    } else if (esutils.ast.isExpression(ast)) {
        EmitExpression(ast, emit, alloc);
    } else {
        emit("--[[5"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
    }
}

function EmitIdentifier(ast: esprima.Syntax.Identifier, emit: (s: string) => void, alloc: () => number) {
    var ein = (<esprima.Syntax.Identifier>ast).name;
    ein = ein.replace("$", "_USD_");
    if (ein == 'arguments') { // HACK
        ein = 'arg';
    }
    emit(ein);
}

function EmitFunctionExpr(ast: esprima.Syntax.FunctionExpression, emit: (s: string) => void, alloc: () => number) {
    emit("function (");
    for (var si = 0; si < ast.params.length; si++) {
        var arg = ast.params[si];
        EmitExpression(arg, emit, alloc);
        if (si != ast.params.length - 1) {
            emit(",");
        }
    }
    emit(")");
    EmitBlock(ast.body, emit, alloc);
    emit(" end"); // any breaks?
}

function EmitArray(ast: esprima.Syntax.ArrayExpression, emit: (s: string) => void, alloc: () => number) {
    emit("{");
    for (var si = 0; si < ast.elements.length; si++) {
        var arg = ast.elements[si];
        EmitExpression(arg, emit, alloc);
        if (si != ast.elements.length - 1) {
            emit(", ");
        }
    }
    emit("}");
}

function EmitFunctionDeclaration(ast: esprima.Syntax.FunctionDeclaration, emit: (s: string) => void, alloc: () => number) {
    emit("local ");
    EmitExpression(ast.id, emit, alloc);
    emit(";");
    EmitExpression(ast.id, emit, alloc);
    emit(" = ");
    EmitFunctionExpr(ast, emit, alloc);
}

function EmitBlock(ast: esprima.Syntax.BlockStatement, emit: (s: string) => void, alloc: () => number) {
    if (ast.type != 'BlockStatement' && ast.type != 'Program') {
        emit("--[[3"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        EmitStatement(arg, emit, alloc);
        emit("\r\n");
    }
}

function EmitAssignment(ast: esprima.Syntax.AssignmentExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    if (aop != '=' && aop.length != 2) {
        emit("--[[4"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    EmitExpression(ast.left, emit, alloc);
    if (aop == '=') {
        emit(aop);
        EmitExpression(ast.right, emit, alloc);
    } else if (aop.length == 2) {
        emit('=');
        EmitBinary({
            type: 'BinaryExpression',
            operator: aop.substr(0, 1),
            left: ast.left,
            right: ast.right
        }, emit, alloc);
    } else {
        throw new Error("EmitAssignment");
    }
}

function EmitUpdate(ast: esprima.Syntax.UpdateExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    if (aop != '++' && aop != '--') {
        emit("--[[6"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    EmitAssignment({
        type: 'AssignmentExpression',
        operator: aop.substr(0, 1) + '=',
        left: ast.argument,
        right: { type: 'Literal', value: 1, raw: '1' }
    }, emit, alloc);
}

function EmitUnary(ast: esprima.Syntax.UnaryExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    if (aop == 'typeof') {
        emit("__Typeof");
        emit("(");
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    } else if (aop == '!') {
        emit("(not ");
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    } else if (aop == '+' || aop == '-') {
        emit(aop == '-' ? "(-" : "("); // TODO ToNumber
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    } else {
        emit("--[[5"); emit(ast.type); emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
}


function EmitStatement(stmt: esprima.Syntax.Statement, emit: (s: string) => void, alloc: () => number) {
    //console.warn(ex.type);
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(<esprima.Syntax.ReturnStatement>stmt, emit, alloc);
            break;
        case "EmptyStatement":
            emit(";");
            break;
        case "IfStatement":
            EmitIf(<esprima.Syntax.IfStatement>stmt, emit, alloc);
            break;
        case "ForStatement":
            EmitForStatement(<esprima.Syntax.ForStatement>stmt, emit, alloc);
            break;
        case "ForInStatement":
            EmitForInStatement(<esprima.Syntax.ForInStatement>stmt, emit, alloc);
            break;
        case "BlockStatement":
            EmitBlock(<esprima.Syntax.BlockStatement>stmt, emit, alloc);
            break;
        case "ExpressionStatement":
            EmitExpression((<esprima.Syntax.ExpressionStatement>stmt).expression, emit, alloc);
            break;
        case "VariableDeclaration":
            EmitVariableDeclaration((<esprima.Syntax.VariableDeclaration>stmt), emit, alloc);
            break;
        case "FunctionDeclaration":
            EmitFunctionDeclaration((<esprima.Syntax.FunctionDeclaration>stmt), emit, alloc);
            emit("\r\n");
            break;
        default:
            emit("--[[1"); emit(stmt.type); emit("]]");
            console.log(util.inspect(stmt, false, 999, true));
            break;
    }
}

function EmitIf(ast: esprima.Syntax.IfStatement, emit: (s: string) => void, alloc: () => number) {
    emit("if ");
    EmitExpression(ast.test, emit, alloc);
    emit(" then\r\n");
    EmitStatement(ast.consequent, emit, alloc);
    if (ast.alternate) {
        emit(" else\r\n");
        EmitStatement(ast.alternate, emit, alloc);
    }
    emit(" end");
}

function EmitReturn(ast: esprima.Syntax.ReturnStatement, emit: (s: string) => void, alloc: () => number) {
    emit("return ");
    EmitExpression(ast.argument, emit, alloc);
}


function EmitBinary(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    if (aop == '+') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__PlusOp' },
            arguments: [ast.left, ast.right]
        }, emit, alloc);
    } else {
        if (aop == '!==' || aop == '!=') {
            aop = '~=';
        }
        if (aop == '===') {
            aop = '==';
        }
        emit("(");
        EmitExpression(ast.left, emit, alloc);
        emit(aop);
        EmitExpression(ast.right, emit, alloc);
        emit(")");
    }
}

function EmitLogical(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;

    if (aop == '||') {
        aop = 'or';
    }
    if (aop == '&&') {
        aop = 'and';
    }
    emit("(");
    EmitExpression(ast.left, emit, alloc);
    emit(aop);
    EmitExpression(ast.right, emit, alloc);
    emit(")");
}

function EmitMember(ast: esprima.Syntax.MemberExpression, emit: (s: string) => void, alloc: () => number) {
    if (ast.property.name == 'length') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__Length' },
            arguments: [ast.object]
        }, emit, alloc);
    } else {
        EmitExpression(ast.object, emit, alloc);
        emit(".");
        EmitExpression(ast.property, emit, alloc);
    }
}

function EmitCall(ast: esprima.Syntax.CallExpression, emit: (s: string) => void, alloc: () => number) {
    EmitExpression(ast.callee, emit, alloc);
    emit("(");
    for (var si = 0; si < ast.arguments.length; si++) {
        var arg = ast.arguments[si];
        EmitExpression(arg, emit, alloc);
        if (si != ast.arguments.length - 1) {
            emit(",");
        }
    }
    emit(")");
}

function EmitLiteral(ex: esprima.Syntax.Literal, emit: (s: string) => void, alloc: () => number) {
    emit(JSON.stringify(ex.value)); // TODO
}

export function convertFile(source: string, fn: string): string {
    var allocIndex = 0;
    var alloc = function () {
        allocIndex++;
        return allocIndex;
    }

    var ast = esprima.parse(source);

    var luasrc = "";
    var emit = function (code) {
        luasrc += code;
        //process.stdout.write(code);
    }

    EmitProgram(ast, emit, alloc);
    return luasrc;
}