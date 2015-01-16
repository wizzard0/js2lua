'use strict';
import types = require("ast-types");

// fugly code style

function argfinder(node) {
    var ids = [];
    types.visit(node.body, {
        visitIdentifier: function (path) {
            ids.push(path.node.name);
            return false;
        },
        visitFunctionExpression: function (path) {
            //return path.node == node;
            return false;
        }
    });
    return ids;
}

export = argfinder;