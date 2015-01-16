var x = {a:1,b:[1,2,3]};

var y = JSON.stringify(x);
console.log(y);

var z = JSON.parse(y);

var w = JSON.stringify(z);
console.log(w);
