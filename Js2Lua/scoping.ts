
export interface IScope {
    type: string;
    vars: string[];
    funcs: string[];
    args: string[];
    hint: string;
    ident?: string;
}

export interface ILexicalReference {
    type: string; // local or object
    ident?: string; // if object
}

export class ScopeStack {
    scope: IScope[];
    constructor() {
        this.scope = [];
    }

    pushLexical(vars: string[], funcs: string[], args: string[], hint: string) {
        this.scope.push({
            type: 'Lexical',
            vars: vars,
            args: args,
            funcs: funcs,
            hint: hint
        });
    }

    pushObjectIdent(ident: string, hint: string) {
        this.scope.push({
            type: 'Object',
            vars: [],
            funcs: [],
            args: [],
            hint: hint,
            ident: ident
        });
    }

    lookupReference(ident: string): ILexicalReference {
        // hackish for builtins
        if (ident.substr(0, 2) == '__') {
            return { type: 'Lexical' }; // may be alleviated by program-parser
        }
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
            } else {
                return { type: 'Object', ident: cs.ident };
            }
        }
        throw new Error("should not get here");
    }

    currentScope() {
        return this.scope[this.scope.length - 1];
    }

    popScope() {
        this.scope.pop();
    }
}


exports = ScopeStack;