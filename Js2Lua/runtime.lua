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
    if type(value) == 'table' and __Singletons[value] then
		return value.__ToStringValue
	end
    if value == nil then return 'undefined' end
	return tostring(value)
end

local function __ToBoolean(value)
	if nil == value then return false end
	if type(value) == 'boolean' then return value end
	if type(value) == 'table' and __Singletons[value] then
		return value.__BooleanValue
	end
	if type(value) == 'number' and (value == 0) or (value ~= value) then return false
	else return true
	end
	if type(value) == 'string' then return value ~= "" end
	print("__ToBoolean: unsupported! got " .. __ToString(value))
	return value
end

local function __Delete(location, key)
	location[key] = nil
	return true
end

local function __Length(value)
	return #value
end

local function __PlusOp(left, right)
	if type(left) == 'string' or type(right) == 'string' then
		return __ToString(left) .. __ToString(right)
	else
		return left + right
	end
end

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
	local rv2 = ctor.__CallImpl(obj, ...)
	if rv2 then return rv2 else return obj end
end

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

-- Boolean
local Boolean = __New(Function)
__JsGlobalObjects.Boolean = Boolean


-- String
local String = __New(Function)
__JsGlobalObjects.String = String

-- Date
local Date = __New(Function)
__JsGlobalObjects.Date = Date

-- JSON
local JSON = __New(Function)
__JsGlobalObjects.JSON = JSON

-- RegExp
local RegExp = __New(Function)
__JsGlobalObjects.RegExp = RegExp

-- Error
local Error = __New(Function)
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
    --[[for (var i = 0; i < __Length(arg); i++) {
        if (typeof (arguments[i]) !== "function") return false;
    }]]
    return true;
end
-- HARNESS END