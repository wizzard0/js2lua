local __Singletons = {}
local __JsGlobalObjects = {}

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
	if type(value) == 'boolean' then return value end
	if type(value) == 'table' and __Singletons[value] then
		return value.__BooleanValue
	end
	if type(value) == 'number' and value ~= value then return false end
	if type(value) == 'number' then return value ~= 0 end
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
		result = iter[key]
		iter = rawget(table, "__Prototype")
	until result or not iter
	return result
end

local function __CallMember(table, key, ...)
	if table == nil then
		error("Tried to call member " .. tostring(key) .. " of undefined")
	end
	local unboundMethod = __Get(table, key)
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

local function __DefineFunction(definition)
	local obj = {}
	-- TODO function proto
	setmetatable(obj, __ObjectMetatable)
	obj.__CallImpl = definition
	obj.__TypeofValue = "function"
	return obj
end

local function __New(ctor, ...)
	local obj = {}
	obj.__Prototype = ctor.prototype
	obj.__TypeofValue = "object"
	setmetatable(obj, __ObjectMetatable)
	local rv2 = ctor.__CallImpl(obj, arg)
	if rv2 then return rv2 else return obj end
end

local function __Iterate(obj)
	return ipairs(obj)
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
local Object = {}
Object.getOwnPropertyDescriptor = function(self, object, key)
	-- print(tostring(self).."/"..tostring(object).."/"..tostring(key))
	return {
		["value"] = __Get(object, key),
		["writable"] = true,
		["enumerable"] = true,
		["configurable"] = true
	}
end
__JsGlobalObjects.Object = Object

-- Array
local Array = {}
__JsGlobalObjects.Array = Array

-- Boolean
local Boolean = {}
__JsGlobalObjects.Boolean = Boolean

-- Function
local Function = {}
__JsGlobalObjects.Function = Function

-- String
local String = {}
__JsGlobalObjects.String = String

-- Date
local Date = {}
__JsGlobalObjects.Date = Date

-- JSON
local JSON = {}
__JsGlobalObjects.JSON = JSON

-- RegExp
local RegExp = {}
__JsGlobalObjects.RegExp = RegExp

-- Error
local Error = {}
__JsGlobalObjects.Error = Error
local EvalError = {}
local RangeError = {}
local ReferenceError = {}
local SyntaxError = {}
local TypeError = {}
local URIError = {}

-- Global functions
local escape = __DefineFunction(function(self, str) return str end) -- TODO actually escape :)
__JsGlobalObjects.escape = escape

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

-- print(to_string(self))
-- HARNESS END