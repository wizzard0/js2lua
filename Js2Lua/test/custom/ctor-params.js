var qq = function(q1,q2){
	this.q1 = q1
	this.q2 = q2
}

var qInstance=new qq(new Array("aaa","bbb"),"ccc");

console.log(qInstance);
console.log(qInstance.q1);
console.log(qInstance.q2);
