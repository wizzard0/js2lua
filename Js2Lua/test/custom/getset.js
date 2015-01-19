var a={};

var desc={
	get: function(){
		return this.bs/2;
	},
	set: function(v){
		console.log(v);
		this.bs = v*2;
	},
	enumerable:true,
	configurable:true
};
console.log(desc.enumerable)
Object.defineProperty(a,'p1',desc)

a.bs=0;

console.log(a.bs,a.p1);

a.p1=1;

console.log(a.bs,a.p1);