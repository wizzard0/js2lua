
export interface IScope {
    type: string;
    vars: string[];
    funcs: string[];
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

    pushLexical(vars: string[], funcs: string[], hint: string) {
        this.scope.push({
            type: 'Lexical',
            vars: vars,
            funcs: funcs,
            hint: hint
        });
    }

    pushObjectIdent(ident: string, hint: string) {
        this.scope.push({
            type: 'Object',
            vars: [],
            funcs: [],
            hint: hint,
            ident: ident
        });
    }

    lookupName(ident: string): ILexicalReference {
        for (var i = this.scope.length - 1; i >= 0; i++) {
            var cs = this.scope[i];
            if (cs.type == 'Lexical') {
                if (cs.vars.indexOf(ident) != -1 || cs.funcs.indexOf(ident) != -1) {
                    return { type: 'Lexical' };
                }
            } else {
                return { type: 'Object', ident: cs.ident };
            }
        }
        throw new Error("should not get here");
    }

    popScope() {
        this.scope.pop();
    }
}


exports = ScopeStack;