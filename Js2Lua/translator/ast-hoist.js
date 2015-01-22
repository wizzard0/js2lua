'use strict';
var map = require('esmap');
// todo switch to upstream again, my PR was accepted
function hoister(node, recurse) {
    if (node.type !== 'Program' && node.type !== 'FunctionDeclaration' && node.type !== 'FunctionExpression')
        return node;
    return hoist(node);
    function hoist(node) {
        var identifiers = [], declarations = [];
        node = map(node, collect);
        function collect(node, key, parent) {
            if (!node)
                return node;
            if (node.type === 'FunctionDeclaration') {
                declarations.push(recurse ? hoist(node) : node);
                return;
            }
            if (node.type === 'FunctionExpression')
                return recurse ? hoist(node) : node;
            if (node.type !== 'VariableDeclaration')
                return map(node, collect);
            identifiers.push.apply(identifiers, node.declarations.map(function (declaration) {
                return declaration.id;
            }));
            var expressions = node.declarations.filter(function (declarations) {
                return declarations.init !== null;
            }).map(function (declaration) {
                return ({ type: 'AssignmentExpression', operator: '=', left: declaration.id, right: declaration.init });
            }), expression = expressions.length === 1 ? expressions[0] : { type: 'SequenceExpression', expressions: expressions };
            if (parent.type == 'ForInStatement')
                return node.declarations[0].id;
            return key !== 'body' ? expression : { type: 'ExpressionStatement', expression: expression };
        }
        var body = node.body.type === 'BlockStatement' ? node.body.body : node.body;
        if (declarations.length)
            body.unshift.apply(body, declarations);
        if (identifiers.length)
            body.unshift({ type: 'VariableDeclaration', kind: 'var', declarations: identifiers.map(function (identifier) {
                return ({ type: 'VariableDeclarator', id: identifier, init: null });
            }) });
        return node;
    }
}
module.exports = hoister;
//# sourceMappingURL=ast-hoist.js.map