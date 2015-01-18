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
local bit32 = require("bit")

local __Singletons = {}
local __JsGlobalObjects = {}
local __Helpers = {}

local function __id() end

local function __Typeof(value)
  if type(value) == 'boolean' or type(value) == 'number' or type(value) == 'string' then
    return type(value)
  end
  if type(value) == 'function' then
    return 'function' -- maybe better to wrap?
  end
  if type(value) == 'table' and value.__Prototype then return 'object' end
  if type(value) == 'table' and value.__TypeofValue then return value.__TypeofValue end
  if value == nil then return 'undefined' end

  print("__Typeof: unsupported! got " .. type(value) ..'='.. to_string(value))
  return '_unknown';
end

local function __ToString(value)
  if value == nil then return 'undefined' end
  if value == __JsGlobalObjects.null then return 'null' end
  if type(value) == 'string' then return value end
  if type(value) == 'table' then
    if value.__Prototype then return __Helpers.__CallMember(value, 'toString') end
    return '[native '..to_string(value)..']'
  end
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

local function __ToObject(val)
  -- print("ToObject"..tostring(val))
  if type(val) == 'function' then return __Helpers.__DefineFunction(val) end -- todo cache this?
  if type(val) == 'string' then return __Helpers.__New(__JsGlobalObjects.String, val) end
  if type(val) == 'boolean' then return __Helpers.__New(__JsGlobalObjects.Boolean, val) end
  if type(val) == 'number' then return __Helpers.__New(__JsGlobalObjects.Number, val) end
  local jsType = __Typeof(val)
  error("__ToObject not implemented for " .. jsType .. "/" .. type(val) .. "/" .. tostring(val))
end
__Helpers.__ToObject = __ToObject

local function __ToNumber(val)
  if val == nil or val == false or val == __JsGlobalObjects.null then return 0 end
  if val == true then return 1 end
  if type(val) == 'number' then return val end
  if type(val) == 'function' then error("TypeError: valueof function") end
  if type(val) == 'string' then return tonumber(val) end
  if type(val) == 'table' and val.__Value then return val.__Value end
  if type(val) == 'table' and val.__Prototype then return __CallMember(val, 'valueOf') end
  local jsType = __Typeof(val)
  return 0/0
  -- error("__ToNumber not implemented for " .. jsType .. "/" .. type(val) .. "/" .. tostring(val))
end
__Helpers.__ToObject = __ToObject

local function __PlusOp(left, right)
  if type(left) == 'string' or type(right) == 'string' then
    return __ToString(left) .. __ToString(right)
  else
    return __ToNumber(left) + __ToNumber(right)
  end
end

local function __Get(table, key)
  if type(table) ~= 'table' then
    error("Tried to access member " .. __ToString(key) .. " of non-table: " .. to_string(table))
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
  if type(table) ~= 'table' then
    table = __ToObject(table)
  end
  local iter = table
  repeat
    local result = rawget(iter, 'constructor')
    if result == ctor then return true end
    iter = rawget(iter, "__Prototype")
  until nil == iter
  return false
end

local function __CallMember(table, key, ...)
  -- print("calling " .. __ToString(key))
  if table == nil then
    error("Tried to call member " .. __ToString(key) .. " of undefined")
  end
  if type(table) ~= 'table' then
    table = __ToObject(table)
  end
  local unboundMethod = rawget(table, key)
  if unboundMethod ~= nil then return unboundMethod(...) end
  if table.__Prototype then
    local boundMethod = __Get(table.__Prototype, key)
    -- print('got boundmethod '..tostring(table)..'.'..tostring(key)..'='..tostring(boundMethod)..'='..tostring(boundMethod ~= nil))
    if boundMethod ~= nil then
      if type(boundMethod) ~= 'function' and boundMethod.__CallImpl then
        return boundMethod.__CallImpl(table, ...) -- wrapped
      else 
        return boundMethod(table, ...) -- builtin
      end
    end
  end
  error("Tried to call method " .. __ToString(key) .. " of " .. __ToString(table) .. " which is missing")
end
__Helpers.__CallMember = __CallMember

local function __Call(table, ...)
  local ci = table.__CallImpl
  if not ci then error("TypeError: Tried to call "..__ToString(table).." which is not callable") end
  return ci(_G, ...) -- CurrentThis
end

local function __Put(table, k, v)
  rawset(table, k, v)
  if type(k)=='number' then
    rawset(table, tostring(k), v)
  end
  rawset(table, '__propEnumerable_'..k, true)
end

local function __ArrayPut(table, k, v)
    local oi = bit32.tobit(tonumber(k) or 1/0)
    local bs = rawget(table, '__BackingStore')
    if k=='length' then
        -- print('SetLen')
        local ol = bit32.tobit(tonumber(bs.length))
        local nl = bit32.tobit(tonumber(v))
        if nl < ol then
            for i=nl,ol do bs[i]=nil end
        end
        bs.length = nl
    elseif oi~=nil then
        local ol = bit32.tobit(tonumber(bs.length))
        bs[oi]=v
        if oi>=ol then
            bs.length = oi+1
        end
    else -- non-numeric property
        rawset(table, k, v)
    end
end

local function __ArrayGet(table, k)
    local oi = bit32.tobit(tonumber(k) or 1/0)
    local bs = rawget(table, '__BackingStore')
    if k=='length' then
        local ol = bit32.tobit(tonumber(bs.length))
        return bs.length
    elseif oi~=nil then
        local ol = bit32.tobit(tonumber(bs.length))
        return bs[oi]
    else -- non-numeric property
        return rawget(table, k)
    end
end

local __ObjectMetatable = {
  __index = __Get,
  __call = __Call,
  __newindex = __Put,
}

local __ArrayMetatable = {
  __index = __ArrayGet,
  __call = __Call,
  __newindex = __ArrayPut,
}

-- wrap Lua function as js function
local function __DefineFunction(definition)
  local obj = {}
  -- TODO function proto
  setmetatable(obj, __ObjectMetatable)
  obj.__CallImpl = definition
  obj.__TypeofValue = "function"
  obj.prototype = __Helpers.__New(__JsGlobalObjects.Object)
  obj.__Prototype = __JsGlobalObjects.Function.prototype
  obj.constructor = __JsGlobalObjects.Function
  return obj
end
__Helpers.__DefineFunction = __DefineFunction

local function __RefCheck(val)
  -- if nil == val then error("ReferenceError") end
  -- this is incorrect
  return val
end

local function __New(ctor, ...)
  local obj = {}
  setmetatable(obj, __ObjectMetatable)
  obj.__Prototype = ctor.prototype
  __JsGlobalObjects.Object.defineProperty(obj,'constructor',{["value"]=ctor,["writable"]=true,["configurable"]=true})
  obj.__TypeofValue = "object"
  -- print('new:[' .. to_string{...} .. ']')
  local rv2 = ctor.__CallImpl(obj, ...)
  if rv2 then return rv2 else return obj end
end
__Helpers.__New = __New

local function __Iterate(obj)
  local results = {}
  for k, v in pairs(obj) do        
    if type(k)=='string' and string.sub(k,1,2)~='__' then
      if obj['__propEnumerable_'..k] then
        results[k]=v
      end
    end
  end
  return pairs(results)
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


-- Math
local __MathProto = {}
__MathProto.PI = 3.141592653589793
__MathProto.E = 2.718281828459045
__MathProto.LN10 = 2.302585092994046
__MathProto.LN2 = 0.6931471805599453
__MathProto.LOG10E = 0.4342944819032518
__MathProto.LOG2E = 1.4426950408889634
__MathProto.SQRT1_2 = 0.7071067811865476
__MathProto.SQRT2 = 1.4142135623730951
__MathProto.abs  = math.abs
__MathProto.acos  = math.acos
__MathProto.asin  = math.asin
__MathProto.atan  = math.atan
__MathProto.atan2  = math.atan2
__MathProto.ceil  = math.ceil
__MathProto.cos  = math.cos
__MathProto.cosh  = math.cosh
__MathProto.exp  = math.exp
__MathProto.floor  = math.floor
__MathProto.log  = math.log
__MathProto.max  = math.max
__MathProto.min  = math.min
__MathProto.pow  = math.pow
__MathProto.random  = math.random
__MathProto.round = function(num) return math.floor(num+0.5) end -- hack
__MathProto.sin  = math.sin
__MathProto.sqrt  = math.sqrt
__JsGlobalObjects.Math = __MathProto
local Math = __MathProto

-- Object
local Object = { ["prototype"] = {} }
Object.getOwnPropertyDescriptor = function(object, key)
  -- print(tostring(self).."/"..tostring(object).."/"..tostring(key))
  local length_hack = (key ~= "length")
  local val = 0
  if not length_hack then val = __Get(object, key) end
  return {
    ["value"] = val,
    ["writable"] = length_hack,
    ["enumerable"] = length_hack,
    ["configurable"] = length_hack
  }
end
Object.getPrototypeOf = function(obj) return obj.__Prototype end
Object.isExtensible = function(obj) return true end
Object.getOwnPropertyNames = function(obj)
  return pairs(obj)
end
Object.prototype.hasOwnProperty = function(self, key)
  return nil ~= rawget(self, key)
end
Object.prototype.propertyIsEnumerable = function(self, key)
  return true == rawget(self, '__propEnumerable_'..key)
end
Object.prototype.toString = function(self)
  local t = __Typeof(self)
  return "[object " .. string.upper(string.sub(t, 1, 1)) .. string.sub(t, 2) .. "]"
  -- return __ToString(self)
end
Object.defineProperty = function(self, key, descriptor)
  if descriptor.get or descriptor.set then error("getters/setters NYI") end
  if not descriptor.writable or not descriptor.configurable then error("Error: readonly/unconf props NYI") end
  rawset(self, key, descriptor.value)
  if descriptor.enumerable then rawset(self, '__propEnumerable_'..key, value) end
end
Object.create = (function(proto, ...) 
    if __Typeof(proto) == 'function' then
      return __New(proto, ...)
    else
      return __New(Object)
    end
  end)
Object.__CallImpl = function(self) end -- function Empty() {}, aka Object.__Prototype
setmetatable(Object, __ObjectMetatable)
setmetatable(Object.prototype, __ObjectMetatable)
Object.__ToStringValue = 'function Object() { [builtin] }'
__JsGlobalObjects.Object = Object

-- Function
local Function = __New(Object)
Function.__TypeofValue = "function"
Function.__CallImpl = function(self, code) 
  -- print(to_string(self))
  self.prototype = __New(Object)
  self.length = 0
end
Function.prototype = __New(Object) -- obj and func are special
Function.prototype.toString = function(self)
  return "function() { [unknown code] }"
end
Function.prototype.call = function(self, ...)
  return self.__CallImpl(...)
end
Function.prototype.apply = function(self, self2, argArray)
  return self.__CallImpl(self, unpack(argArray))
end
Object.__Prototype = Function.prototype -- maybe wrong
Function.__Prototype = Function.prototype
__JsGlobalObjects.Function = Function

-- Number
local Infinity = 1/0
local NaN = 0/0
local Number = __New(Function)
Number.NaN = NaN
Number.POSITIVE_INFINITY = Infinity
Number.NEGATIVE_INFINITY = -Infinity
Number.MIN_VALUE = 5e-324
Number.MAX_VALUE = 1.79E+308
Number.__CallImpl = function(self, val)
  -- print('new number' .. val)
  self.__Value = val
end
Number.prototype.toString = __DefineFunction(function(self)
    -- print('returning '..tostring(self.__Value))
    return tostring(self.__Value)
  end)


local isNaN = function(v) return v ~= v end
__JsGlobalObjects.Number = Number
__JsGlobalObjects.isNaN = isNaN

-- Array
local Array = __New(Function)
__JsGlobalObjects.Array = Array
Array.__CallImpl = function(self, ...) -- number or varargs...
  self = self or __New(Array)
  self.__BackingStore = {["length"]=0}
  setmetatable(self, __ArrayMetatable)
  local orig = {...}
  -- print('array with ' .. #orig .. ' args')
  local idx = 0
  for k,v in ipairs(orig) do
    self[idx] = v
    idx = idx + 1
  end
  self.length = idx
  if self.length == 1 then
    self.length = self[0]
  end
  return self
end
Array.isArray = function(arr)
  return arr.__Prototype == Array.prototype
end
Array.prototype.forEach = function(self, cb, otherSelf)
  local sl = bit32.arshift(self.length,0)
  local os = otherSelf or self -- NOPE, should inherit this
  for i=0,sl-1 do
    cb(self[i], i)
  end
end
Array.prototype.indexOf = function(self, item, fromIndex)
  local sl = bit32.arshift(self.length,0)
  local fi = bit32.arshift(fromIndex or 0, 0)
  local os = otherSelf or self -- NOPE, should inherit this
  for i=fi,sl-1 do
    if(rawequal(self[i], item)) then return i end
  end
  return -1
end
Array.prototype.lastIndexOf = function(self, item, fromIndex)
  local sl = bit32.arshift(self.length,0)
  local os = otherSelf or self -- NOPE, should inherit this
  for i=fromIndex or (sl-1),0,-1 do
    if(rawequal(self[i], item)) then return i end
  end
  return -1
end
Array.prototype.push = function(self, element)
  if not self.length then error("Malformed array without length") end
  self[self.length] = element
  self.length = self.length + 1
end
Array.prototype.pop = function(self)
  if not self.length then error("Malformed array without length") end
  local rv = self[self.length - 1]
  self[self.length - 1] = nil
  self.length = self.length - 1
  return rv
end
Array.prototype.toString = __DefineFunction(function(self)
    -- print('atos')
    -- return 'Array['..self.length..']'
    if self.length == 0 then return '' end
    local str = (self[0]~=nil) and __ToString(self[0]) or ''
    local sl = bit32.arshift(self.length,0)
    for i=1,sl-1 do
      str = str .. ',' .. ((self[i]~=nil) and __ToString(self[i]) or '')
    end
    return str
  end)
local __MakeArray = function(rawArray)
    local front = {["__BackingStore"]=rawArray}
    front.__Prototype = Array.prototype
    Object.defineProperty(front, 'constructor',{["value"]=Array,["writable"]=true,["configurable"]=true})
    setmetatable(front, __ArrayMetatable)
    return front
end
local __MakeArguments = function(rawArray)
    local front = {["__BackingStore"]=rawArray}
    local len = 0
    for i=1,1000 do
        if rawArray[i]~=nil then
            len = i
            rawArray[i-1]=rawArray[i]
        else break end
    end
    rawArray.length = len
    front.__Prototype = Array.prototype
    Object.defineProperty(front, 'constructor',{["value"]=Array,["writable"]=true,["configurable"]=true})
    setmetatable(front, __ArrayMetatable)
    return front
end
local __MakeObject = function(raw)
  setmetatable(raw, __ObjectMetatable)
  raw.__Prototype = Object.prototype
  for k,v in pairs(raw) do
    rawset(raw, '__propEnumerable_'..k, true)
  end
  Object.defineProperty(raw, 'constructor',{["value"]=Object,["writable"]=true,["configurable"]=true})
  return raw
end
-- Boolean
local Boolean = __New(Function)
Boolean.__CallImpl = function(self, val) 
  -- print ('Boolean ctor: ' .. val)
  self.__Value = __ToBoolean(val)
  self.__Prototype = Boolean.prototype
end

Boolean.prototype.toString = __DefineFunction(function(self)
    return tostring(self.__Value)
  end)
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

local function __split(str, pat)
  local t = {}  -- NOTE: use {n = 0} in Lua-5.0
  local fpat = "(.-)" .. pat
  local last_end = 1
  local s, e, cap = str:find(fpat, 1)
  local idx = 0
  while s do
    if s ~= 1 or cap ~= "" then
      t[idx]=cap
      idx=idx+1
    end
    last_end = e+1
    s, e, cap = str:find(fpat, last_end)
    if s == last_end then
      s = s+1
      e = e+1
      cap = string.sub(str, s, e)
    end
  end
  if last_end <= #str then
    cap = str:sub(last_end)
    t[idx]=cap
    idx=idx+1
  end
  t.length = idx
  return t
end
String.__CallImpl = function(self, val) 
  -- print ('string ctor: ' .. val)
  ns = __New(Object)
  val = __ToString(val)
  local uni = Utf8to32(val)
  ns.__ToStringValue = val
  ns.__Unicode = uni
  ns.__Prototype = String.prototype
  ns.length = #uni
  return ns
end
String.prototype.charCodeAt = function(self, idx)
  return self.__Unicode[idx] -- TODO unicode!
end
String.prototype.toString = __DefineFunction(function(self)
    return self.__ToStringValue
  end)
String.prototype.valueOf = String.prototype.toString
String.prototype.split = __DefineFunction(function(self, pat)
    return __MakeArray(__split(self.__ToStringValue, pat))
  end)
String.prototype.constructor = String
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
Date.prototype.toLocaleTimeString = __DefineFunction(__id)
__JsGlobalObjects.Date = Date

-- JSON
local JSON = __New(Function)
__JsGlobalObjects.JSON = JSON

-- RegExp
local RegExp = __New(Function)
__JsGlobalObjects.RegExp = RegExp
RegExp.__CallImpl = function(self, val) 
  -- print ('RegExp ctor: ' .. val)
  self.__RegexValue = val
end
RegExp.prototype.exec = __DefineFunction(function(self)return null end)

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

--[[
JSON = assert(loadfile "JSON.lua")()
function JSON:onEncodeError(message, etc) return 'null' end

local __json = JSON -- global one
local JSON = __New(Object)
JSON.parse = __DefineFunction(function(self, str)
    return __json:decode(str)
end)
JSON.stringify = __DefineFunction(function(self, val)
    return __json:encode_pretty(val)
end)
--]]
-- LIBRARY END

local function _USD_ERROR(s)
  print("ERROR: ", s)
end

local function _USD_PRINT(s)
  print("INFO: ", s)
end
local testFailed = _USD_ERROR
local function _USD_FAIL(message)
  testFailed(message)
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
  --[[for (var i = 0; i < length({...}); i++) {
        if (typeof (arguments[i]) !== "function") return false;
    }]]
return true;
end
-- HARNESS END
-- TRANSLATED runtime.js begin
local testBuiltInObject;testBuiltInObject = __DefineFunction(function (self,obj,isFunction,isConstructor,properties,length)
    local objString = nil;
    local desc = nil;
    local exception = nil;
    local instance = nil;

    if __ToBoolean(rawequal(obj, undefined)) then
      _USD_ERROR("Object being tested is undefined.")
    end
    objString=__CallMember(Object.prototype["toString"],"call",obj)
    if __ToBoolean(isFunction) then
      if __ToBoolean((not rawequal(objString, "[object Function]"))) then
        _USD_ERROR(__PlusOp(__PlusOp("The [[Class]] internal property of a built-in function must be ", "\"Function\", but toString() returns "), objString))
      end
    else
      if __ToBoolean((not rawequal(objString, "[object Object]"))) then
        _USD_ERROR(__PlusOp(__PlusOp("The [[Class]] internal property of a built-in non-function object must be ", "\"Object\", but toString() returns "), objString))
      end
    end
    if __ToBoolean((not __ToBoolean(__CallMember(Object,"isExtensible",obj)))) then
      _USD_ERROR("Built-in objects must be extensible.")
    end
    if __ToBoolean((isFunction and (not rawequal(__CallMember(Object,"getPrototypeOf",obj), Function.prototype)))) then
      _USD_ERROR("Built-in functions must have Function.prototype as their prototype.")
    end
    if __ToBoolean((isConstructor and (not rawequal(__CallMember(Object,"getPrototypeOf",obj.prototype), Object.prototype)))) then
      _USD_ERROR("Built-in prototype objects must have Object.prototype as their prototype.")
    end
    if __ToBoolean(isFunction) then
      if __ToBoolean(((not rawequal(__Typeof(obj.length), "number")) or (not rawequal(obj.length, __CallMember(Math,"floor",obj.length))))) then
        _USD_ERROR("Built-in functions must have a length property with an integer value.")
      end
      if __ToBoolean((not rawequal(obj.length, length))) then
        _USD_ERROR(__PlusOp(__PlusOp(__PlusOp(__PlusOp("Function's length property doesn't have specified value; expected ", length), ", got "), obj.length), "."))
      end
      desc=__CallMember(Object,"getOwnPropertyDescriptor",obj, "length")
      if __ToBoolean(desc.writable) then
        _USD_ERROR("The length property of a built-in function must not be writable.")
      end
      if __ToBoolean(desc.enumerable) then
        _USD_ERROR("The length property of a built-in function must not be enumerable.")
      end
      if __ToBoolean(desc.configurable) then
        _USD_ERROR("The length property of a built-in function must not be configurable.")
      end
    end
    __CallMember(properties,"forEach",__DefineFunction(function (self,prop)
          local desc =__CallMember(Object,"getOwnPropertyDescriptor",obj, prop)
          if __ToBoolean(rawequal(desc, undefined)) then
            _USD_ERROR(__PlusOp(__PlusOp("Missing property ", prop), "."))
          end
          if __ToBoolean((__CallMember(desc,"hasOwnProperty","writable") and (not __ToBoolean(desc.writable)))) then
            _USD_ERROR(__PlusOp(__PlusOp("The ", prop), " property of this built-in function must be writable."))
          end
          if __ToBoolean(desc.enumerable) then
            _USD_ERROR(__PlusOp(__PlusOp("The ", prop), " property of this built-in function must not be enumerable."))
          end
          if __ToBoolean((not __ToBoolean(desc.configurable))) then
            _USD_ERROR(__PlusOp(__PlusOp("The ", prop), " property of this built-in function must be configurable."))
          end
        end) --FunctionExpr
    )
    if __ToBoolean((isFunction and (not __ToBoolean(isConstructor)))) then
--TryBody
      local __TryStatus23,__TryReturnValue24 = pcall(function ()
          instance=__New(obj)
        end)
--Catch
      local __TryHandler27=(function(e) exception=e
        end)--EarlyReturn
      if __TryStatus23 and nil~=__TryReturnValue24 then  return __TryReturnValue24 end;
--CheckCatch
        if not __TryStatus23 then __CatchReturnValue25=__TryHandler27(__TryReturnValue24.data or __TryReturnValue24) end;
--CheckCatchValue
          if true or nil~=__CatchReturnValue25 then return __CatchReturnValue25 end;
            if __ToBoolean((rawequal(exception, undefined) or (not rawequal(exception.name, "TypeError")))) then
              _USD_ERROR(__PlusOp("Built-in functions that aren't constructors must throw TypeError when ", "used in a \"new\" statement."))
            end
          end
          if __ToBoolean(((isFunction and (not __ToBoolean(isConstructor))) and __CallMember(obj,"hasOwnProperty","prototype"))) then
            _USD_ERROR("Built-in functions that aren't constructors must not have a prototype property.")
          end
          return true end) --FunctionExpr testBuiltInObject
-- TRANSLATED runtime.js end