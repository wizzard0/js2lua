local function __Typeof(value)
	if type(value) == 'boolean' then
		return 'boolean'
	end
	print("__Typeof: unsupported!")
	return '_unknown';
end