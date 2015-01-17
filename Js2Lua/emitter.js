var esprima = require("esprima");
var util = require("util");
var esutils = require("esutils");
var hoist = require("./ast-hoist");
var argfinder = require("./argfinder");
var scoping = require("./scoping");
function EmitProgram(ast, emit, alloc) {
    // hack
    var scope = new scoping.ScopeStack();
    scope.pushObjectIdent("__JsGlobalObjects", "program");
    var identList = argfinder(ast.body);
    emit("\r\n-- BEGIN\r\n");
    EmitBlock(ast, emit, alloc, false);
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
    EmitExpression(vd.id, emit, alloc, 0, false); // identifier
    emit(" = ");
    EmitExpression(vd.init, emit, alloc, 0);
    emit("\r\n");
}
function EmitExpression(ex, emit, alloc, statementContext, isRvalue, strictCheck) {
    if (isRvalue === void 0) { isRvalue = true; }
    if (strictCheck === void 0) { strictCheck = true; }
    if (!ex) {
        emit('nil');
        return;
    }
    switch (ex.type) {
        case "CallExpression":
            EmitCall(ex, emit, alloc, statementContext != 0);
            break;
        case "SequenceExpression":
            EmitSequence(ex, emit, alloc, statementContext != 0);
            break;
        case "NewExpression":
            EmitNew(ex, emit, alloc);
            break;
        case "AssignmentExpression":
            if (statementContext) {
                EmitAssignment(ex, emit, alloc);
            }
            else {
                var rightA = ex;
                emit('((function() ');
                EmitAssignment(rightA, emit, alloc);
                emit('; return ');
                EmitExpression(rightA.left, emit, alloc, 0);
                emit(' end)())');
            }
            break;
        case "BinaryExpression":
            EmitBinary(ex, emit, alloc, statementContext != 0);
            break;
        case "LogicalExpression":
            EmitLogical(ex, emit, alloc);
            break;
        case "ConditionalExpression":
            EmitConditional(ex, emit, alloc);
            break;
        case "UpdateExpression":
            EmitUpdate(ex, emit, alloc, statementContext != 0);
            break;
        case "ArrayExpression":
            EmitArray(ex, emit, alloc);
            break;
        case "ObjectExpression":
            EmitObject(ex, emit, alloc);
            break;
        case "MemberExpression":
            EmitMember(ex, emit, alloc, isRvalue, statementContext != 0);
            break;
        case "UnaryExpression":
            EmitUnary(ex, emit, alloc);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(ex, emit, alloc);
            break;
        case "Identifier":
            EmitIdentifier(ex, emit, alloc, isRvalue, strictCheck);
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
function EmitTryStatement(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    // TODO we're fucking optimistic
    var statusName = "__TryStatus" + alloc();
    var returnValue = "__TryReturnValue" + alloc();
    var catchReturnValue = "__CatchReturnValue" + alloc();
    var finalizer = "__TryFinalizer" + alloc();
    var handler = "__TryHandler" + alloc();
    emit("--TryBody\r\nlocal " + statusName + "," + returnValue + " = pcall(function ()\r\n");
    EmitStatement(ast.block, emit, alloc, false);
    emit(" end)\r\n");
    //emit("print( " + statusName + "," + returnValue + ")\r\n");
    if (ast.finalizer) {
        emit("--Finally\r\nlocal " + finalizer + "=(function() ");
        EmitStatement(ast.finalizer, emit, alloc, false);
        emit(" end)");
    }
    var ah = ast.handlers;
    if (ah.length == 0) {
    }
    else if (ah.length == 1) {
        var h = ah[0];
        var paramName = h.param.name;
        emit("--Catch\r\nlocal " + handler + "=(function(" + paramName + ") ");
        EmitStatement(h.body, emit, alloc, false);
        emit(" end)");
    }
    else {
        emit("--[[MultipleCatchClauses]]");
    }
    var erf = (ast.finalizer) ? (finalizer + "();") : "";
    // Early Return
    emit("--EarlyReturn\r\n if " + statusName + " and nil~=" + returnValue + " then " + erf + " return " + returnValue + " end;\r\n");
    // Catch
    if (ah.length) {
        emit("--CheckCatch\r\n if not " + statusName + " then " + catchReturnValue + "=" + handler + "(" + returnValue + ".data or " + returnValue + ") end;\r\n");
        emit("--CheckCatchValue\r\n if true or nil~=" + catchReturnValue + " then return " + catchReturnValue + " end;");
    }
    // Just Finally
    if (ast.finalizer) {
        emit("--JustFinalizer\r\n" + finalizer + "()");
    }
    // handlerS, not handler!
}
var NonSinkableExpressionTypes = ['VariableDeclaration', 'AssignmentExpression', 'CallExpression', 'UpdateExpression', 'SequenceExpression'];
function EmitForStatement(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    if (ast.init) {
        var ait = ast.init.type;
        if (NonSinkableExpressionTypes.indexOf(ait) == -1) {
            emit("__Sink(");
        }
        EmitVariableDeclaratorOrExpression(ast.init, emit, alloc);
        if (NonSinkableExpressionTypes.indexOf(ait) == -1) {
            emit(")");
        }
    }
    emit("\r\nwhile __ToBoolean(");
    if (ast.test) {
        EmitExpression(ast.test, emit, alloc, 0);
    }
    else {
        emit("true");
    }
    emit(") do\r\n");
    if (ast.body) {
        EmitStatement(ast.body, emit, alloc, true);
    }
    if (topContinueTargetLabelId) {
        emit("::" + topContinueTargetLabelId + "::\r\n");
        topContinueTargetLabelId = null;
    }
    emit("\r\n-- BODY END\r\n");
    if (ast.update) {
        var aut = ast.update.type;
        if (NonSinkableExpressionTypes.indexOf(aut) == -1) {
            emit("__Sink(");
        }
        EmitExpression(ast.update, emit, alloc, 1);
        if (NonSinkableExpressionTypes.indexOf(aut) == -1) {
            emit(")");
        }
    }
    emit(" end --For\r\n"); // any breaks?
}
function EmitForInStatement(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    //console.log(escodegen.generate(ast));
    if (ast.left.type == 'VariableDeclaration') {
        EmitVariableDeclaration(ast.left, emit, alloc);
    }
    emit("for ");
    if (ast.left.type == 'VariableDeclaration') {
        var vd = ast.left;
        EmitExpression(vd.declarations[0].id, emit, alloc, 0, false);
    }
    else {
        EmitExpression(ast.left, emit, alloc, 0, false);
    }
    emit(",");
    EmitExpression({ type: 'Identifier', name: '_tmp' + alloc() }, emit, alloc, 0, false);
    emit(" in ");
    EmitCall({
        type: 'CallExpression',
        callee: { 'type': 'Identifier', 'name': '__Iterate' },
        arguments: [ast.right]
    }, emit, alloc, false);
    emit(" do\r\n");
    EmitStatement(ast.body, emit, alloc, true);
    if (topContinueTargetLabelId) {
        emit("::" + topContinueTargetLabelId + "::\r\n");
        topContinueTargetLabelId = null;
    }
    emit(" end --ForIn\r\n"); // any breaks?
}
function EmitVariableDeclaratorOrExpression(ast, emit, alloc) {
    if (ast.type == 'VariableDeclaration') {
        EmitVariableDeclaration(ast, emit, alloc);
    }
    else if (esutils.ast.isExpression(ast)) {
        EmitExpression(ast, emit, alloc, 1);
    }
    else {
        emit("--[[5");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
    }
}
function EmitIdentifier(ast, emit, alloc, rvalue, strictCheck) {
    // DEBUG
    strictCheck = false;
    /// DEBUG
    var ein = ast.name;
    ein = ein.replace(/\$/g, "_USD_");
    if (Object.prototype.hasOwnProperty.call(reservedLuaKeys, ein)) {
        ein = '_R_' + ein;
    }
    if (ein.substr(0, 2) == '__' || ein == 'undefined' || BinaryOpRemapValues.indexOf(ein) != -1) {
        strictCheck = false; // dont recheck builtins
    } // TODO pass locals here and check AOT
    if (strictCheck && rvalue) {
        emit("__RefCheck(");
    }
    emit(ein);
    if (strictCheck && rvalue) {
        emit(")");
    }
}
function EmitFunctionExpr(ast, emit, alloc) {
    //console.log(util.inspect(ast, false, 999, true));
    var identList = argfinder(ast.body);
    var hasArguments = identList.indexOf('arguments') != -1;
    emit("__DefineFunction(function (self");
    if (hasArguments) {
        emit(", ...)\r\n");
        if (ast.params.length) {
            emit("local __tmp");
        }
    }
    for (var si = 0; si < ast.params.length; si++) {
        emit(",");
        var arg = ast.params[si];
        EmitExpression(arg, emit, alloc, 0, false, false);
    }
    if (hasArguments) {
        if (ast.params.length) {
            emit("=1,...");
        }
        emit("\r\nlocal arguments=...\r\n");
    }
    else {
        emit(")\r\n"); // arglist close
    }
    EmitStatement(ast.body, emit, alloc, false);
    emit(" end) --FunctionExpr\r\n"); // any breaks?
}
function EmitArray(ast, emit, alloc) {
    emit("__MakeArray({");
    for (var si = 0; si < ast.elements.length; si++) {
        emit("[" + si + "]=");
        var arg = ast.elements[si];
        EmitExpression(arg, emit, alloc, 0);
        emit(", ");
    }
    emit("[\"__Length\"]=" + ast.elements.length);
    emit("})");
}
function EmitSequence(ast, emit, alloc, StatementContext) {
    if (!StatementContext) {
        emit("({");
    }
    for (var si = 0; si < ast.expressions.length; si++) {
        var arg = ast.expressions[si];
        var et = arg.type;
        var sinkThisExpr = StatementContext && NonSinkableExpressionTypes.indexOf(et) == -1;
        if (sinkThisExpr) {
            emit(" __Sink(");
        }
        EmitExpression(arg, emit, alloc, (StatementContext && !sinkThisExpr) ? 1 : 0);
        if (sinkThisExpr) {
            emit(")");
        }
        if (si != ast.expressions.length - 1) {
            emit(StatementContext ? "\r\n" : ", ");
        }
    }
    if (!StatementContext) {
        emit("})["); // TODO this is awful, optimize this
        emit(ast.expressions.length.toString());
        emit("]");
    }
}
function EmitObject(ast, emit, alloc) {
    emit("__MakeObject({");
    for (var si = 0; si < ast.properties.length; si++) {
        var arg = ast.properties[si];
        emit("[\"");
        // always coerced to string, as per js spec
        if (arg.key.type == 'Literal') {
            emit(arg.key.value);
        }
        else {
            EmitExpression(arg.key, emit, alloc, 0, false);
        }
        emit("\"]=");
        EmitExpression(arg.value, emit, alloc, 0);
        if (si != ast.properties.length - 1) {
            emit(", ");
        }
    }
    emit("})");
}
function EmitFunctionDeclaration(ast, emit, alloc) {
    emit("local ");
    EmitExpression(ast.id, emit, alloc, 0, false);
    emit(";");
    EmitExpression(ast.id, emit, alloc, 0, false);
    emit(" = ");
    EmitFunctionExpr(ast, emit, alloc);
}
var blockAbortStatements = ['ReturnStatement', 'BreakStatement'];
function EmitBlock(ast, emit, alloc, pendingContinueInThisBlock) {
    if (ast.type != 'BlockStatement' && ast.type != 'Program') {
        emit("--[[3");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    for (var si = 0; si < ast.body.length; si++) {
        var arg = ast.body[si];
        var breaker = blockAbortStatements.indexOf(arg.type) != -1;
        if (pendingContinueInThisBlock && breaker)
            emit(" do ");
        EmitStatement(arg, emit, alloc, false);
        if (pendingContinueInThisBlock && breaker)
            emit(" end "); // because there MAY be label after return
        if (breaker)
            break; // in lua?..
        emit("\r\n");
    }
}
function EmitAssignment(ast, emit, alloc) {
    var aop = ast.operator;
    EmitExpression(ast.left, emit, alloc, 0, false);
    if (aop == '=') {
        emit(aop);
        EmitExpression(ast.right, emit, alloc, 0);
    }
    else {
        emit('=');
        EmitBinary({
            type: 'BinaryExpression',
            operator: aop.substr(0, aop.length - 1),
            left: ast.left,
            right: ast.right
        }, emit, alloc, false);
    }
}
function EmitUpdate(ast, emit, alloc, StatementContext) {
    //console.log(util.inspect(ast, false, 999, true));
    var aop = ast.operator;
    if (aop != '++' && aop != '--') {
        emit("--[[6");
        emit(ast.type);
        emit("]]");
        console.log(util.inspect(ast, false, 999, true));
        return;
    }
    if (!StatementContext) {
        emit('((function( ) ');
        if (!ast.prefix) {
            var tx = "__tmp" + alloc();
            var itx = { 'type': 'Identifier', 'name': tx };
            EmitAssignment({
                type: 'AssignmentExpression',
                operator: '=',
                left: itx,
                right: ast.argument
            }, emit, alloc);
            emit(";");
        }
    }
    EmitAssignment({
        type: 'AssignmentExpression',
        operator: aop.substr(0, 1) + '=',
        left: ast.argument,
        right: { type: 'Literal', value: 1, raw: '1' }
    }, emit, alloc);
    if (!StatementContext) {
        emit('; return ');
        EmitExpression(ast.prefix ? ast.argument : itx, emit, alloc, 0);
        emit(' end)())');
    }
    else {
        emit(";");
    }
}
function EmitUnary(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop == 'typeof') {
        emit("__Typeof");
        emit("(");
        EmitExpression(ast.argument, emit, alloc, 0, true, false);
        emit(")");
    }
    else if (aop == '~') {
        emit("bit32.bnot");
        emit("(");
        EmitExpression(ast.argument, emit, alloc, 0);
        emit(")");
    }
    else if (aop == 'delete') {
        EmitDelete(ast, emit, alloc);
    }
    else if (aop == 'void') {
        emit("nil");
    }
    else if (aop == '!') {
        emit("(not __ToBoolean(");
        EmitExpression(ast.argument, emit, alloc, 0);
        emit("))");
    }
    else if (aop == '+' || aop == '-') {
        emit(aop == '-' ? "(-__ToNumber(" : "(__ToNumber("); // TODO ToNumber
        EmitExpression(ast.argument, emit, alloc, 0);
        emit("))");
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
        EmitExpression(ma.object, emit, alloc, 0);
        emit(", \"");
        emit(ma.property.name);
        emit("\")");
    }
    else if (ast.argument.type == 'Identifier') {
        var mm = ast.argument;
        emit("__Delete");
        emit("(");
        EmitExpression({ type: 'ThisExpression' }, emit, alloc, 0);
        emit(", \"");
        emit(mm.name);
        emit("\")");
    }
    else if (ast.argument.type == 'ThisExpression') {
        emit("(true)"); // totally correct per ECMA-262
    }
    else {
        emit("(false)"); // maybe correct
    }
}
function EmitStatement(stmt, emit, alloc, pendingContinueInThisBlock) {
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(stmt, emit, alloc);
            break;
        case "AssignmentExpression":
            EmitAssignment(stmt, emit, alloc);
            break;
        case "ThrowStatement":
            EmitThrow(stmt, emit, alloc);
            break;
        case "EmptyStatement":
            emit("\r\n");
            break;
        case "BreakStatement":
            EmitBreak(stmt, emit, alloc);
            break;
        case "IfStatement":
            EmitIf(stmt, emit, alloc);
            break;
        case "WithStatement":
            EmitWith(stmt, emit, alloc);
            break;
        case "ForStatement":
            EmitForStatement(stmt, emit, alloc);
            break;
        case "TryStatement":
            EmitTryStatement(stmt, emit, alloc);
            break;
        case "ForInStatement":
            EmitForInStatement(stmt, emit, alloc);
            break;
        case "DoWhileStatement":
            EmitDoWhileStatement(stmt, emit, alloc);
            break;
        case "WhileStatement":
            EmitWhileStatement(stmt, emit, alloc);
            break;
        case "BlockStatement":
            EmitBlock(stmt, emit, alloc, pendingContinueInThisBlock);
            break;
        case "LabeledStatement":
            EmitLabeled(stmt, emit, alloc);
            break;
        case "ContinueStatement":
            EmitContinue(stmt, emit, alloc);
            break;
        case "ExpressionStatement":
            var et = (stmt.expression).type;
            if (NonSinkableExpressionTypes.indexOf(et) == -1) {
                emit(" __Sink(");
            }
            EmitExpression(stmt.expression, emit, alloc, 1);
            if (NonSinkableExpressionTypes.indexOf(et) == -1) {
                emit(")");
            }
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
// HACK
var topContinueTargetLabelId = null;
function EmitContinue(ast, emit, alloc) {
    if (ast.label) {
        emit(" goto ");
        EmitExpression(ast.label, emit, alloc, 0, false, false);
    }
    else {
        var pc = "__Continue" + alloc();
        topContinueTargetLabelId = pc;
        emit(" goto " + pc); // TODO 2 nonlabeled continue in the same loop
    }
}
function EmitLabeled(ast, emit, alloc) {
    emit("::");
    EmitExpression(ast.label, emit, alloc, 0, false, false);
    emit(":: ");
    EmitStatement(ast.body, emit, alloc, false);
    emit("::");
    EmitExpression(ast.label, emit, alloc, 0, false, false);
    emit("__After:: ");
}
function EmitDoWhileStatement(ast, emit, alloc) {
    emit("repeat ");
    EmitStatement(ast.body, emit, alloc, true);
    if (topContinueTargetLabelId) {
        emit("::" + topContinueTargetLabelId + "::\r\n");
        topContinueTargetLabelId = null;
    }
    emit(" until not __ToBoolean(");
    EmitExpression(ast.test, emit, alloc, 0);
    emit(")");
}
function EmitWhileStatement(ast, emit, alloc) {
    emit("while __ToBoolean(");
    EmitExpression(ast.test, emit, alloc, 0);
    emit(") do ");
    EmitStatement(ast.body, emit, alloc, true);
    if (topContinueTargetLabelId) {
        emit("::" + topContinueTargetLabelId + "::\r\n");
        topContinueTargetLabelId = null;
    }
    emit(" end ");
}
function EmitIf(ast, emit, alloc) {
    emit("if __ToBoolean(");
    EmitExpression(ast.test, emit, alloc, 0);
    emit(") then\r\n");
    EmitStatement(ast.consequent, emit, alloc, false);
    if (ast.alternate) {
        emit(" else\r\n");
        EmitStatement(ast.alternate, emit, alloc, false);
    }
    emit(" end");
}
function EmitWith(ast, emit, alloc) {
    // todo lexical and object environments
    // ignoring ast.object
    EmitExpression(ast.body, emit, alloc, 0);
}
function EmitReturn(ast, emit, alloc) {
    emit("return ");
    EmitExpression(ast.argument, emit, alloc, 0);
}
function EmitThrow(ast, emit, alloc) {
    emit("error({[\"data\"]="); // TODO proper exceptions
    EmitExpression(ast.argument, emit, alloc, 0);
    emit("})");
}
function EmitBreak(ast, emit, alloc) {
    if (ast.label) {
        emit(" goto ");
        EmitExpression(ast.label, emit, alloc, 0, false, false);
        emit("__After");
    }
    else {
        emit("break ");
    }
}
var BinaryOpRemap = {
    '<<': 'bit32.lshift',
    '>>>': 'bit32.rshift',
    '>>': 'bit32.arshift',
    '===': 'rawequal',
    '!==': 'rawequal',
    '&': 'bit32.band',
    '^': 'bit32.bxor',
    '|': 'bit32.bor',
    '+': '__PlusOp',
    'in': '__ContainsKey',
    'instanceof': '__InstanceOf',
};
var BinaryOpRemapValues = [];
for (var x in BinaryOpRemap) {
    BinaryOpRemapValues.push(BinaryOpRemap[x]);
}
function EmitBinary(ast, emit, alloc, StatementContext) {
    var aop = ast.operator;
    if (aop in BinaryOpRemap) {
        if (aop == '!==') {
            emit("(not ");
        }
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': BinaryOpRemap[aop] },
            arguments: [ast.left, ast.right]
        }, emit, alloc, StatementContext);
        if (aop == '!==') {
            emit(")");
        }
    }
    else {
        if (aop == '!=') {
            aop = '~=';
        }
        emit("(");
        //if (ast.left.type == 'AssignmentExpression' || ast.left.type == 'UpdateExpression') {
        //    console.log("Inline Assignment Codegen not implemented");
        //    emit("--[[IAC]]")
        //}
        EmitExpression(ast.left, emit, alloc, 0);
        emit(aop);
        //if (ast.right.type == 'AssignmentExpression' || ast.right.type == 'UpdateExpression') {
        //    console.log("Inline Assignment Codegen not implemented");
        //    emit("--[[IAC]]")
        //}
        EmitExpression(ast.right, emit, alloc, 0);
        emit(")");
    }
}
function EmitLogical(ast, emit, alloc) {
    var aop = ast.operator;
    if (aop == '||') {
        aop = ' or ';
    }
    if (aop == '&&') {
        aop = ' and ';
    }
    emit("(");
    EmitExpression(ast.left, emit, alloc, 0);
    emit(aop);
    EmitExpression(ast.right, emit, alloc, 0);
    emit(")");
}
function EmitConditional(ast, emit, alloc) {
    emit("(((");
    EmitExpression(ast.test, emit, alloc, 0);
    emit(") and __TernarySave(");
    EmitExpression(ast.consequent, emit, alloc, 0);
    emit(") or __TernarySave(");
    EmitExpression(ast.alternate, emit, alloc, 0);
    emit(")) and __TernaryRestore())");
}
var reservedLuaKeys = {
    'true': true,
    'false': true,
    'null': true,
    'in': true,
    'try': true,
    'class': true,
    'break': true,
    'do': true,
    'while': true,
    'until': true,
    'for': true,
    'and': true,
    'else': true,
    'elseif': true,
    'end': true,
    'function': true,
    'if': true,
    'local': true,
    'nil': true,
    'not': true,
    'or': true,
    'repeat': true,
    'return': true,
    'then': true,
    'goto': true,
};
function EmitMember(ast, emit, alloc, isRvalue, StatementContext) {
    //if(ast.property.name=='Step') {
    //    console.log(util.inspect(ast, false, 999, true));
    //}
    var argIndexer = ast.object.type == 'Identifier' && ast.object.name == 'arguments';
    if (ast.property.name == 'length' && isRvalue) {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__Length' },
            arguments: [ast.object]
        }, emit, alloc, StatementContext);
    }
    else if (ast.property.type == 'Identifier' && !ast.computed) {
        var id = ast.property;
        var isReserved = !!reservedLuaKeys[id.name];
        if (ast.object.type == 'Literal') {
            emit("(");
        }
        EmitExpression(ast.object, emit, alloc, 0);
        if (ast.object.type == 'Literal') {
            emit(")");
        }
        emit(isReserved ? "[\"" : ".");
        emit(id.name); // cannot EmitIdentifier because of escaping
        emit(isReserved ? "\"]" : "");
    }
    else {
        if (ast.object.type == 'Literal') {
            emit("(");
        }
        EmitExpression(ast.object, emit, alloc, 0);
        if (ast.object.type == 'Literal') {
            emit(")");
        }
        emit("[");
        EmitExpression(ast.property, emit, alloc, 0);
        if (argIndexer) {
            emit("+1");
        }
        emit("]");
    }
}
function EmitCall(ast, emit, alloc, StatementContext) {
    if (ast.callee.type == 'MemberExpression') {
        var me = ast.callee;
        emit("__CallMember(");
        EmitExpression(me.object, emit, alloc, 0);
        emit(",");
        if (me.property.type == 'Identifier') {
            emit("\"");
        }
        EmitExpression(me.property, emit, alloc, 0, true, false);
        if (me.property.type == 'Identifier') {
            emit("\"");
        }
        emit(ast.arguments.length ? "," : "");
    }
    else if (ast.callee.type == 'Literal') {
        emit("__LiteralCallFail(");
    }
    else if (ast.callee.type == 'FunctionExpression') {
        emit(StatementContext ? ";(" : "(");
        EmitExpression(ast.callee, emit, alloc, 0);
        emit(")("); // avoid "ambiguous syntax" 
    }
    else {
        EmitExpression(ast.callee, emit, alloc, 0);
        emit("(");
    }
    for (var si = 0; si < ast.arguments.length; si++) {
        var arg = ast.arguments[si];
        //if (arg.type == 'AssignmentExpression' || arg.type == 'UpdateExpression') {
        //    console.log("Inline Assignment Codegen not implemented");
        //    emit("--[[IAC]]")
        //}
        EmitExpression(arg, emit, alloc, 0);
        if (si != ast.arguments.length - 1) {
            emit(", ");
        }
    }
    emit(")");
}
function EmitNew(ast, emit, alloc) {
    emit("__New(");
    EmitExpression(ast.callee, emit, alloc, 0);
    for (var si = 0; si < ast.arguments.length; si++) {
        emit(", ");
        var arg = ast.arguments[si];
        EmitExpression(arg, emit, alloc, 0);
    }
    emit(")");
}
function EmitLiteral(ex, emit, alloc) {
    //console.log(util.inspect(ex, false, 999, true));
    if (ex.value instanceof RegExp) {
        //console.log("R");
        emit("__New(RegExp,");
        emit(JSON.stringify(ex.raw)); // TODO https://github.com/o080o/reLua!
        emit(")");
    }
    else {
        //console.log(ex.raw);
        emit(JSON.stringify(ex.value)); // TODO
    }
}
function convertFile(source, fn, printCode) {
    var allocIndex = 0;
    var alloc = function () {
        allocIndex++;
        return allocIndex;
    };
    var ast = esprima.parse(source);
    var a2 = hoist(ast, true);
    //console.log(escodegen.generate(a2))
    if (printCode) {
        console.log(util.inspect(ast, false, 999, true));
    }
    var luasrc = "";
    var emit = function (code) {
        luasrc += code;
        //process.stdout.write(code);
    };
    EmitProgram(a2, emit, alloc);
    return luasrc;
}
exports.convertFile = convertFile;
//# sourceMappingURL=emitter.js.map