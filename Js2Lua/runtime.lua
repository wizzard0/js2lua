local function __Typeof(value)
    if type(value) == 'boolean' then
        return 'boolean'
    end
    print("__Typeof: unsupported!")
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