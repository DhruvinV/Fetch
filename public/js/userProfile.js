"use strict";

const defaultDog = "images/defaultdog.jpg";
const defaultUserPicture = "images/defaultprofile.jpg";

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
        document.querySelector("#fname").innerText = json.firstName;
        document.querySelector("#lname").innerText = json.lastName;
        document.querySelector("#emailAddress").innerText = json.emailAddress;
        document.querySelector("#address").innerText = json.homeAddress + ", " + json.city + ", " + json.province;
        document.querySelector("#joinDate").innerText = niceDate(new Date(json.dateJoined));
        // let joinDate = new Date(json.dateJoined);
        // console.log(joinDate);
        // console.log(niceDate(joinDate));


        document.querySelector("#media-object").src = json.pictureURL || defaultUserPicture;


        document.querySelector("#user-description").innerText = json.description || "No description set!";

        displayDogs(json.userDogs);

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

//helper function to prettify a date
function niceDate(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const months = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December'
    ];
    if (day === 1) {
        return months[month] + " " + day + "st, " + year;
    }
    else if (day === 2) {
        return months[month] + " " + day + "nd, " + year;
    }
    else if (day === 3) {
        return months[month] + " " + day + "rd, " + year;
    }
    else {
        return months[month] + " " + day + "th, " + year;
    }
}

//helper function to display the user's dog(s)
//takes an array of dogs as input
function displayDogs(dogs) {
    dogs.forEach((dog, index) => {
        const dogInfoDiv = document.createElement("div");
        dogInfoDiv.classList.add("dog-info");
        
        const dogPic = document.createElement("img");
        dogPic.src = dog.pictureURL || defaultDog;
        dogPic.classList.add("user-pic");
        dogInfoDiv.appendChild(dogPic);

        const dogBioDiv = document.createElement("div");
        dogBioDiv.classList.add("user-bio");
        dogInfoDiv.appendChild(dogBioDiv);

        const dogNameSpan = document.createElement("span");
        dogNameSpan.classList.add("user-name");
        dogNameSpan.innerText = dog.dogName;
        dogBioDiv.appendChild(dogNameSpan);

        const ratingSpan = document.createElement("span");
        ratingSpan.classList.add("rating");
        dogBioDiv.appendChild(ratingSpan);

        const starsSpan = document.createElement("span");
        starsSpan.classList.add("rating-stars");
        starsSpan.innerText = "★";
        ratingSpan.appendChild(starsSpan);

        const ratingNumberSpan = document.createElement("span");
        ratingNumberSpan.classList.add("rating-number");
        ratingNumberSpan.innerText = average(dog.ratings);
        ratingSpan.appendChild(ratingNumberSpan);

        const weightDiv = document.createElement("div");
        weightDiv.classList.add("grey");
        weightDiv.innerText = dog.weight + "lbs";
        dogBioDiv.appendChild(weightDiv);

        const description = document.createElement("p");
        description.classList.add("user-description");
        description.innerText = dog.description || "";
        dogBioDiv.appendChild(description);

        const editButton = document.createElement("a");
        editButton.classList.add("btn");
        editButton.classList.add("btn-primary");
        editButton.classList.add("editDog");
        editButton.href="dogEdit.html?id=" + dog._id;
        editButton.role = "button";
        editButton.innerText = "Edit";
        dogBioDiv.appendChild(editButton);

        document.querySelector(".user").appendChild(dogInfoDiv);
    })
}

//helper function to find the mean of an array of numbers
function average(array) {
    if (array.length == 0) {
        return 0;
    }
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += parseInt(array[i], 10);
    }
    return (sum/array.length).toFixed(2);
}