"use strict";

// function loginOwner(event) {
//   const ownertxt = document.createTextNode("──────   OWNER   ────── ");
// 	const ogtxt = document.getElementById("dropdownMenuButton");
//  	ogtxt.replaceChild(ownertxt, ogtxt.childNodes[0]);
// }

// function loginWalker(event) {
//   const ownertxt = document.createTextNode("──────   WALKER   ────── ");
//   const ogtxt = document.getElementById("dropdownMenuButton");
//   ogtxt.replaceChild(ownertxt, ogtxt.childNodes[0]);
// }

document.querySelector("#submit").addEventListener("click", submit);
function submit(event) {
  const type = document.querySelector("#selectUser").value;
  if (type == "user" || type == "walker") {
    ; //do nothing
  }
  else {
    alert("Please select a type of user to login as.");
    event.preventDefault();
  }
}