var arr=[];
for(var x in {1:2,3:4}){
	var fr=x;
	arr.push(fr);
}
if(arr.length!==2){
	$ERROR("Invalid array length");
}
if(arr[1]!=='3'){
	$ERROR("Invalid array element(s)");
}
