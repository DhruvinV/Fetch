"use strict";

const defaultPicture = "images/defaultdog.jpg";

//storage for the server call results
let user = null;
let doggo = null;

// Initialize the page
window.addEventListener("load", initializePage);

function initializePage(e) {
    //fill the boxes with the user's info
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
        const doggoId = getDogId();
        if (!doggoId) {
            alert("Invalid dog!");
            window.location.href = "userProfile.html"
        }
        doggo = user.userDogs.filter((dog) => dog._id == doggoId)[0];

        //load dog's info onto the page
        document.querySelector("#name").value = doggo.dogName;
        document.querySelector("#weight").value = doggo.weight;
        document.querySelector("#description").value = doggo.description || "";
        document.querySelector("#defaultpp").src = doggo.pictureURL || defaultPicture;
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

//post a file (profile picture) to the server for uploading
function uploadFile(file) {
    const url = "/upload/" + user._id + "/" + doggo._id;
    fetch(url, {
        method: 'POST',
        body: file
    }).then((res) => {
        if (res.status === 200) {
            window.location.href = window.location.href;
        }
        else {
            console.log("Error " + res.status + ": Could not upload file");
        }
    }).catch((error) => {
        console.log("error", error);
    });
}

//wrapper function to upload the user's selected photo
function uploadPicture(e) {
    e.preventDefault();
    const fileInput = document.querySelector("#fileInput");
    if (!fileInput.files.length) {
        console.log("no file selected");
    }
    else {
        const formData = new FormData();
        formData.append("file", fileInput.files[0]);
        uploadFile(formData);
    }
}

//helper function to edit the status label above the submit button
function updateStatus(message, colour) {
    const statusMessage = document.querySelector("#status");
    statusMessage.innerText = message;
    statusMessage.style.color = colour;
}

//event handler for submitting
function submitChanges(e) {
    e.preventDefault();

    const url = "/dogs/" + user._id + "/" + doggo._id;

    const requestBody = {
        dogName: document.querySelector("#name").value,
        weight: document.querySelector("#weight").value,
        description: document.querySelector("#description").value    
    }

    const request = new Request(url, {
        method: 'PATCH',
        body: JSON.stringify(requestBody),
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    });

    fetch(request).then((res) => {
        if (res.status === 200) {
            //put a message on the page to tell the user
            updateStatus("Successfully updated!", "green");

        }
        else {
            updateStatus("Something went wrong :(", "red");
        }
    }).catch((error) => {
        console.log(error);
    });
}

document.querySelector("#saveButton").addEventListener("click", submitChanges);
document.querySelector("#uploadPicButton").addEventListener("click", uploadPicture);
document.querySelector("#resetButton").addEventListener("click", (e) => {window.location.href = "userProfile.html"});

function getDogId() {
    let vars = {};
    const parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars["id"];
}