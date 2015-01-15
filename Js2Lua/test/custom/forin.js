var arr=[];
print(arr.length)
for(var x in {111:2,333:4}){
	console.log(x);
	var fr=x;
	arr.push(fr);
}
print(arr.length)
if(arr.length!==2){
	$ERROR("Invalid array length");
}
if(arr[1]!=='333'){
	$ERROR("Invalid array element(s)");
}
