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
test([]);
test({});
test({a:1});
test({a:1,b:[1,2,3]});
