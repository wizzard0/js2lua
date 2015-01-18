var x=new C(5);
console.log(x);
console.log(x.toString());
console.log(x.x);
x.method();


function C(xx){
	this.x=xx;
	console.log(xx);
	this.method=function(){ console.log(this.x); }
this.toString=function(){return"QQQ"}
}
