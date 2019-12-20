"use strict";

//storage for the current user
let user; 

// Initialize the page
window.addEventListener("load", initializePage);

function initializePage(e) {

    const url = '/user';
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get user data");
            return Promise.reject(res.status);
        }
    }).then((json) => {
        user = json;
    }).catch((error) => {
        if (error === 404) {
            alert("Session expired! Please log in again");
            window.location.href = "login.html";
        }
        else {
            console.log(error);
        }
    })
}

//event handler for submitting
function submitChanges(e) {
    e.preventDefault();

    const url = "/dogs/" + user._id;

    const requestBody = {
        dogName: document.querySelector("#name").value,
        weight: document.querySelector("#weight").value,
    }

    const request = new Request(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    });

    console.log(request);
    fetch(request).then((res) => {
        if (res.status === 200) {
            //put a message on the page to tell the user
            window.location.href="userProfile.html";
        }
        else {
            return Promise.reject(res.status);
        }
    }).catch((error) => {
        console.log(error);
    });
}

document.querySelector("#saveButton").addEventListener("click", submitChanges);
document.querySelector("#resetButton").addEventListener("click", (e) => {window.location.href = "userProfile.html"});