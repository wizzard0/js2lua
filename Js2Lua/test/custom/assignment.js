var a=2;
var b=3;
var c=5;

var d=++a;
var h=a++;
var e,f;
e=f=d;
console.log(e)
console.log(f)
console.log(h)
console.log(d)
var arr1=[1,2,3];
var arr2=[];
var j=0;
console.log("iters");
arr1.forEach(function(i){console.log(i)});
while(true){
	arr2.push(arr1[j++]);
	if(j==3)break;
}
console.log("after assign");
console.log(arr1.length);
console.log(arr2.length);
console.log(arr2);
