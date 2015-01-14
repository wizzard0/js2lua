-- DEBUGGING
function table_print (tt, indent, done)
  done = done or {}
  indent = indent or 0
  if type(tt) == "table" then
    local sb = {}
    for key, value in pairs (tt) do
      table.insert(sb, string.rep (" ", indent)) -- indent it
      if type (value) == "table" and not done [value] then
        done [value] = true
        table.insert(sb, "{\n");
        table.insert(sb, table_print (value, indent + 2, done))
        table.insert(sb, string.rep (" ", indent)) -- indent it
        table.insert(sb, "}\n");
      elseif "number" == type(key) then
        table.insert(sb, string.format("\"%s\"\n", tostring(value)))
      else
        table.insert(sb, string.format(
            "%s = \"%s\"\n", tostring (key), tostring(value)))
       end
    end
    return table.concat(sb)
  else
    return tt .. "\n"
  end
end

function to_string( tbl )
    if  "nil"       == type( tbl ) then
        return tostring(nil)
    elseif  "table" == type( tbl ) then
        return table_print(tbl)
    elseif  "string" == type( tbl ) then
        return tbl
    else
        return tostring(tbl)
    end
end
-- JS RUNTIME

local __Singletons = {}
local __JsGlobalObjects = {}
local __Helpers = {}

local bit32 = require("bit")

local function __Typeof(value)
    if type(value) == 'boolean' or type(value) == 'number' or type(value) == 'string' then
        return type(value)
    end
    if type(value) == 'table' and value.__TypeofValue then
        return value.__TypeofValue
    end
    if value == nil then return 'undefined' end

    print("__Typeof: unsupported! got " .. type(value))
    return '_unknown';
end

local function __ToString(value)
    if type(value) == 'string' then return value end
    if type(value) == 'table' and value.__ToStringValue then
        return value.__ToStringValue
    end
    if value == nil then return 'undefined' end
    return tostring(value)
end
-- print("Tb")
local function __ToBoolean(value)
    -- print(value, type(value))
    if nil == value then return false end
    if type(value) == 'boolean' then return value end
    if type(value) == 'table' and __Singletons[value] then
        return value.__BooleanValue
    end
    if type(value) == 'number' then
        if ((value == 0) or (value ~= value)) then return false
        else return true
        end
    end
    if type(value) == 'string' then
        -- print("QQQ")
        -- print (value ~="")
        return value ~= ""
    end
    print("__ToBoolean: unsupported! got " .. __ToString(value))
    return value
end

local function __Delete(location, key)
    location[key] = nil
    return true
end

local function __Length(value)
    if type(value) ~= 'table' then
        value = __Helpers.__ToObject(value)
    end
    if nil ~= value.__Length then
        return value.__Length
    end
    return #value
end

local function __PlusOp(left, right)
    if type(left) == 'string' or type(right) == 'string' then
        return __ToString(left) .. __ToString(right)
    else
        return left + right
    end
end

local function __ToObject(val)
    local jsType = __Typeof(val)
    if jsType == 'string' then return __Helpers.__New(__JsGlobalObjects.String, val) end
    error("__ToObject not implemented for " .. jsType .. "/" .. type(val) .. "/" .. tostring(val))
end
__Helpers.__ToObject = __ToObject

local function __Get(table, key)
    if table == nil then
        error("Tried to access member " .. tostring(key) .. " of undefined")
    end
    local result
    local iter = table
    repeat
        result = rawget(iter, key)
        iter = rawget(iter, "__Prototype")
    until (result ~= nil) or (nil == iter)
    return result
end

local function __InstanceOf(table, ctor)
    if table == nil then return false end
    local iter = table
    repeat
        local result = rawget(iter, 'constructor')
        if result == ctor then return true end
        iter = rawget(iter, "__Prototype")
    until nil == iter
    return false
end

local function __CallMember(table, key, ...)
    if table == nil then
        error("Tried to call member " .. tostring(key) .. " of undefined")
    end
    if type(table) ~= 'table' then
        table = __ToObject(table)
    end
    local unboundMethod = __Get(table, key)
    if unboundMethod == nil then
        error("Tried to call member " .. tostring(key) .. " of " .. tostring(table) .. " which is missing")
    end
    return unboundMethod(table, ...)
end

local function __Call(table, ...)
    local ci = table.__CallImpl
    return ci(nil, ...)
end

local __ObjectMetatable = {
    __index = __Get,
    __call = __Call
}

-- wrap Lua function as js function
local function __DefineFunction(definition)
    local obj = {}
    -- TODO function proto
    setmetatable(obj, __ObjectMetatable)
    obj.__CallImpl = definition
    obj.__TypeofValue = "function"
	obj.prototype = {}
    return obj
end

local function __RefCheck(val)
    if nil == val then error("ReferenceError") end
    return val
end

local function __New(ctor, ...)
    local obj = {}
    obj.__Prototype = ctor.prototype
    obj.constructor = ctor
    obj.__TypeofValue = "object"
    setmetatable(obj, __ObjectMetatable)
	-- print('new:[' .. to_string{...} .. ']')
    local rv2 = ctor.__CallImpl(obj, ...)
    if rv2 then return rv2 else return obj end
end
__Helpers.__New = __New

local function __Iterate(obj)
    return pairs(obj)
end

local function __ContainsKey(key, obj)
    if obj[key] ~= nil then return true end
    for k,v in pairs(obj) do -- TODO PERF need some optimization here
        if k == key then return true end
    end
    return false
end

local function __Sink()
end

-- Ternary via stack!
local __TernarySave, __TernaryRestore do
  local o_saved
  __TernarySave = function(o) o_saved = o; return true end
  __TernaryRestore = function() return o_saved end
end

-- Null
local null = {["__TypeofValue"] = "object", ["__ToStringValue"] = "null"} -- Singleton
__Singletons[null] = true
-- we use nil as undefined
__JsGlobalObjects.null = null

-- Number
local Infinity = 1/0
local NaN = 0/0
local Number = {
    ["NaN"] = NaN, 
    ["POSITIVE_INFINITY"] = Infinity, 
    ["NEGATIVE_INFINITY"] = -Infinity
}
__JsGlobalObjects.Number = Number

-- Math
local Math = {
    ["pow"] = math.pow
}
__JsGlobalObjects.Math = Math

-- Object
local Object = { ["prototype"] = {} }
Object.getOwnPropertyDescriptor = function(self, object, key)
    -- print(tostring(self).."/"..tostring(object).."/"..tostring(key))
    return {
        ["value"] = __Get(object, key),
        ["writable"] = true,
        ["enumerable"] = true,
        ["configurable"] = true
    }
end
Object.getOwnPropertyNames = function(obj)
    return pairs(obj)
end
Object.prototype.hasOwnProperty = function(self, key)
    return nil ~= rawget(self, key)
end
Object.__CallImpl = function(self) end
setmetatable(Object, __ObjectMetatable)
setmetatable(Object.prototype, __ObjectMetatable)
__JsGlobalObjects.Object = Object

-- Function
local Function = __New(Object)
Function.__TypeofValue = "function"
Function.__CallImpl = function(self, code) 
    -- print(to_string(self))
    self.prototype = {}
end
__JsGlobalObjects.Function = Function

-- Array
local Array = __New(Function)
__JsGlobalObjects.Array = Array
Array.__CallImpl = function(self, ...) -- number or varargs...
	self = self or __New(Array)
    local orig = {...}
	-- print('array with ' .. #orig .. ' args')
	local idx = 0
	for k,v in ipairs(orig) do
		self[idx] = v
		idx = idx + 1
	end
	return self
end
Array.prototype.forEach = function(self, cb, otherSelf)
	local os = otherSelf or self -- NOPE, should inherit this
	for k, v in ipairs(self) do
		cb(os, v, k)
	end
end
-- Boolean
local Boolean = __New(Function)
Boolean.__CallImpl = function(self, val) 
    -- print ('Boolean ctor: ' .. val)
    self.__Value = __ToBoolean(val)
end
__JsGlobalObjects.Boolean = Boolean


-- String
local String = __New(Function)
local function Utf8to32(utf8str) -- utterly useless, need to utf16
    assert(type(utf8str) == "string")
    local res, seq, val = {}, 0, nil
    for i = 1, #utf8str do
        local c = string.byte(utf8str, i)
        if seq == 0 then			
            table.insert(res, val)
            seq = c < 0x80 and 1 or c < 0xE0 and 2 or c < 0xF0 and 3 or
                  c < 0xF8 and 4 or --c < 0xFC and 5 or c < 0xFE and 6 or
                  error("invalid UTF-8 character sequence")
            val = bit32.band(c, 2^(8-seq) - 1)
        else
            val = bit32.bor(bit32.lshift(val, 6), bit32.band(c, 0x3F))
        end
        seq = seq - 1
    end
    table.insert(res, val)
    -- table.insert(res, 0)
    return res
end
String.__CallImpl = function(self, val) 
    -- print ('string ctor: ' .. val)
    local uni = Utf8to32(val)
    self.__ToStringValue = val
    self.__Unicode = uni
    self.__Length = #uni
end
String.prototype.charCodeAt = function(self, idx)
    return self.__Unicode[idx] -- TODO unicode!
end
__JsGlobalObjects.String = String

-- Date
local Date = __New(Function)
Date.__CallImpl = function(self, val) 
    -- print ('date ctor: ' .. val)
    -- self.__Value = val or (os.time() * 1000)
    self.__Value = val or (os.clock() * 1000) -- prefer benchmark version
end
Date.prototype.getTime = function(self)
    return self.__Value
end
__JsGlobalObjects.Date = Date

-- JSON
local JSON = __New(Function)
__JsGlobalObjects.JSON = JSON

-- RegExp
local RegExp = __New(Function)
__JsGlobalObjects.RegExp = RegExp
RegExp.__CallImpl = function(self, val) 
    -- print ('RegExp ctor: ' .. val)
    self.__Value = val
end

-- Error
local Error = __New(Function)
Error.__CallImpl = function(self, ...) 
    -- print ('Error ctor: ')
    self.__Args = {...}
end
__JsGlobalObjects.Error = Error
local EvalError = __New(Function)
local RangeError = __New(Function)
local ReferenceError = __New(Function)
local SyntaxError = __New(Function)
local TypeError = __New(Function)
local URIError = __New(Function)

-- Global functions
local escape = __DefineFunction(function(self, str) return str end) -- TODO actually escape :)
__JsGlobalObjects.escape = escape
local unescape = __DefineFunction(function(self, str) return str end) -- TODO actually escape :)
__JsGlobalObjects.unescape = unescape
local parseInt = __DefineFunction(function(self, str) return tonumber(str) end) -- TODO int
__JsGlobalObjects.parseInt = parseInt
local parseFloat = __DefineFunction(function(self, str) return tonumber(str) end) -- TODO int
__JsGlobalObjects.parseFloat = parseFloat

local console = {
    ["log"] = function(self, ...) print(...) end
}
__JsGlobalObjects.console = console
-- LIBRARY END

local function _USD_ERROR(s)
    print("ERROR: ", s)
end

local function _USD_PRINT(s)
    print("INFO: ", s)
end

local function _USD_INCLUDE() end

local function runTestCase(testcase)
    if (testcase() ~= true) then
        _USD_ERROR("Test case returned non-true value!")
    end
end

local self = __JsGlobalObjects

local function fnGlobalObject()
     return __JsGlobalObjects
end

local function fnExists(...)
    error("not implemented")
    -- TODO
    --[[for (var i = 0; i < __Length({...}); i++) {
        if (typeof (arguments[i]) !== "function") return false;
    }]]
    return true;
end
-- HARNESS END