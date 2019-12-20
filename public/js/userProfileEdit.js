"use strict";

const defaultPicture = "images/defaultprofile.jpg";

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
        document.querySelector("#fname").value = json.firstName;
        document.querySelector("#lname").value = json.lastName;
        document.querySelector("#emailAddress").value = json.emailAddress;
        document.querySelector("#adrs").value = json.homeAddress;
        document.querySelector("#inputCity").value = json.city;
        document.querySelector("#inputProv").value = json.province;
        document.querySelector("#description").value = json.description;

        document.querySelector("#defaultpp").src = json.pictureURL || defaultPicture;
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
    const url = "/upload";
    fetch(url, {
        method: 'POST',
        body: file
    }).then((res) => {
        if (res.status === 200) {
            window.location.href = "userProfileEdit.html";
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

    if (!document.querySelector("#currpwd").value) {
        updateStatus("Please enter your current password to make changes", "red");
        return;
    }
    if (document.querySelector("#newpwd1").value !== document.querySelector("#newpwd2").value) {
        updateStatus("New password fields do not match", "red");
        return;
    }

    const url = "/user";

    const requestBody = {
        currpwd: document.querySelector("#currpwd").value,
        fname: document.querySelector("#fname").value,
        lname: document.querySelector("#lname").value,
        email: document.querySelector("#emailAddress").value,
        adrs: document.querySelector("#adrs").value,
        city: document.querySelector("#inputCity").value,
        prov: document.querySelector("#inputProv").value,
        description: document.querySelector("#description").value
    }

    //only add the new password onto the request if there is one
    if (document.querySelector("#newpwd1").value) {
        requestBody.newpwd = document.querySelector("#newpwd1").value;
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
            document.querySelector("#currpwd").value = "";
            document.querySelector("#newpwd1").value = "";
            document.querySelector("#newpwd2").value = "";

        }
        else if (res.status === 401 || res.status === 403) {
            updateStatus("Password incorrect", "red");
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