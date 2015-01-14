// AST for Lua

module LuaSyntax {
    // Node
    interface Node {
        type: string;
    }

    // Comment
    interface Comment extends Node {
        value: string
    }

    // Program
    interface Program extends Node {
        body: Statement[]
comments?: Comment[]
    }

    // Function
    interface Function extends Node {
        id: Identifier // | null
params: Identifier[]
defaults: Expression[]
rest: Identifier // | null
body: BlockStatementOrExpression
generator: boolean
expression: boolean
    }
    interface BlockStatementOrExpression extends BlockStatement, Expression {
    }

    // Statement
    interface Statement extends Node {
    }
    interface EmptyStatement extends Statement {
    }
    interface BlockStatement extends Statement {
        body: Statement[]
    }
    interface ExpressionStatement extends Statement {
        expression: Expression
    }
    interface IfStatement extends Statement {
        test: Expression
consequent: Statement
alternate: Statement
    }
    interface LabeledStatement extends Statement {
        label: Identifier
body: Statement
    }
    interface BreakStatement extends Statement {
        label: Identifier // | null
    }
    interface ContinueStatement extends Statement {
        label: Identifier // | null
    }
    interface WithStatement extends Statement {
        object: Expression
body: Statement
    }
    interface SwitchStatement extends Statement {
        discriminant: Expression
cases: SwitchCase[]
lexical: boolean
    }
    interface ReturnStatement extends Statement {
        argument: Expression // | null
    }
    interface ThrowStatement extends Statement {
        argument: Expression
    }
    interface TryStatement extends Statement {
        block: BlockStatement
handlers: CatchClause[] // | null
guardedHandlers: CatchClause[]
finalizer: BlockStatement // | null
    }
    interface WhileStatement extends Statement {
        test: Expression
body: Statement
    }
    interface DoWhileStatement extends Statement {
        body: Statement
test: Expression
    }
    interface ForStatement extends Statement {
        init: VariableDeclaratorOrExpression // | null
test: Expression // | null
update: Expression // | null
body: Statement
    }
    interface ForInStatement extends Statement {
        left: VariableDeclaratorOrExpression
right: Expression
body: Statement
each: boolean
    }
    interface VariableDeclaratorOrExpression extends VariableDeclarator, Expression {
    }
    interface DebuggerStatement extends Statement {
    }
    interface StatementOrList extends Array<Statement>, Statement {
    }

    // Declaration
    interface Declaration extends Statement {
    }
    interface FunctionDeclaration extends Declaration {
        id: Identifier
params: Identifier[] // Pattern
defaults: Expression[]
rest: Identifier
body: BlockStatementOrExpression
generator: boolean
expression: boolean
    }
    interface VariableDeclaration extends Declaration {
        declarations: VariableDeclarator[]
kind: string // "var" | "let" | "const"
    }
    interface VariableDeclarator extends Node {
        id: Identifier // Pattern
init: Expression
    }

    // Expression
    interface Expression extends Node { // | Pattern
    }
    //interface Expression extends
    //    ThisExpression, ArrayExpression, ObjectExpression, FunctionExpression,
    //    ArrowFunctionExpression, SequenceExpression, UnaryExpression, BinaryExpression,
    //    AssignmentExpression, UpdateExpression, LogicalExpression, ConditionalExpression,
    //    NewExpression, CallExpression, MemberExpression {
    //}
    interface ThisExpression extends Expression {
    }
    interface ArrayExpression extends Expression {
        elements: Expression[] // [ Expression | null ]
    }
    interface ObjectExpression extends Expression {
        properties: Property[]
    }
    interface Property extends Node {
        key: LiteralOrIdentifier // Literal | Identifier
value: Expression
kind: string // "init" | "get" | "set"
    }
    interface LiteralOrIdentifier extends Literal, Identifier {
    }
    interface FunctionExpression extends Function, Expression {
    }
    interface ArrowFunctionExpression extends Function, Expression {
    }
    interface SequenceExpression extends Expression {
        expressions: Expression[]
    }
    interface UnaryExpression extends Expression {
        operator: string // UnaryOperator
prefix: boolean
argument: Expression
    }
    interface BinaryExpression extends Expression {
        operator: string // BinaryOperator
left: Expression
right: Expression
    }
    interface AssignmentExpression extends Expression {
        operator: string // AssignmentOperator
left: Expression
right: Expression
    }
    interface UpdateExpression extends Expression {
        operator: string // UpdateOperator
argument: Expression
prefix: boolean
    }
    interface LogicalExpression extends Expression {
        operator: string // LogicalOperator
left: Expression
right: Expression
    }
    interface ConditionalExpression extends Expression {
        test: Expression
alternate: Expression
consequent: Expression
    }
    interface NewExpression extends Expression {
        callee: Expression
arguments: Expression[]
    }
    interface CallExpression extends Expression {
        callee: Expression
arguments: Expression[]
    }
    interface MemberExpression extends Expression {
        object: Expression
property: IdentifierOrExpression // Identifier | Expression
computed: boolean
    }
    interface IdentifierOrExpression extends Identifier, Expression {
    }

    // Pattern
    // interface Pattern extends Node {
    // }

    // Clauses
    interface SwitchCase extends Node {
        test: Expression
consequent: Statement[]
    }
    interface CatchClause extends Node {
        param: Identifier // Pattern
guard: Expression
body: BlockStatement
    }

    // Misc
    interface Identifier extends Node, Expression { // | Pattern
        name: string
    }
    interface Literal extends Node, Expression {
        value: any // string | boolean | null | number | RegExp
    }
}

var LuaKeywords = {
    'and': true, 'break': true, 'do': true, 'else': true, 'elseif': true, 'end': true, 'false': true,
    'for': true, 'function': true, 'goto': true, 'if': true, 'in': true, 'local': true, 'nil': true,
    'not': true, 'or': true, 'repeat': true, 'return': true, 'then': true, 'true': true, 'until': true,
    'while': true
};

var LuaOtherTokens = {
    '+': true, '-': true, '*': true, '/': true, '%': true, '^': true, '#': true, '==': true, '~=': true,
    '<=': true, '>=': true, '<': true, '>': true, '=': true, '(': true, ')': true, '{': true, '}': true,
    '[': true, ']': true, '::': true, ';': true, ':': true, ',': true, '.': true, '..': true, '...': true,
    '[[': true, ']]': true
};

var LuaEscapes = "abfnrtv\\\"'z";

// VariableExpression: Name, prefixexp[exp], prefixexp.Name; globals = _ENV.x
// block: {stat} /*list of stat*/, 
// parentneses always bind, never semicolon-insert

// stat: ;, do block end, 
// chunk (program): block
// stat: varlist = explist /* functions unpacked, except when () */
// stat: while exp do block end, repeat block until exp, if exp then block {elseif exp then block} [else block] end
// until-condition can refer to inner scope
// stat: ::Name::, goto Name /* cannot enter scopes of local variables */
// stat: break /*goto next statement after the innermost enclosing loop*/
// stat: return explist; /*last statement in the block only*/
// stat: for Name = exp, exp [,exp] do block end /*var, limit, step, evaluated once and tonumbered*/
// stat: for namelist in explist do block end /* ends if var1=nil; explist=f,s,var */
// stat: functioncall
// stat: local namelist = explist /* varlists are cropped/nil-filled */

// exp ::= prefixexp
// exp ::= nil | false | true
// exp ::= Number
// exp ::= String
// exp ::= functiondef
// exp ::= tableconstructor
// exp ::= ‘...’ /*vararg*/
// exp ::= exp binop exp
// exp ::= unop exp
// prefixexp ::= var | functioncall | ‘(’ exp ‘)’
// () adjust valuelist to 1 item

// tableconstructor ::= ‘{’ [fieldlist] ‘}’
// fieldlist ::= field {fieldsep field } [fieldsep]
// field ::= ‘[’ exp ‘]’ ‘=’ exp | Name ‘=’ exp | exp
// fieldsep ::= ‘,’ | ‘;’
// last field - expanded vararg!

// functioncall ::= prefixexp args
// functioncall ::= prefixexp ‘:’ Name args /*v.name(v,args)*/
// args may omit braces if 1 tableconstructor or 1 string literal

// return functioncall - tail call (exact form only)

// functiondef ::= function funcbody
// funcbody ::= ‘(’ [parlist] ‘)’ block end

// stat ::= function funcname funcbody
// stat ::= local function Name funcbody /*local f; f=function ... */
// funcname ::= Name {‘.’ Name} [‘:’ Name] /* :name adds self */

// each block is a new, separate env, even on reenter
