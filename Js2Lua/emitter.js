var esprima = require("esprima");
var util = require("util");
var esutils = require("esutils");
function EmitProgram(ast, emit, alloc) {
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
function EmitVariableDeclaration(ex, emit, alloc) {
    for (var i = 0; i < ex.declarations.length; i++) {
        var vd = ex.declarations[i];
        EmitVariableDeclarator(vd, emit, alloc);
    }
}
function EmitVariableDeclarator(vd, emit, alloc) {
    emit("local ");
    EmitExpression(vd.id, emit, alloc); // identifier
    emit(" = ");
    EmitExpression(vd.init, emit, alloc);
    emit(";\r\n");
}
function EmitExpression(ex, emit, alloc) {
    if (!ex) {
        emit('nil');
        return;
    }
    switch (ex.type) {
        case "CallExpression":
            EmitCall(ex, emit, alloc);
            break;
        case "NewExpression":
            EmitNew(ex, emit, alloc);
            break;
        case "AssignmentExpression":
            EmitAssignment(ex, emit, alloc);
            break;
        case "BinaryExpression":
            EmitBinary(ex, emit, alloc);
            break;
        case "LogicalExpression":
            EmitLogical(ex, emit, alloc);
            break;
        case "UpdateExpression":
            EmitUpdate(ex, emit, alloc);
            break;
        case "ArrayExpression":
            EmitArray(ex, emit, alloc);
            break;
        case "ObjectExpression":
            EmitObject(ex, emit, alloc);
            break;
        case "MemberExpression":
            EmitMember(ex, emit, alloc);
            break;
        case "UnaryExpression":
            EmitUnary(ex, emit, alloc);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(ex, emit, alloc);
            break;
        case "Identifier":
            EmitIdentifier(ex, emit, alloc);
            break;
        case "ThisExpression":
            emit("self");
            break;
        case "Literal":
            EmitLiteral(ex, emit, alloc);
            break;
        default:
            emit("--[[2");
            emit(ex.type);
            emit("]]");
            console.log(util.inspect(ex, false, 999, true));
            break;
    }
}
function EmitForStatement(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    if (ast.init) {
        EmitVariableDeclaratorOrExpression(ast.init, emit, alloc);
    }
    emit("\r\nwhile __ToBoolean(");
    if (ast.test) {
        EmitExpression(ast.test, emit, alloc);
    }
    else {
        emit("true");
    }
    emit(") do\r\n");
    if (ast.body) {
        EmitStatement(ast.body, emit, alloc);
    }
    emit("\r\n-- BODY END\r\n");
    if (ast.update) {
        EmitExpression(ast.update, emit, alloc);
    }
    emit(" end --For\r\n"); // any breaks?
}
function EmitForInStatement(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    if (ast.left.type == 'VariableDeclaration') {
        EmitVariableDeclaration(ast.left, emit, alloc);
    }
    emit("for ");
    if (ast.left.type == 'VariableDeclaration') {
        var vd = ast.left;
        EmitExpression(vd.declarations[0].id, emit, alloc);
    }
    else {
        EmitExpression(ast.left, emit, alloc);
    }
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
    emit(" end --ForIn\r\n"); // any breaks?
}
function EmitVariableDeclaratorOrExpression(ast, emit, alloc) {
    if (ast.type == 'VariableDeclaration') {
        EmitVariableDeclaration(ast, emit, alloc);
    }
    else if (esutils.ast.isExpression(ast)) {
        EmitExpression(ast, emit, alloc);
    }
    else {
        emit("--[[5");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
    }
}
function EmitIdentifier(ast, emit, alloc) {
    var ein = ast.name;
    ein = ein.replace("$", "_USD_");
    if (ein == 'arguments') {
        ein = 'arg';
    }
    emit(ein);
}
function EmitFunctionExpr(ast, emit, alloc) {
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
    emit(" end --FunctionExpr\r\n"); // any breaks?
}
function EmitArray(ast, emit, alloc) {
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
function EmitObject(ast, emit, alloc) {
    emit("{");
    for (var si = 0; si < ast.properties.length; si++) {
        var arg = ast.properties[si];
        emit("[\"");
        EmitExpression(arg.key, emit, alloc);
        emit("\"]=");
        EmitExpression(arg.value, emit, alloc);
        if (si != ast.properties.length - 1) {
            emit(", ");
        }
    }
    emit("}");
}
function EmitFunctionDeclaration(ast, emit, alloc) {
    emit("local ");
    EmitExpression(ast.id, emit, alloc);
    emit(";");
    EmitExpression(ast.id, emit, alloc);
    emit(" = ");
    EmitFunctionExpr(ast, emit, alloc);
}
function EmitBlock(ast, emit, alloc) {
    if (ast.type != 'BlockStatement' && ast.type != 'Program') {
        emit("--[[3");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        EmitStatement(arg, emit, alloc);
        emit("\r\n");
    }
}
function EmitAssignment(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop != '=' && aop.length != 2) {
        emit("--[[4");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    EmitExpression(ast.left, emit, alloc);
    if (aop == '=') {
        emit(aop);
        EmitExpression(ast.right, emit, alloc);
    }
    else if (aop.length == 2) {
        emit('=');
        EmitBinary({
            type: 'BinaryExpression',
            operator: aop.substr(0, 1),
            left: ast.left,
            right: ast.right
        }, emit, alloc);
    }
    else {
        throw new Error("EmitAssignment");
    }
}
function EmitUpdate(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop != '++' && aop != '--') {
        emit("--[[6");
        emit(ast.type);
        emit("]]");
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
function EmitUnary(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop == 'typeof') {
        emit("__Typeof");
        emit("(");
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    }
    else if (aop == 'delete') {
        EmitDelete(ast, emit, alloc);
    }
    else if (aop == 'void') {
        emit("nil");
    }
    else if (aop == '!') {
        emit("(not ");
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    }
    else if (aop == '+' || aop == '-') {
        emit(aop == '-' ? "(-" : "("); // TODO ToNumber
        EmitExpression(ast.argument, emit, alloc);
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
function EmitDelete(ast, emit, alloc) {
    //console.log(util.inspect(ast));
    if (ast.argument.type == 'MemberExpression') {
        var ma = ast.argument;
        emit("__Delete"); // TODO emit callexpr
        emit("(");
        EmitExpression(ma.object, emit, alloc);
        emit(", \"");
        emit(ma.property.name);
        emit("\")");
    }
    else if (ast.argument.type == 'Identifier') {
        var mm = ast.argument;
        emit("__Delete");
        emit("(");
        EmitExpression({ type: 'ThisExpression' }, emit, alloc);
        emit(", \"");
        emit(mm.name);
        emit("\")");
    }
}
function EmitStatement(stmt, emit, alloc) {
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(stmt, emit, alloc);
            break;
        case "EmptyStatement":
            emit(";");
            break;
        case "BreakStatement":
            EmitBreak(stmt, emit, alloc);
            break;
        case "IfStatement":
            EmitIf(stmt, emit, alloc);
            break;
        case "ForStatement":
            EmitForStatement(stmt, emit, alloc);
            break;
        case "ForInStatement":
            EmitForInStatement(stmt, emit, alloc);
            break;
        case "DoWhileStatement":
            EmitDoWhileStatement(stmt, emit, alloc);
            break;
        case "BlockStatement":
            EmitBlock(stmt, emit, alloc);
            break;
        case "ExpressionStatement":
            EmitExpression(stmt.expression, emit, alloc);
            break;
        case "VariableDeclaration":
            EmitVariableDeclaration(stmt, emit, alloc);
            break;
        case "FunctionDeclaration":
            EmitFunctionDeclaration(stmt, emit, alloc);
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
function EmitDoWhileStatement(ast, emit, alloc) {
    emit("repeat ");
    EmitStatement(ast.body, emit, alloc);
    emit(" until __ToBoolean(");
    EmitExpression(ast.test, emit, alloc);
    emit(")");
}
function EmitIf(ast, emit, alloc) {
    emit("if __ToBoolean(");
    EmitExpression(ast.test, emit, alloc);
    emit(") then\r\n");
    EmitStatement(ast.consequent, emit, alloc);
    if (ast.alternate) {
        emit(" else\r\n");
        EmitStatement(ast.alternate, emit, alloc);
    }
    emit(" end");
}
function EmitReturn(ast, emit, alloc) {
    emit("return ");
    EmitExpression(ast.argument, emit, alloc);
}
function EmitBreak(ast, emit, alloc) {
    emit("break ");
    if (ast.label) {
        console.log(util.inspect(ast, false, 999, true));
        throw new Error("label unsupported!");
    }
}
function EmitBinary(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop == '+') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__PlusOp' },
            arguments: [ast.left, ast.right]
        }, emit, alloc);
    }
    else {
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
function EmitLogical(ast, emit, alloc) {
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
function EmitMember(ast, emit, alloc) {
    if (ast.property.name == 'length') {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__Length' },
            arguments: [ast.object]
        }, emit, alloc);
    }
    else {
        EmitExpression(ast.object, emit, alloc);
        emit(".");
        EmitExpression(ast.property, emit, alloc);
    }
}
function EmitCall(ast, emit, alloc) {
    EmitExpression(ast.callee, emit, alloc);
    emit("(");
    for (var si = 0; si < ast.arguments.length; si++) {
        var arg = ast.arguments[si];
        EmitExpression(arg, emit, alloc);
        if (si != ast.arguments.length - 1) {
            emit(", ");
        }
    }
    emit(")");
}
function EmitNew(ast, emit, alloc) {
    emit("__New(");
    EmitExpression(ast.callee, emit, alloc);
    for (var si = 0; si < ast.arguments.length; si++) {
        emit(", ");
        var arg = ast.arguments[si];
        EmitExpression(arg, emit, alloc);
    }
    emit(")");
}
function EmitLiteral(ex, emit, alloc) {
    emit(JSON.stringify(ex.value)); // TODO
}
function convertFile(source, fn) {
    var allocIndex = 0;
    var alloc = function () {
        allocIndex++;
        return allocIndex;
    };
    var ast = esprima.parse(source);
    var luasrc = "";
    var emit = function (code) {
        luasrc += code;
        //process.stdout.write(code);
    };
    EmitProgram(ast, emit, alloc);
    return luasrc;
}
exports.convertFile = convertFile;
//# sourceMappingURL=emitter.js.map