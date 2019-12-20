/* AJAX fetch() calls */
const log = console.log
// log('Loaded front-end javascript.')\
// const bcrypt = require('bcryptjs')
function addUser(){
    // var usertype;
    // if(document.getElementById("radio-one").checked){
    //     usertype = "/user"
    // }else if(document.getElementById("radio-one").checked){
    //     usertype = "/walker"
    // }
    // console.log(document.getElementById("signupForm").elements["userswitch"].value)
    const userType = "/"+document.getElementById("signupForm").elements["userswitch"].value
    if (userType == "/") {
        status("Please select either Dog Owner or Walker", "red");
        return;
    }
    if (!checkFields()) {
        status("Please fill all required fields (marked with a *)", "black");
        return;
    }
    let data = {
        firstName: document.querySelector('#firstName').value,
        lastName: document.querySelector('#lastName').value,
        password: document.querySelector('#password').value,
        username: document.querySelector('#username').value,
        homeAddress: document.querySelector('#homeAddress').value,
        city: document.querySelector('#city').value,
        province: document.querySelector('#province').value,
        // phoneNumber: document.querySelector('#phoneNumber').value,
        emailAddress: document.querySelector('#emailAddress').value
    }
    // console.log(userType)
    const request = new Request(userType, {
        method: 'POST', 
        body: JSON.stringify(data),
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        },
        mode: 'cors'
    });
    fetch(request)
    .then(function(res){
        if(res.status === 200){
            status("Account successfully created! Please log in.", "green");
            setTimeout(redirect, 1000);
        }
        else if (res.status === 403) {
            status("That username is taken; please select another one.", "red");
        }
        else {
            status("Unknown error", "red");
        }
    }).catch((error)=>{
        log(error)
    })      
}

function status(message, colour) {
    const statusArea = document.querySelector("#status");
    statusArea.innerText = message;
    statusArea.style.color = colour;
}

function checkFields() {
    if (!document.querySelector('#firstName').value ||
    !document.querySelector('#lastName').value ||
    !document.querySelector('#password').value ||
    !document.querySelector('#username').value ||  
    !document.querySelector('#emailAddress').value) {
        return false;
    }
    else {
        return true;
    }
}

function redirect() {
    window.location.href = "/login.html";
}