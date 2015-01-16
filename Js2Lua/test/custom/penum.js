var o1={};
var o2={a:1};
var o3={};
o3[5]=1;
console.log(o1.propertyIsEnumerable('toString'))
console.log(Object.keys(o1))
console.log(Object.keys(o2))
console.log(Object.keys(o3))
