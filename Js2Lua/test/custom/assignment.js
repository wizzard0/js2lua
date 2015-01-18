var a=2;
var b=3;
var c=5;

var d=++a;
var h=a++;
var e,f;
e=f=d;
console.log('a',e,f,h,d,'b');
var arr1=[1,2,3];
var _2=2;
console.log(arr1[0])
console.log(arr1[2])
console.log(arr1[_2])
var arr2=[];
var j=0;
console.log("iters");
arr1.forEach(function(i){console.log(i)});
while(true){
	var el=arr1[j++];
	console.log(el);
	arr2.push(el);
	if(j==3)break;
}
arr2[2] = arr1[2]
console.log("after assign");
console.log(arr1.length);
console.log(arr2.length);
console.log(arr1);
console.log(arr2);
