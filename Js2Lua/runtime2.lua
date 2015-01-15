
-- BEGIN
local _USD_ERROR = nil;
local _USD_PRINT = nil;
local __globalObject = nil;
local prec = nil;
local HoursPerDay = nil;
local MinutesPerHour = nil;
local SecondsPerMinute = nil;
local msPerDay = nil;
local msPerSecond = nil;
local msPerMinute = nil;
local msPerHour = nil;
local date_1899_end = nil;
local date_1900_start = nil;
local date_1969_end = nil;
local date_1970_start = nil;
local date_1999_end = nil;
local date_2000_start = nil;
local date_2099_end = nil;
local date_2100_start = nil;

local _USD_INCLUDE;_USD_INCLUDE = __DefineFunction(function (self,message)
 end) --FunctionExpr


local runTestCase;runTestCase = __DefineFunction(function (self,testcase)
if __ToBoolean((not rawequal(testcase(), true))) then
_USD_ERROR("Test case returned non-true value!")
 end
 end) --FunctionExpr


local fnGlobalObject;fnGlobalObject = __DefineFunction(function (self)
return __globalObject end) --FunctionExpr


local fnExists;fnExists = __DefineFunction(function (self)
local i = nil;

i=0
while __ToBoolean((i<__Length({...}))) do
if __ToBoolean((not rawequal(__Typeof({...}[i]), "function"))) then
return false end

-- BODY END
i=__PlusOp(i, 1) end --For

return true end) --FunctionExpr


local Test262Error;Test262Error = __DefineFunction(function (self,message)
if __ToBoolean(message) then
self.message=message end
 end) --FunctionExpr


local _USD_FAIL;_USD_FAIL = __DefineFunction(function (self,message)
testFailed(message)
 end) --FunctionExpr


local testFailed;testFailed = __DefineFunction(function (self,message)
error({["data"]=__New(Test262Error, message)})
 end) --FunctionExpr


local compareArray;compareArray = __DefineFunction(function (self,aExpected,aActual)
local s = nil;
local i = nil;

if __ToBoolean((__Length(aActual)~=__Length(aExpected))) then
return false end
__CallMember(aExpected,"sort")
__CallMember(aActual,"sort")
 __Sink(({})[0])
i=0
while __ToBoolean((i<__Length(aExpected))) do
if __ToBoolean((not rawequal(aActual[i], aExpected[i]))) then
return false end

-- BODY END
i=__PlusOp(i, 1) end --For

return true end) --FunctionExpr


local arrayContains;arrayContains = __DefineFunction(function (self,arr,expected)
local found = nil;
local i = nil;
local j = nil;

 __Sink(({})[0])
i=0
while __ToBoolean((i<__Length(expected))) do
found=false
j=0
while __ToBoolean((j<__Length(arr))) do
if __ToBoolean(rawequal(expected[i], arr[j])) then
found=true
break 
 end

-- BODY END
j=__PlusOp(j, 1) end --For

if __ToBoolean((not __ToBoolean(found))) then
return false end

-- BODY END
i=__PlusOp(i, 1) end --For

return true end) --FunctionExpr


local dataPropertyAttributesAreCorrect;dataPropertyAttributesAreCorrect = __DefineFunction(function (self,obj,name,value,writable,enumerable,configurable)
local attributesCorrect = nil;
local overwrited = nil;
local enumerated = nil;
local prop = nil;
local deleted = nil;

attributesCorrect=true
if __ToBoolean((not rawequal(obj[name], value))) then
if __ToBoolean((((rawequal(__Typeof(obj[name]), "number") and isNaN(obj[name])) and rawequal(__Typeof(value), "number")) and isNaN(value))) then
 else
attributesCorrect=false
 end
 end
--TryBody
local __TryStatus1,__TryReturnValue2 = pcall(function ()
if __ToBoolean(rawequal(obj[name], "oldValue")) then
obj[name]="newValue"
 else
obj[name]="OldValue"
 end
 end)
--Catch
local __TryHandler5=(function(we)  end)--EarlyReturn
 if __TryStatus1 and nil~=__TryReturnValue2 then  return __TryReturnValue2 end;
--CheckCatch
 if not __TryStatus1 then __CatchReturnValue3=__TryHandler5(__TryReturnValue2.data or __TryReturnValue2) end;
--CheckCatchValue
 if true or nil~=__CatchReturnValue3 then return __CatchReturnValue3 end;
overwrited=false
if __ToBoolean((not rawequal(obj[name], value))) then
if __ToBoolean((((rawequal(__Typeof(obj[name]), "number") and isNaN(obj[name])) and rawequal(__Typeof(value), "number")) and isNaN(value))) then
 else
overwrited=true
 end
 end
if __ToBoolean((not rawequal(overwrited, writable))) then
attributesCorrect=false
 end
enumerated=false
for prop,_tmp6 in __Iterate(obj) do
if __ToBoolean((__CallMember(obj,"hasOwnProperty",prop) and rawequal(prop, name))) then
enumerated=true
 end
 end --ForIn

if __ToBoolean((not rawequal(enumerated, enumerable))) then
attributesCorrect=false
 end
deleted=false
--TryBody
local __TryStatus7,__TryReturnValue8 = pcall(function ()
 __Sink(__Delete(obj, "name"))
 end)
--Catch
local __TryHandler11=(function(de)  end)--EarlyReturn
 if __TryStatus7 and nil~=__TryReturnValue8 then  return __TryReturnValue8 end;
--CheckCatch
 if not __TryStatus7 then __CatchReturnValue9=__TryHandler11(__TryReturnValue8.data or __TryReturnValue8) end;
--CheckCatchValue
 if true or nil~=__CatchReturnValue9 then return __CatchReturnValue9 end;
if __ToBoolean((not __ToBoolean(__CallMember(obj,"hasOwnProperty",name)))) then
deleted=true
 end
if __ToBoolean((not rawequal(deleted, configurable))) then
attributesCorrect=false
 end
return attributesCorrect end) --FunctionExpr


local accessorPropertyAttributesAreCorrect;accessorPropertyAttributesAreCorrect = __DefineFunction(function (self,obj,name,get,set,setVerifyHelpProp,enumerable,configurable)
local attributesCorrect = nil;
local desc = nil;
local enumerated = nil;
local prop = nil;
local deleted = nil;

attributesCorrect=true
if __ToBoolean((not rawequal(get, undefined))) then
if __ToBoolean((not rawequal(obj[name], get()))) then
if __ToBoolean((((rawequal(__Typeof(obj[name]), "number") and isNaN(obj[name])) and rawequal(__Typeof(get()), "number")) and isNaN(get()))) then
 else
attributesCorrect=false
 end
 end
 else
if __ToBoolean((not rawequal(obj[name], undefined))) then
attributesCorrect=false
 end
 end
--TryBody
local __TryStatus12,__TryReturnValue13 = pcall(function ()
desc=__CallMember(Object,"getOwnPropertyDescriptor",obj, name)
if __ToBoolean(rawequal(__Typeof(desc.set), "undefined")) then
if __ToBoolean((not rawequal(__Typeof(set), "undefined"))) then
attributesCorrect=false
 end
 else
obj[name]="toBeSetValue"
if __ToBoolean((not rawequal(obj[setVerifyHelpProp], "toBeSetValue"))) then
attributesCorrect=false
 end
 end
 end)
--Catch
local __TryHandler16=(function(se) error({["data"]=se})
 end)--EarlyReturn
 if __TryStatus12 and nil~=__TryReturnValue13 then  return __TryReturnValue13 end;
--CheckCatch
 if not __TryStatus12 then __CatchReturnValue14=__TryHandler16(__TryReturnValue13.data or __TryReturnValue13) end;
--CheckCatchValue
 if true or nil~=__CatchReturnValue14 then return __CatchReturnValue14 end;
enumerated=false
for prop,_tmp17 in __Iterate(obj) do
if __ToBoolean((__CallMember(obj,"hasOwnProperty",prop) and rawequal(prop, name))) then
enumerated=true
 end
 end --ForIn

if __ToBoolean((not rawequal(enumerated, enumerable))) then
attributesCorrect=false
 end
deleted=false
--TryBody
local __TryStatus18,__TryReturnValue19 = pcall(function ()
 __Sink(__Delete(obj, "name"))
 end)
--Catch
local __TryHandler22=(function(de) error({["data"]=de})
 end)--EarlyReturn
 if __TryStatus18 and nil~=__TryReturnValue19 then  return __TryReturnValue19 end;
--CheckCatch
 if not __TryStatus18 then __CatchReturnValue20=__TryHandler22(__TryReturnValue19.data or __TryReturnValue19) end;
--CheckCatchValue
 if true or nil~=__CatchReturnValue20 then return __CatchReturnValue20 end;
if __ToBoolean((not __ToBoolean(__CallMember(obj,"hasOwnProperty",name)))) then
deleted=true
 end
if __ToBoolean((not rawequal(deleted, configurable))) then
attributesCorrect=false
 end
return attributesCorrect end) --FunctionExpr


local isEqual;isEqual = __DefineFunction(function (self,num1,num2)
if __ToBoolean((rawequal(num1, Infinity) and rawequal(num2, Infinity))) then
return true end
if __ToBoolean((rawequal(num1, (-Infinity)) and rawequal(num2, (-Infinity)))) then
return true end
prec=getPrecision(__CallMember(Math,"min",__CallMember(Math,"abs",num1), __CallMember(Math,"abs",num2)))
return (__CallMember(Math,"abs",(num1-num2))<=prec) end) --FunctionExpr


local getPrecision;getPrecision = __DefineFunction(function (self,num)
local log2num = nil;
local pernum = nil;

log2num=(__CallMember(Math,"log",__CallMember(Math,"abs",num))/Math.LN2)
pernum=__CallMember(Math,"ceil",log2num)
return (2*__CallMember(Math,"pow",2, __PlusOp((-52), pernum))) end) --FunctionExpr


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
if __ToBoolean(((not rawequal(__Typeof(__Length(obj)), "number")) or (not rawequal(__Length(obj), __CallMember(Math,"floor",__Length(obj)))))) then
_USD_ERROR("Built-in functions must have a length property with an integer value.")
 end
if __ToBoolean((not rawequal(__Length(obj), length))) then
_USD_ERROR(__PlusOp(__PlusOp(__PlusOp(__PlusOp("Function's length property doesn't have specified value; expected ", length), ", got "), __Length(obj)), "."))
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
local desc = nil;

desc=__CallMember(Object,"getOwnPropertyDescriptor",obj, prop)
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
 __Sink(({})[0])
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
return true end) --FunctionExpr


_USD_ERROR=__DefineFunction(function (self,s)
print("ERROR: ", s)
 end) --FunctionExpr

_USD_PRINT=__DefineFunction(function (self,s)
print("INFO: ", s)
 end) --FunctionExpr

__globalObject=Function("return this;")()
Test262Error.prototype["toString"]=__DefineFunction(function (self)
return __PlusOp("Test262 Error: ", self.message) end) --FunctionExpr

 __Sink(({})[0])
HoursPerDay=24
MinutesPerHour=60
SecondsPerMinute=60
msPerDay=86400000
msPerSecond=1000
msPerMinute=60000
msPerHour=3600000
date_1899_end=(-2208988800001)
date_1900_start=(-2208988800000)
date_1969_end=(-1)
date_1970_start=0
date_1999_end=946684799999
date_2000_start=946684800000
date_2099_end=4102444799999
date_2100_start=4102444800000

-- END
