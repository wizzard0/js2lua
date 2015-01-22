function test(x){
try{

var y = JSON.stringify(x);
console.log(y);

var z = JSON.parse(y);

var w = JSON.stringify(z);
console.log(w);
}catch(e){
	console.log("ERROR: X"+e);
}
}
console.log(Object.prototype.toString.apply([]))
console.log(Object.prototype.toString.apply([5]))
console.log(Object.prototype.toString.apply(new Array()))
console.log(Object.prototype.toString.apply(new Array(1)))
console.log(Object.prototype.toString.apply(new Array(1,1)))
console.log(typeof([]))
console.log(typeof([5]))
console.log(typeof(new Array()))
console.log(typeof(new Array(1)))
console.log(typeof(new Array(1,1)))
console.log(undefined||null)
test(null);
test([]);
test([3]);
test([5,6]);
test({});
test({a:1});
//test({a:1,b:[1,2,3]});// fails because key ordering
test({b:[1,2,3,null,true,false]});// fails because no roundtrip
