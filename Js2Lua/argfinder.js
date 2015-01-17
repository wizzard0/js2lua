'use strict';
var types = require("ast-types");
function analyze(node) {
    var sc = {
        funcs: [],
        refs: [],
        vars: []
    };
    types.visit(node.body, {
        visitFunctionDeclaration: function (path) {
            var fd = path.node;
            sc.funcs.push(fd.id.name);
            sc.refs.push(fd.id.name);
            return false;
        },
        visitVariableDeclarator: function (path) {
            var fd = path.node;
            sc.vars.push(fd.id.name);
            sc.refs.push(fd.id.name);
            this.traverse(path);
        },
        visitIdentifier: function (path) {
            sc.refs.push(path.node.name);
            return false;
        },
        visitFunctionExpression: function (path) {
            return false;
        }
    });
    return sc;
}
exports.analyze = analyze;
//# sourceMappingURL=argfinder.js.map