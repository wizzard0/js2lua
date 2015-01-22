declare module 'ast-types' {
    function visit(node: any, visitor: any): any;
}

declare module 'esmap' {
    function map(node: any, collect: any): any;
    export = map;
}

declare module 'esutils' {
    var ast: any;
}

declare module 'escodegen' {
}

declare module 'execsync-ng' {
    function exec(path: any): any;
}

declare module 'glob' {
    function sync(pattern: string): string[];
}