'use strict';
import types = require("ast-types");

// fugly code style

import scoping = require("./scoping");

export interface IBlockIdentifiers {
    funcs: string[];
    vars: string[];
    refs: string[];
}

function argfinder(node): IBlockIdentifiers {
    var sc: IBlockIdentifiers = {
        funcs: [], refs: [], vars: []
    };

    types.visit(node.body, {
        visitFunctionDeclaration: function (path) {
            var fd = <esprima.Syntax.FunctionDeclaration>path.node;
            sc.funcs.push(fd.id.name);
            sc.refs.push(fd.id.name);
            return false;
        },
        visitVariableDeclarator: function (path) {
            var fd = <esprima.Syntax.VariableDeclarator>path.node;
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