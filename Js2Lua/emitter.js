var esprima = require("esprima");
var util = require("util");
function EmitProgram(ast, emit) {
    // hack
    emit("\r\n-- BEGIN\r\n");
    EmitBlock(ast, emit);
    //var rootFunctionBody = (<esprima.Syntax.FunctionDeclaration>ast.body[0]).body.body;
    //for (var si = 0; si < rootFunctionBody.length; si++) {
    //    var stmt = rootFunctionBody[si];
    //    EmitStatement(stmt, emit);
    //}
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
    if (!ex) {
        emit('nil');
        return;
    }
    switch (ex.type) {
        case "CallExpression":
            EmitCall(ex, emit);
            break;
        case "AssignmentExpression":
            EmitAssignment(ex, emit);
            break;
        case "BinaryExpression":
            EmitBinary(ex, emit);
            break;
        case "ArrayExpression":
            EmitArray(ex, emit);
            break;
        case "MemberExpression":
            EmitMember(ex, emit);
            break;
        case "UnaryExpression":
            EmitUnary(ex, emit);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(ex, emit);
            break;
        case "Identifier":
            EmitIdentifier(ex, emit);
            break;
        case "Literal":
            EmitLiteral(ex, emit);
            break;
        default:
            emit("--[[2");
            emit(ex.type);
            emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}
function EmitIdentifier(ast, emit) {
    var ein = ast.name;
    ein = ein.replace("$", "_USD_");
    if (ein == 'arguments') {
        ein = 'arg';
    }
    emit(ein);
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
function EmitArray(ast, emit) {
    emit("{");
    for (var si = 0; si < ast.elements.length; si++) {
        var arg = ast.elements[si];
        EmitExpression(arg, emit);
        if (si != ast.elements.length - 1) {
            emit(", ");
        }
    }
    emit("}");
}
function EmitFunctionDeclaration(ast, emit) {
    emit("local ");
    EmitExpression(ast.id, emit);
    emit(";");
    EmitExpression(ast.id, emit);
    emit(" = ");
    EmitFunctionExpr(ast, emit);
}
function EmitBlock(ast, emit) {
    if (ast.type != 'BlockStatement' && ast.type != 'Program') {
        emit("--[[3");
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
function EmitAssignment(ast, emit) {
    var aop = ast.operator;
    if (aop != '=') {
        emit("--[[4");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    EmitExpression(ast.left, emit);
    emit(aop);
    //    emit("(");
    EmitExpression(ast.right, emit);
    //    emit(")");
}
function EmitUnary(ast, emit) {
    var aop = ast.operator;
    if (aop == 'typeof') {
        emit("__Typeof");
        emit("(");
        EmitExpression(ast.argument, emit);
        emit(")");
    }
    else if (aop == '!') {
        emit("(not ");
        EmitExpression(ast.argument, emit);
        emit(")");
    }
    else {
        emit("--[[5");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
}
function EmitStatement(stmt, emit) {
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(stmt, emit);
            break;
        case "EmptyStatement":
            emit(";");
            break;
        case "IfStatement":
            EmitIf(stmt, emit);
            break;
        case "BlockStatement":
            EmitBlock(stmt, emit);
            break;
        case "ExpressionStatement":
            EmitExpression(stmt.expression, emit);
            break;
        case "VariableDeclaration":
            EmitVariableDeclaration(stmt, emit);
            break;
        case "FunctionDeclaration":
            EmitFunctionDeclaration(stmt, emit);
            emit("\r\n");
            break;
        default:
            emit("--[[1");
            emit(stmt.type);
            emit("]]");
            console.log(util.inspect(stmt, false, 999, true));
            break;
    }
}
function EmitIf(ast, emit) {
    emit("if ");
    EmitExpression(ast.test, emit);
    emit(" then\r\n");
    EmitStatement(ast.consequent, emit);
    if (ast.alternate) {
        emit(" else\r\n");
        EmitStatement(ast.alternate, emit);
    }
    emit(" end");
}
function EmitReturn(ast, emit) {
    emit("return ");
    EmitExpression(ast.argument, emit);
}
function EmitBinary(ast, emit) {
    var aop = ast.operator;
    if (aop == '+') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__PlusOp' },
            arguments: [ast.left, ast.right]
        }, emit);
    }
    else {
        if (aop == '!==' || aop == '!=') {
            aop = '~=';
        }
        if (aop == '===') {
            aop = '==';
        }
        emit("(");
        EmitExpression(ast.left, emit);
        emit(aop);
        EmitExpression(ast.right, emit);
        emit(")");
    }
}
function EmitMember(ast, emit) {
    if (ast.property.name == 'length') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__Length' },
            arguments: [ast.object]
        }, emit);
    }
    else {
        EmitExpression(ast.object, emit);
        emit(".");
        EmitExpression(ast.property, emit);
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
function convertFile(source, fn) {
    var ast = esprima.parse(source);
    var luasrc = "";
    var emit = function (code) {
        luasrc += code;
        //process.stdout.write(code);
    };
    EmitProgram(ast, emit);
    return luasrc;
}
exports.convertFile = convertFile;
//# sourceMappingURL=emitter.js.map