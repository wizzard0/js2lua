
var json_parse2 = (function () {
    var at,        ch,          escapee = {
            '"': '"',
            '\\': '\\',
            '/': '/',
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t'
        },
        text,
        error = function (m) {
            $FAIL(m);
        },
        next = function (c) {
            if (c && c !== ch) {
                error("Expected '" + c + "' instead of '" + ch + "'");
            }
            ch = text.charAt(at);
            at += 1;
            return ch;
        },

        number = function () { return 0; },

        string = function () {
            var hex,
                i,
                string = '',
                uffff;
            
            // When parsing for string values, we must look for " and \ characters.
            
            if (ch === '"') {
                while (next()) {
                    if (ch === '"') {
                        next();
                        return string;
                    }                
                        string += ch;              
                }
            }
            error("Bad string");
        },

        white = function () {            
            while (ch && ch <= ' ') {
                next();
            }
        },

        word = function () {
            error("Unexpected '" + ch + "'");
        },

        value,  // Place holder for the value function.

        array = function () {            
            return []
        },

        object = function () {
            var key,
                object = {};
            
            if (ch === '{') {
                next('{');
                white();
                if (ch === '}') {
                    next('}');
                    return object;   // empty object
                }
                while (ch) {
                    key = string();
                    white();
                    next(':');
                    object[key] = value();
                    white();
                    if (ch === '}') {
                        next('}');
                        return object;
                    }
                    next(',');
                    white();
                }
            }
            error("Bad object");
        };
    
    value = function () {
        white();
        console.log(ch);
        switch (ch) {
            case '{':
                return object();
            case '[':
                return array();
            case '"':
                return string();
            case '-':
                return number();
            default:
                return ch >= '0' && ch <= '9' ? number() : word();
        }
    };
    
    return function (source, reviver) {
        var result;
        
        text = source;
        at = 0;
        ch = ' ';
        result = value();
        white();
        if (ch) {
            error("Syntax error");
        }
        
        return result;
    };
}());


var f=json_parse2('{"1":"2"}');
console.log(f);
