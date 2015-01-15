import esprima = require("esprima");
import util = require("util");
import esutils = require("esutils");
import hoist = require("./ast-hoist");
import argfinder = require("./argfinder");
import escodegen = require("escodegen"); // debug

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
    EmitExpression(vd.id, emit, alloc, false); // identifier
    emit(" = ");
    EmitExpression(vd.init, emit, alloc);
    emit(";\r\n");
}

function EmitExpression(ex: esprima.Syntax.Expression, emit: (s: string) => void, alloc: () => number, isRvalue: boolean = true, strictCheck: boolean = true) {
    if (!ex) {
        emit('nil');
        return;
    }
    //console.warn(ex.type);
    switch (ex.type) {
        case "CallExpression":
            EmitCall(<esprima.Syntax.CallExpression>ex, emit, alloc);
            break;
        case "SequenceExpression":
            EmitSequence(<esprima.Syntax.SequenceExpression>ex, emit, alloc);
            break;
        case "NewExpression":
            EmitNew(<esprima.Syntax.NewExpression>ex, emit, alloc);
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
        case "ConditionalExpression":
            EmitConditional(<esprima.Syntax.ConditionalExpression>ex, emit, alloc);
            break;
        case "UpdateExpression":
            EmitUpdate(<esprima.Syntax.UpdateExpression>ex, emit, alloc);
            break;
        case "ArrayExpression":
            EmitArray(<esprima.Syntax.ArrayExpression>ex, emit, alloc);
            break;
        case "ObjectExpression":
            EmitObject(<esprima.Syntax.ObjectExpression>ex, emit, alloc);
            break;
        case "MemberExpression":
            EmitMember(<esprima.Syntax.MemberExpression>ex, emit, alloc, isRvalue);
            break;
        case "UnaryExpression":
            EmitUnary(<esprima.Syntax.UnaryExpression>ex, emit, alloc);
            break;
        case "FunctionExpression":
            EmitFunctionExpr(<esprima.Syntax.FunctionExpression>ex, emit, alloc);
            break;
        case "Identifier":
            EmitIdentifier(<esprima.Syntax.Identifier>ex, emit, alloc, isRvalue, strictCheck);
            break;
        case "ThisExpression":
            emit("self");
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

function EmitTryStatement(ast: esprima.Syntax.TryStatement, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ast, false, 999, true));
    // TODO we're fucking optimistic
    var statusName = "__TryStatus" + alloc();
    var returnValue = "__TryReturnValue" + alloc();
    var catchReturnValue = "__CatchReturnValue" + alloc();
    var finalizer = "__TryFinalizer" + alloc();
    var handler = "__TryHandler" + alloc();
    emit("--TryBody\r\nlocal " + statusName + "," + returnValue + " = pcall(function ()\r\n");
    EmitStatement(ast.block, emit, alloc);
    emit(" end)\r\n");
    //emit("print( " + statusName + "," + returnValue + ")\r\n");
    if (ast.finalizer) {
        emit("--Finally\r\nlocal " + finalizer + "=(function() ");
        EmitStatement(ast.finalizer, emit, alloc);
        emit(" end)");
    }
    var ah = ast.handlers;
    if (ah.length == 0) {
    } else if (ah.length == 1) {
        var h = ah[0];
        var paramName = h.param.name;
        emit("--Catch\r\nlocal " + handler + "=(function(" + paramName + ") ");
        EmitStatement(h.body, emit, alloc);
        emit(" end)");
    } else {
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
        emit("--JustFinalizer\r\n;" + finalizer + "()");
    }
    // handlerS, not handler!
}

var NonSinkableExpressionTypes = ['VariableDeclaration', 'AssignmentExpression', 'CallExpression', 'UpdateExpression'];

function EmitForStatement(ast: esprima.Syntax.ForStatement, emit: (s: string) => void, alloc: () => number) {
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
        EmitExpression(ast.test, emit, alloc);
    } else {
        emit("true");
    }
    emit(") do\r\n");
    if (ast.body) {
        EmitStatement(ast.body, emit, alloc);
    }
    if (pendingContinue) {
        emit("::" + pendingContinue + "::\r\n"); pendingContinue = null;
    }
    emit("\r\n-- BODY END\r\n");
    if (ast.update) {
        var aut = ast.update.type;
        if (NonSinkableExpressionTypes.indexOf(aut) == -1) {
            emit("__Sink(");
        }
        EmitExpression(ast.update, emit, alloc);
        if (NonSinkableExpressionTypes.indexOf(aut) == -1) {
            emit(")");
        }
    }
    emit(" end --For\r\n"); // any breaks?
}

function EmitForInStatement(ast: esprima.Syntax.ForInStatement, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ast, false, 999, true));
    //console.log(escodegen.generate(ast));
    if (ast.left.type == 'VariableDeclaration') {
        EmitVariableDeclaration(<esprima.Syntax.VariableDeclaration><any>ast.left, emit, alloc);
    }
    emit("for ");
    if (ast.left.type == 'VariableDeclaration') {
        var vd = <esprima.Syntax.VariableDeclaration><any>ast.left;
        EmitExpression(vd.declarations[0].id, emit, alloc, false);
    } else {
        EmitExpression(ast.left, emit, alloc, false);
    }
    emit(",");
    EmitExpression({ type: 'Identifier', name: '_tmp' + alloc() }, emit, alloc, false);
    emit(" in ");
    EmitCall({
        type: 'CallExpression',
        callee: { 'type': 'Identifier', 'name': '__Iterate' },
        arguments: [ast.right]
    }, emit, alloc);
    emit(" do\r\n");
    EmitStatement(ast.body, emit, alloc);
    if (pendingContinue) {
        emit("::" + pendingContinue + "::\r\n"); pendingContinue = null;
    }
    emit(" end --ForIn\r\n"); // any breaks?
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

function EmitIdentifier(ast: esprima.Syntax.Identifier, emit: (s: string) => void, alloc: () => number, rvalue: boolean, strictCheck: boolean) {
    // DEBUG
    strictCheck = false;
    /// DEBUG
    var ein = (<esprima.Syntax.Identifier>ast).name;
    ein = ein.replace(/\$/g, "_USD_");
    if (ein == 'arguments') { // HACK
        ein = '{...}';
        strictCheck = false;
    }
    if (Object.prototype.hasOwnProperty.call(reservedLuaKeys, ein)) {
        ein = '_R_' + ein;
    }
    if (ein.substr(0, 2) == '__' || ein == 'undefined' || BinaryOpRemapValues.indexOf(ein) != -1) {
        strictCheck = false; // dont recheck builtins
    } // TODO pass locals here and check AOT
    if (strictCheck && rvalue) { emit("__RefCheck("); }
    emit(ein);
    if (strictCheck && rvalue) { emit(")"); }
}

function EmitFunctionExpr(ast: esprima.Syntax.FunctionExpression, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ast, false, 999, true));
    var identList = argfinder(ast.body);
    var hasArguments = identList.indexOf('arguments') != -1;
    emit("__DefineFunction(function (self");
    if (hasArguments) {
        emit(", ...)\r\n local __tmp");
    }
    for (var si = 0; si < ast.params.length; si++) {
        emit(",");
        var arg = ast.params[si];        
        EmitExpression(arg, emit, alloc, false, false);
    }
    if (hasArguments) {
        emit("=1,...\r\n");
    } else {
        emit(")\r\n"); // arglist close
    }
    EmitBlock(ast.body, emit, alloc);
    emit(" end) --FunctionExpr\r\n"); // any breaks?
}

function EmitArray(ast: esprima.Syntax.ArrayExpression, emit: (s: string) => void, alloc: () => number) {
    emit("__MakeArray({");
    for (var si = 0; si < ast.elements.length; si++) {
        emit("[" + si + "]=");
        var arg = ast.elements[si];
        EmitExpression(arg, emit, alloc);
        if (si != ast.elements.length - 1) {
            emit(", ");
        }
    }
    emit("})");
}

function EmitSequence(ast: esprima.Syntax.SequenceExpression, emit: (s: string) => void, alloc: () => number, fromSink: boolean) {
    emit("(function() ");
    var ae = ast.expressions;
    for (var si = 0; si < ae.length; si++) {
        var arg = ae[si];
        EmitExpression(arg, emit, alloc);
        if (si != ae.length - 1) {
            emit("; ");
        }
    }
    if (ae.length > 0 && ae[ae.length - 1].type == 'AssignmentExpression') {
        var aec = <esprima.Syntax.AssignmentExpression>ae[ae.length - 1];
        emit(" return ");
        EmitExpression(aec.left, emit, alloc);
    }
    emit(" end)()"); // TODO this is awful, optimize this
    //emit(ast.expressions.length.toString());
    //emit("]");
}

function EmitObject(ast: esprima.Syntax.ObjectExpression, emit: (s: string) => void, alloc: () => number) {
    emit("__MakeObject({");
    for (var si = 0; si < ast.properties.length; si++) {
        var arg = ast.properties[si];
        emit("[\"");
        // always coerced to string, as per js spec
        if (arg.key.type == 'Literal') {
            emit(arg.key.value);
        } else { // identifiers already ok
            EmitExpression(arg.key, emit, alloc, false);
        }
        emit("\"]=");
        EmitExpression(arg.value, emit, alloc);
        if (si != ast.properties.length - 1) {
            emit(", ");
        }
    }
    emit("})");
}

function EmitFunctionDeclaration(ast: esprima.Syntax.FunctionDeclaration, emit: (s: string) => void, alloc: () => number) {
    emit("local ");
    EmitExpression(ast.id, emit, alloc, false);
    emit(";");
    EmitExpression(ast.id, emit, alloc, false);
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
        if (arg.type == 'ReturnStatement') break; // in lua?...
        emit("\r\n");
    }
}

function EmitAssignment(ast: esprima.Syntax.AssignmentExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    //if (aop != '=' && aop.length != 2 && aop.length != 3) {
    //    emit("--[[4"); emit(ast.type); emit("]]");
    //    console.log(util.inspect(ast, false, 999, true));
    //    return;
    //}
    if (ast.left.type == 'AssignmentExpression' || ast.left.type == 'UpdateExpression') {
        console.log("Inline Assignment Codegen not implemented");
        emit("--[[IAC]]")
    }
    EmitExpression(ast.left, emit, alloc, false);
    if (aop == '=') {
        emit(aop);
        if (ast.right.type == 'AssignmentExpression' || ast.right.type == 'UpdateExpression') {
            console.log("Inline Assignment Codegen not implemented");
            emit("--[[IAC]]")
        }
        EmitExpression(ast.right, emit, alloc);
    } else {
        emit('=');
        EmitBinary({
            type: 'BinaryExpression',
            operator: aop.substr(0, aop.length - 1),
            left: ast.left,
            right: ast.right
        }, emit, alloc);
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
        EmitExpression(ast.argument, emit, alloc, true, false);
        emit(")");
    } else if (aop == '~') {
        emit("bit32.bnot");
        emit("(");
        EmitExpression(ast.argument, emit, alloc);
        emit(")");
    } else if (aop == 'delete') {
        EmitDelete(ast, emit, alloc);
    } else if (aop == 'void') {
        emit("nil");
    } else if (aop == '!') {
        emit("(not __ToBoolean(");
        EmitExpression(ast.argument, emit, alloc);
        emit("))");
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

function EmitDelete(ast: esprima.Syntax.UnaryExpression, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ast));
    if (ast.argument.type == 'MemberExpression') {
        var ma = <esprima.Syntax.MemberExpression>ast.argument;
        emit("__Delete"); // TODO emit callexpr
        emit("(");
        EmitExpression(ma.object, emit, alloc);
        emit(", \"");
        emit(ma.property.name);
        emit("\")");
    } else if (ast.argument.type == 'Identifier') {
        var mm = <esprima.Syntax.Identifier>ast.argument;
        emit("__Delete");
        emit("(");
        EmitExpression({ type: 'ThisExpression' }, emit, alloc);
        emit(", \"");
        emit(mm.name);
        emit("\")");
    }
}

function EmitStatement(stmt: esprima.Syntax.Statement, emit: (s: string) => void, alloc: () => number) {
    //console.warn(ex.type);
    switch (stmt.type) {
        case "ReturnStatement":
            EmitReturn(<esprima.Syntax.ReturnStatement>stmt, emit, alloc);
            break;
        case "AssignmentExpression":
            EmitAssignment(<esprima.Syntax.AssignmentExpression>stmt, emit, alloc);
            break;
        case "ThrowStatement":
            EmitThrow(<esprima.Syntax.ThrowStatement>stmt, emit, alloc);
            break;
        case "EmptyStatement":
            emit(";");
            break;
        case "BreakStatement":
            EmitBreak(<esprima.Syntax.BreakStatement>stmt, emit, alloc);
            break;
        case "IfStatement":
            EmitIf(<esprima.Syntax.IfStatement>stmt, emit, alloc);
            break;
        case "ForStatement":
            EmitForStatement(<esprima.Syntax.ForStatement>stmt, emit, alloc);
            break;
        case "TryStatement":
            EmitTryStatement(<esprima.Syntax.TryStatement>stmt, emit, alloc);
            break;
        case "ForInStatement":
            EmitForInStatement(<esprima.Syntax.ForInStatement>stmt, emit, alloc);
            break;
        case "DoWhileStatement":
            EmitDoWhileStatement(<esprima.Syntax.DoWhileStatement>stmt, emit, alloc);
            break;
        case "WhileStatement":
            EmitWhileStatement(<esprima.Syntax.WhileStatement>stmt, emit, alloc);
            break;
        case "BlockStatement":
            EmitBlock(<esprima.Syntax.BlockStatement>stmt, emit, alloc);
            break;
        case "LabeledStatement":
            EmitLabeled(<esprima.Syntax.LabeledStatement>stmt, emit, alloc);
            break;
        case "ContinueStatement":
            EmitContinue(<esprima.Syntax.ContinueStatement>stmt, emit, alloc);
            break;
        case "ExpressionStatement":
            var et = ((<esprima.Syntax.ExpressionStatement>stmt).expression).type;
            if (et != 'AssignmentExpression' && et != 'UpdateExpression' && et != 'CallExpression') { emit(" __Sink("); }
            EmitExpression((<esprima.Syntax.ExpressionStatement>stmt).expression, emit, alloc);
            if (et != 'AssignmentExpression' && et != 'UpdateExpression' && et != 'CallExpression') { emit(")"); }
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
    emit(";");
}
// HACK

var pendingContinue: string = null;

function EmitContinue(ast: esprima.Syntax.ContinueStatement, emit: (s: string) => void, alloc: () => number) {
    if (ast.label) {
        emit(" goto ");
        EmitExpression(ast.label, emit, alloc, false, false);
    } else {
        var pc = "__Continue" + alloc();
        pendingContinue = pc;
        emit(" goto " + pc); // TODO 2 nonlabeled continue in the same loop
    }
}

function EmitLabeled(ast: esprima.Syntax.LabeledStatement, emit: (s: string) => void, alloc: () => number) {
    emit("::");
    EmitExpression(ast.label, emit, alloc, false, false);
    emit(":: ");
    EmitStatement(ast.body, emit, alloc);
    emit("::");
    EmitExpression(ast.label, emit, alloc, false, false);
    emit("__After:: ");
}

function EmitDoWhileStatement(ast: esprima.Syntax.DoWhileStatement, emit: (s: string) => void, alloc: () => number) {
    emit("repeat ");
    EmitStatement(ast.body, emit, alloc);
    if (pendingContinue) {
        emit("::" + pendingContinue + "::\r\n"); pendingContinue = null;
    }
    emit(" until not __ToBoolean(");
    EmitExpression(ast.test, emit, alloc);
    emit(")");
}

function EmitWhileStatement(ast: esprima.Syntax.WhileStatement, emit: (s: string) => void, alloc: () => number) {
    emit("while __ToBoolean(");
    EmitExpression(ast.test, emit, alloc);
    emit(") do ");
    EmitStatement(ast.body, emit, alloc);
    if (pendingContinue) {
        emit("::" + pendingContinue + "::\r\n"); pendingContinue = null;
    }
    emit(" end ");
}

function EmitIf(ast: esprima.Syntax.IfStatement, emit: (s: string) => void, alloc: () => number) {
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

function EmitReturn(ast: esprima.Syntax.ReturnStatement, emit: (s: string) => void, alloc: () => number) {
    emit("return ");
    EmitExpression(ast.argument, emit, alloc);
}

function EmitThrow(ast: esprima.Syntax.ThrowStatement, emit: (s: string) => void, alloc: () => number) {
    emit("error({[\"data\"]="); // TODO proper exceptions
    EmitExpression(ast.argument, emit, alloc);
    emit("})");
}

function EmitBreak(ast: esprima.Syntax.BreakStatement, emit: (s: string) => void, alloc: () => number) {
    if (ast.label) {
        emit(" goto ");
        EmitExpression(ast.label, emit, alloc, false, false);
        emit("__After");
    } else {
        emit("break ");
    }
}
var BinaryOpRemap = {
    '<<': 'bit32.lshift',
    '>>>': 'bit32.rshift',
    '>>': 'bit32.arshift',
    '===': 'rawequal',
    '!==': 'rawequal', /* not added separately */
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

function EmitBinary(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;
    if (aop in BinaryOpRemap) {
        if (aop == '!==') {
            emit("(not ");
        }
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': BinaryOpRemap[aop] },
            arguments: [ast.left, ast.right]
        }, emit, alloc);
        if (aop == '!==') {
            emit(")");
        }
    } else {
        if (aop == '!=') {
            aop = '~=';
        }
        emit("(");
        if (ast.left.type == 'AssignmentExpression' || ast.left.type == 'UpdateExpression') {
            console.log("Inline Assignment Codegen not implemented");
            emit("--[[IAC]]")
        }
        EmitExpression(ast.left, emit, alloc);
        emit(aop);
        if (ast.right.type == 'AssignmentExpression' || ast.right.type == 'UpdateExpression') {
            console.log("Inline Assignment Codegen not implemented");
            emit("--[[IAC]]")
        }
        EmitExpression(ast.right, emit, alloc);
        emit(")");
    }
}

function EmitLogical(ast: esprima.Syntax.BinaryExpression, emit: (s: string) => void, alloc: () => number) {
    var aop = ast.operator;

    if (aop == '||') {
        aop = ' or ';
    }
    if (aop == '&&') {
        aop = ' and ';
    }
    emit("(");
    EmitExpression(ast.left, emit, alloc);
    emit(aop);
    EmitExpression(ast.right, emit, alloc);
    emit(")");
}

function EmitConditional(ast: esprima.Syntax.ConditionalExpression, emit: (s: string) => void, alloc: () => number) {
    emit("(((");
    EmitExpression(ast.test, emit, alloc);
    emit(") and __TernarySave(");
    EmitExpression(ast.consequent, emit, alloc);
    emit(") or __TernarySave(");
    EmitExpression(ast.alternate, emit, alloc);
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
}

function EmitMember(ast: esprima.Syntax.MemberExpression, emit: (s: string) => void, alloc: () => number, isRvalue) {
    //if(ast.property.name=='Step') {
    //    console.log(util.inspect(ast, false, 999, true));
    //}
    if (ast.property.name == 'length' && isRvalue) {
        EmitCall({
            type: 'CallExpression',
            callee: { 'type': 'Identifier', 'name': '__Length' },
            arguments: [ast.object]
        }, emit, alloc);
    } else if (ast.property.type == 'Identifier' && !ast.computed) {
        var id = <esprima.Syntax.Identifier>ast.property;
        if (ast.object.type == 'Literal') { emit("("); }
        EmitExpression(ast.object, emit, alloc);
        if (ast.object.type == 'Literal') { emit(")"); }
        emit(reservedLuaKeys[id.name] ? "[\"" : ".");
        emit(id.name); // cannot EmitIdentifier because of escaping
        emit(reservedLuaKeys[id.name] ? "\"]" : "");
    } else {
        if (ast.object.type == 'Literal') { emit("("); }
        EmitExpression(ast.object, emit, alloc);
        if (ast.object.type == 'Literal') { emit(")"); }
        emit("[");
        EmitExpression(ast.property, emit, alloc);
        emit("]");
    }
}

function EmitCall(ast: esprima.Syntax.CallExpression, emit: (s: string) => void, alloc: () => number) {
    if (ast.callee.type == 'MemberExpression') {
        var me = <esprima.Syntax.MemberExpression>ast.callee;
        emit("__CallMember(");
        EmitExpression(me.object, emit, alloc);
        emit(",");
        if (me.property.type == 'Identifier') { emit("\""); }
        EmitExpression(me.property, emit, alloc, true, false);
        if (me.property.type == 'Identifier') { emit("\""); }
        emit(ast.arguments.length ? "," : "");
    } else {
        EmitExpression(ast.callee, emit, alloc);
        emit("(");
    }
    for (var si = 0; si < ast.arguments.length; si++) {
        var arg = ast.arguments[si];
        if (arg.type == 'AssignmentExpression' || arg.type == 'UpdateExpression') {
            console.log("Inline Assignment Codegen not implemented");
            emit("--[[IAC]]")
        }
        EmitExpression(arg, emit, alloc);
        if (si != ast.arguments.length - 1) {
            emit(", ");
        }
    }
    emit(")");
}

function EmitNew(ast: esprima.Syntax.CallExpression, emit: (s: string) => void, alloc: () => number) {
    emit("__New(");
    EmitExpression(ast.callee, emit, alloc);
    for (var si = 0; si < ast.arguments.length; si++) {
        emit(", ");
        var arg = ast.arguments[si];
        EmitExpression(arg, emit, alloc);
    }
    emit(")");
}

function EmitLiteral(ex: esprima.Syntax.Literal, emit: (s: string) => void, alloc: () => number) {
    //console.log(util.inspect(ex, false, 999, true));
    if (ex.value instanceof RegExp) {
        //console.log("R");
        emit("__New(RegExp,");
        emit(JSON.stringify((<any>ex).raw)); // TODO https://github.com/o080o/reLua!
        emit(")");
    } else {
        //console.log(ex.raw);
        emit(JSON.stringify(ex.value)); // TODO
    }
}

export function convertFile(source: string, fn: string): string {
    var allocIndex = 0;
    var alloc = function () {
        allocIndex++;
        return allocIndex;
    }

    var ast = esprima.parse(source);
    var a2 = hoist(ast, true);
    //console.log(escodegen.generate(a2))
    //console.log(util.inspect(a2,false,999,true))
    var luasrc = "";
    var emit = function (code) {
        luasrc += code;
        //process.stdout.write(code);
    }

    EmitProgram(a2, emit, alloc);
    return luasrc;
}