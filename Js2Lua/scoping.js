var ScopeStack = (function () {
    function ScopeStack() {
        this.scope = [];
    }
    ScopeStack.prototype.pushLexical = function (vars, funcs, hint) {
        this.scope.push({
            type: 'Lexical',
            vars: vars,
            funcs: funcs,
            hint: hint
        });
    };
    ScopeStack.prototype.pushObjectIdent = function (ident, hint) {
        this.scope.push({
            type: 'Object',
            vars: [],
            funcs: [],
            hint: hint,
            ident: ident
        });
    };
    ScopeStack.prototype.lookupName = function (ident) {
        for (var i = this.scope.length - 1; i >= 0; i++) {
            var cs = this.scope[i];
            if (cs.type == 'Lexical') {
                if (cs.vars.indexOf(ident) != -1 || cs.funcs.indexOf(ident) != -1) {
                    return { type: 'Lexical' };
                }
            }
            else {
                return { type: 'Object', ident: cs.ident };
            }
        }
        throw new Error("should not get here");
    };
    ScopeStack.prototype.popScope = function () {
        this.scope.pop();
    };
    return ScopeStack;
})();
exports.ScopeStack = ScopeStack;
exports = ScopeStack;
//# sourceMappingURL=scoping.js.map