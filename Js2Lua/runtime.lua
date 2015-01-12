local __Singletons = {}
local function __Typeof(value)
    if type(value) == 'boolean' then
        return 'boolean'
    end
	if type(value) == 'table' and __Singletons[value] then
		return value.__TypeofValue
	end
    print("__Typeof: unsupported! got " .. type(value))
    return '_unknown';
end

local function _USD_ERROR(s)
    print("ERROR: ", s)
end

local function __Length(value)
	return #value
end

local function __PlusOp(left, right)
	if type(left) == 'string' or type(right) == 'string' then
		return left .. right
	else
		return left + right
	end
end

local null = {["__TypeofValue"] = "object", ["__ToStringValue"] = "null"} -- Singleton
__Singletons[null] = true
-- we use nil as undefined
-- LIBRARY END
