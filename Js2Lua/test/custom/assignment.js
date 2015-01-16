var a=2;
var b=3;
var c=5;

var d=++a;
var e,f;
e=f=d;
console.log(e)
console.log(f)
console.log(d)
var arr1=[1,2,3];
var arr2=[0,0,0];
var i=0;var j=0;
while(true){
	arr2[i++]=arr1[j++];
	if(i==3)break;
}
console.log(arr2.length);
console.log(arr2);
