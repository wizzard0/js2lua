function test(x){
try{

var y = JSON.stringify(x);
console.log(y);

var z = JSON.parse(y);

var w = JSON.stringify(z);
console.log(w);
}catch(e){
	console.log("ERROR:"+e);
}
}

test({});
test({a:1});
test({a:1,b:[1,2,3]});
