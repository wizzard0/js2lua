var qq = function(q1,q2){
	this.q1 = q1
	this.q2 = q2
	var nestedFunc = function(){
		return arguments.length;
	}
	this.a = nestedFunc();
	this.b = nestedFunc(1);
	this.c = nestedFunc(1,2);
}

var qInstance=new qq(new Array("aaa","bbb"),"ccc");
console.log("==============")
console.log(1)
console.log(false)
console.log(null)
console.log(undefined)
console.log({})
console.log([])
console.log(qInstance);
console.log(qInstance.q1);
console.log(qInstance.q2);
console.log(qInstance.a);
console.log(qInstance.b);
console.log(qInstance.c);
