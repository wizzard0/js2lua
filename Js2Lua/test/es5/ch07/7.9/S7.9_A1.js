// Copyright 2009 the Sputnik authors.  All rights reserved.
// This code is governed by the BSD license found in the LICENSE file.

/**
 * Check Continue Statement for automatic semicolon insertion
 *
 * @path ch07/7.9/S7.9_A1.js
 * @description Try use continue \n Label construction
 */

// LUA_SKIP not yet implemented, need careful jump tracking

console.log("c1");

//CHECK#1
label1: for (var i = 0; i <= 0; i++) {
  console.log("c11");
  for (var j = 0; j <= 1; j++) {
    console.log("c12");
    if (j === 0) {
      continue label1;
    } else {
      $ERROR('#1: Check continue statement for automatic semicolon insertion');
    }
    console.log("c13");
  }  
  console.log("c14");
}
console.log("c2");
//CHECK#2
var result = false;
label2: for (var i = 0; i <= 1; i++) {
  console.log("c3");
  for (var j = 0; j <= 1; j++) {
    console.log("c4");
    if (j === 0) {
      console.log("c5");
      continue 
      label2; 
    } else {
      console.log("c6");
      result = true;
    }
  }    
}

if (result !== true) {
  $ERROR('#2: Check continue statement for automatic semicolon insertion');
}

