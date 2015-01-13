local __Singletons = {}
local self = _G
local function __Typeof(value)
    if type(value) == 'boolean' or type(value) == 'number' or type(value) == 'string' then
        return type(value)
    end
	if type(value) == 'table' and __Singletons[value] then
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

local function __New(ctor, ...)
	-- TODO
	return {}
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

-- Number
local Infinity = 1/0
local NaN = 0/0
local Number = {
	["NaN"] = NaN, 
	["POSITIVE_INFINITY"] = Infinity, 
	["NEGATIVE_INFINITY"] = -Infinity
}

-- Math
local Math = {
	["pow"] = math.pow
}

-- Object
local Object = {}

-- Array
local Array = {}

-- Boolean
local Boolean = {}

-- Function
local Function = {}

-- String
local String = {}

-- Date
local Date = {}

-- JSON
local JSON = {}

-- RegExp
local RegExp = {}

-- Error
local Error = {}
local EvalError = {}
local RangeError = {}
local ReferenceError = {}
local SyntaxError = {}
local TypeError = {}
local URIError = {}


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

local function fnGlobalObject()
     return _G
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