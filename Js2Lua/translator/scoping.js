// Lexical and Object environments for ES5
var ScopeStack = (function () {
    function ScopeStack() {
        this.scope = [];
    }
    ScopeStack.prototype.pushLexical = function (vars, funcs, args, hint) {
        this.scope.push({
            type: 'Lexical',
            vars: vars,
            args: args,
            funcs: funcs,
            hint: hint
        });
    };
    ScopeStack.prototype.pushObjectIdent = function (ident, hint) {
        this.scope.push({
            type: 'Object',
            vars: [],
            funcs: [],
            args: [],
            hint: hint,
            ident: ident
        });
    };
    ScopeStack.prototype.lookupReference = function (ident) {
        for (var i = this.scope.length - 1; i >= 0; i--) {
            var cs = this.scope[i];
            if (cs.type == 'Lexical') {
                if (cs.vars && (cs.vars.indexOf(ident) != -1)) {
                    return { type: 'Lexical' };
                }
                if (cs.args && (cs.args.indexOf(ident) != -1)) {
                    return { type: 'Lexical' };
                }
                if (cs.funcs && (cs.funcs.indexOf(ident) != -1)) {
                    return { type: 'Lexical' };
                }
            }
            else {
                return { type: 'Object', ident: cs.ident };
            }
        }
        throw new Error("should not get here");
    };
    ScopeStack.prototype.currentScope = function () {
        return this.scope[this.scope.length - 1];
    };
    ScopeStack.prototype.popScope = function () {
        this.scope.pop();
    };
    return ScopeStack;
})();
exports.ScopeStack = ScopeStack;
exports = ScopeStack;
//# sourceMappingURL=scoping.js.map