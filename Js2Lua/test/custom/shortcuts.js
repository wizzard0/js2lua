console.log(1?2:3);
console.log(undefined?0:3);
console.log(true?2:3);
console.log(false?0:3);

console.log(1||2)
console.log(undefined||2)
console.log(1||false)
console.log(undefined||false)

console.log(1&&2)
console.log(0&&2)
console.log(1&&false)
console.log(0&&false)
// (R(S(a) and R(b)))
function s(n,rv, abort){
	console.log(n); // side effect
	if(abort) { return rv; 
	}else{ // recurse
		console.log("S1",s(0,0,1)?s(1,0,1):s(2,3,1))
		console.log("S2",s(3,0,1)?s(4,1,1):s(5,3,1))
		console.log("S3",s(6,1,1)?s(7,0,1):s(8,3,1))
		console.log("S4",s(9,1,1)?s(10,1,1):s(11,3,1))

		console.log("S1",s(0,0,1)||s(1,0,1))
		console.log("S2",s(3,0,1)||s(4,1,1))
		console.log("S3",s(6,1,1)||s(7,0,1))
		console.log("S4",s(9,1,1)||s(10,1,1))

		console.log("S1",s(0,0,1)&&s(1,0,1))
		console.log("S2",s(3,0,1)&&s(4,1,1))
		console.log("S3",s(6,1,1)&&s(7,0,1))
		console.log("S4",s(9,1,1)&&s(10,1,1))		
		return rv
	}
}
var a;
console.log("S1",s(0,0)?s(1,0):s(2,3))
console.log("S2",s(3,0)?s(4,1):s(5,3))
console.log("S3",s(6,1)?s(7,0):s(8,3))
console.log("S4",s(9,1)?s(10,1):s(11,3))

console.log("S1",s(0,0)||s(1,0))
console.log("S2",s(3,0)||s(4,1))
console.log("S3",s(6,1)||s(7,0))
console.log("S4",s(9,1)||s(10,1))

console.log("S1",s(0,0)&&s(1,0))
console.log("S2",s(3,0)&&s(4,1))
console.log("S3",s(6,1)&&s(7,0))
console.log("S4",s(9,1)&&s(10,1))
