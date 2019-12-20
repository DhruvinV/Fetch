"use strict";

/*******************
 * class definitions
 *******************/

class Walker {
    constructor(name, picture, rating, description) {
        this.name = name;
        this.picture = picture;
        this.rating = rating;
        this.description = description;
    }
}

//default things for when the walker doesn't have these set
const defaultDescription = "I'll walk your dog for you!";
const defaultPicture = "images/defaultprofile.jpg";

//storage for server call results
let walkRequest;
let walker;
let timeLeft; 

let walkDone = false; 

/*************************
 * Page initialization
 * - a chain of events to load all the walk info onto the page
 *************************/
window.addEventListener("load", getInfo);

function getInfo(e) {
    const url = '/walk';
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get walk data");
            if (res.status === 404) {
                alert("Session expired! Please log in again");
                window.location.href = "login.html";
            }
            else {
                return Promise.reject(res.status);
            }
        }
    }).then((json) => {
        if (json.length > 0 && json[0].accepted) {
            walkRequest = json[0];
            timeLeft = walkRequest.duration;
            updateTimeLeft(timeLeft);

            //add the walker's existing notes
            walkRequest.notes.forEach((note, index) => {
                addWalkerNote(note);
            });

            const finishTime = new Date(walkRequest.endTime);
            const now = new Date();
            timeLeft = timeDifference(finishTime, now);
            if (timeLeft < 0) {
                timeLeft = 0;
            }
            if (timeLeft == 0 && finishTime > now) {
                updateTimeLeft("<1");
            }
            else {
                updateTimeLeft(timeLeft);
            }

            updatePrice(walkRequest.duration, walkRequest.walkNeeds.length);

            if (timeLeft == 0 && now > finishTime) { //walk finished
                setTimeout(100, finishWalk);
            }

            getWalker();
        }
        else {
            //no active walk, redirect user
            window.location.href = "requestWalk.html"
        }
    }).catch((error) => {
        console.log(error);
    });
}

function getWalker() {
    const url = '/walker/' + walkRequest.walkerId;
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            return Promise.reject(res.status);
        }
    }).then((json) => {
        walker = json;
        initializeMap();
    }).catch((error) => {
        console.log(error);
    })
}

function initializeMap() {
    //place markers for dog and walker locations
    placePickupMarker(walkRequest.locations[0].x, walkRequest.locations[0].y);
    placeWalkerMarker(walkRequest.locations[walkRequest.locations.length-1].x, 
        walkRequest.locations[walkRequest.locations.length-1].y);

    //start the blinking of the walker marker
    setTimeout(blinkWalkerMarker, 500);
    //display the walker's info
    displayWalker(walker);
};

/***********************
 * Add a new walker note
 **********************/

function addWalkerNote(message) {
    const notesList = document.querySelector("#notes-div").children[0];
    const newNote = document.createElement("li");
    newNote.innerText = message;
    notesList.appendChild(newNote);
}

/***************************************************************
 * Show pickup location on the map and update the dog's location
 ***************************************************************/

let pickupMarker = null;
let walkerMarker = null;
let walkerBlink = false;
const markerRadius = 10; //this is used for styling purposes

function placePickupMarker(xCoordinate, yCoordinate) {
    pickupMarker = document.createElement("div");
    pickupMarker.classList.add("pickup-marker");
    pickupMarker.style.top = (yCoordinate - markerRadius).toString() + "px";
    pickupMarker.style.left = (xCoordinate - markerRadius).toString() + "px";
    document.querySelector("#map").appendChild(pickupMarker);
}

function placeWalkerMarker(xCoordinate, yCoordinate) {
    walkerMarker = document.createElement("div");
    walkerMarker.classList.add("walker-marker");
    walkerMarker.style.top = (yCoordinate - markerRadius).toString() + "px";
    walkerMarker.style.left = (xCoordinate - markerRadius).toString() + "px";
    document.querySelector("#map").appendChild(walkerMarker);
}

function updateWalkerMarkerLocation(xCoordinate, yCoordinate) {
    walkerMarker.style.top = (yCoordinate - markerRadius).toString() + "px";
    walkerMarker.style.left = (xCoordinate - markerRadius).toString() + "px";
}

function blinkWalkerMarker () {
    if (walkerBlink) {
        walkerMarker.style.borderColor = "orange";
        walkerMarker.style.backgroundColor = "white";
        walkerBlink = false;
        setTimeout(blinkWalkerMarker, 750);
    }
    else {
        walkerMarker.style.borderColor = "black";
        walkerMarker.style.backgroundColor = "orange";
        walkerBlink = true;
        setTimeout(blinkWalkerMarker, 1500);
    }
}

/******************************************************
 * Show the walker
 *****************************************************/

function displayWalker(walker) {

    //box for the popup
    const selectWalkerPopup = document.createElement("div");
    selectWalkerPopup.classList.add("walkerDisplay");

    //add walker's picture
    const walkerImage = document.createElement("img");
    walkerImage.classList.add("walker-popup-image");
    walkerImage.src = walker.pictureURL || defaultPicture;
    selectWalkerPopup.appendChild(walkerImage);

    //add walker's name
    const walkerNameSpan = document.createElement("span");
    walkerNameSpan.classList.add("walker-popup-name");
    walkerNameSpan.innerText = walker.firstName + " " + walker.lastName;
    selectWalkerPopup.appendChild(walkerNameSpan);

    //add walker's rating
    const walkerRatingDisplay = document.createElement("div");

    const walkerRatingStarsSpan = document.createElement("span");
    walkerRatingStarsSpan.classList.add("walker-popup-stars");
    walkerRatingStarsSpan.innerText = "\u2605";

    const walkerRatingNumberSpan = document.createElement("span");
    walkerRatingNumberSpan.classList.add("walker-popup-rating");
    walkerRatingNumberSpan.innerText = average(walker.ratings);

    walkerRatingDisplay.appendChild(walkerRatingStarsSpan);
    walkerRatingDisplay.appendChild(walkerRatingNumberSpan);
    selectWalkerPopup.appendChild(walkerRatingDisplay);

    //add box as child for area
    const walkerArea = document.querySelector("#right-pane-body");
    walkerArea.appendChild(selectWalkerPopup);

}

/*********************
 * Update the page
 ***********************/
const updatePageInterval = setInterval(updatePage, 1000);

function updateTimeLeft(minutes) {
    const finishTime = document.querySelector("#finish-time");
    finishTime.innerText = minutes.toString(10) + " min";
}

function updatePage() {
    //query server for walker's current status
    const url = '/walk/' + walkRequest._id;
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get walk data");
            return Promise.reject(res.status);
        }
    }).then((json) => {
        const walkRequestUpdated = json;

        //update notes
        if (walkRequestUpdated.notes.length > walkRequest.notes.length) {
            for (let i = walkRequest.notes.length; i < walkRequestUpdated.notes.length; i++) {
                addWalkerNote(walkRequestUpdated.notes[i]);
            }
        }

        //update location
        if (walkRequestUpdated.locations.length > walkRequest.locations.length) {
            updateWalkerMarkerLocation(walkRequestUpdated.locations[walkRequestUpdated.locations.length-1].x, 
                walkRequestUpdated.locations[walkRequestUpdated.locations.length-1].y);
        }

        //save this updated data
        walkRequest = walkRequestUpdated;

        const finishTime = new Date(walkRequest.endTime);
        const now = new Date();
        timeLeft = timeDifference(finishTime, now);
        if (timeLeft < 0) {
            timeLeft = 0;
        }
        if (timeLeft == 0 && finishTime > now) {
            updateTimeLeft("<1");
        }
        else {
            updateTimeLeft(timeLeft);
        }

        updatePrice(walkRequest.duration, walkRequest.walkNeeds.length);

        if (timeLeft == 0 && now > finishTime) { //walk finished
            finishWalk();
        }
    }).catch((error) => {
        console.log(error);
    });
}

/*************************************
 * Price estimate update functionality
 ************************************/

function updatePrice(duration, numNeeds) {
    const priceSpan = document.querySelector("#price");
    const priceEstimate = 8 + 2*duration/5 + 5*numNeeds;
    priceSpan.innerText = "$" + priceEstimate.toFixed(2).toString();
}

/***************************************
 * Finish walk and walker rating options
 ***************************************/

let rating = 0; //user-entered rating
let stars = [];
let ratingDescriptions = ["Horrendous", "Terrible", "Decent", "Okay", "Great"];
let ratingText = null;
let feedbackDiv = null;
let doneButton = null;

function finishWalk() {

    //only finish the walk once
    if (walkDone) {
        return;
    }

    walkDone = true;

    //resize the picture
    const walkerPic = document.querySelector(".walker-popup-image");
    walkerPic.style.maxHeight = "100px";
    walkerPic.style.maxWidth = "100px";
    walkerPic.nextSibling.remove();
    walkerPic.nextSibling.remove();

    //text to request a rating for the walker
    const ratingRequest = document.createElement("h4");
    ratingRequest.classList.add("rating-request");
    ratingRequest.innerText = "Please rate your Walker";
    walkerPic.after(ratingRequest);

    //create a div to hold the stars
    const starsSpan = document.createElement("span");
    starsSpan.classList.add("stars-span");
    starsSpan.addEventListener("mouseleave", resetStars)
    ratingRequest.after(starsSpan);

    //create the five stars
    for (let i = 0; i < 5; i++) {
        const star = document.createElement("span");
        star.classList.add("rating-star");
        star.innerText = "\u2606";
        star.addEventListener("mouseover", starMouseover);
        star.addEventListener("click", selectStar);
        stars.push(star);
        starsSpan.appendChild(star);
    }

    ratingText = document.createElement("p");
    ratingText.classList.add("rating-text");
    starsSpan.after(ratingText);

    //change page title
    document.title = "Walk complete!";
}

//animation for when the user hovers over the stars to select
function starMouseover(e) {
    //if the user has selected a rating, we do not do the animation
    if (rating != 0) {
        return;
    }

    //find which star was mouseovered
    const target = e.target;

    let selected = 0;
    for (let i = 0; i < 5; i++) {
        if (target == stars[i]) {
            selected = i + 1;
        }
    }

    //colour all stars to the left of and including the mouseovered one
    for (let i = 0; i < selected; i++) {
        stars[i].innerText = "\u2605";
    }
    //uncolour all other stars
    for (let i = selected; i < 5; i++) {
        stars[i].innerText = "\u2606";
    }
    //update text
    ratingText.innerText = ratingDescriptions[selected - 1];
}

//function to reset stars when the user stops hovering over them
function resetStars(e) {
    //if the user has selected a rating, we do not do the animation
    if (rating != 0) {
        return;
    }
    for (let i = 0; i < 5; i++) {
        stars[i].innerText = "\u2606";
    }
    ratingText.innerText = "";
}

function selectStar(e) {
    //find which star was mouseovered
    const target = e.target;

    rating = 0;
    for (let i = 0; i < 5; i++) {
        if (target == stars[i]) {
            rating = i + 1;
        }
    }

    //colour all stars to the left of and including the mouseovered one
    for (let i = 0; i < rating; i++) {
        stars[i].innerText = "\u2605";
    }
    //uncolour all other stars
    for (let i = rating; i < 5; i++) {
        stars[i].innerText = "\u2606";
    }
    //update text
    ratingText.innerText = ratingDescriptions[rating - 1];

    //if the user had a problem, prompt them for feedback
    if (rating < 5) {
        //do not add div more than once
        if (feedbackDiv == null) {
            feedbackDiv = document.createElement("div");
            feedbackDiv.classList.add("feedback-container");
            const feedbackOptions = ["Professionalism", "Lost", "Dog Neglected", "Need Not Met", "Other"];
            for (let i = 0; i < feedbackOptions.length; i++) {
                const feedback = document.createElement("span");
                feedback.classList.add("feedback");
                feedback.innerText = feedbackOptions[i];
                feedbackDiv.appendChild(feedback);
            }
            //add toggling
            feedbackDiv.addEventListener("click", toggleFeedback);
            //add after the rating
            document.querySelector(".rating-text").after(feedbackDiv);

            const reportProblemLink = document.createElement("p");
            reportProblemLink.classList.add("report-problem-link");
            reportProblemLink.innerText = "Report a problem with this walk";
            reportProblemLink.addEventListener("click", reportProblem);
            feedbackDiv.appendChild(reportProblemLink);
        }
    }

    //remove the feedback options if user changes their mind
    if (rating == 5) {
        if (feedbackDiv) {
            feedbackDiv.remove();
            feedbackDiv = null;
        }
    }

    //draw the done button
    if (doneButton == null) {
    doneButton = document.createElement("button");
    doneButton.classList.add("submit");
    doneButton.innerText = "Done";
    doneButton.addEventListener("click", submit);
    document.querySelector(".walkerDisplay").appendChild(doneButton);
    }
}

//change the feedback box colours
function toggleFeedback(e) {
    e.preventDefault();

    if (e.target.classList.contains('feedback')) {
        //select the styling for the need that was clicked on
        const feedback = e.target.style;
        if (feedback.backgroundColor === "" || feedback.backgroundColor == "white") {
            feedback.backgroundColor = "green";
            feedback.color = "white";
        }
        else {
            feedback.backgroundColor = "white";
            feedback.color = "green";
        }
    }
}

//allow the user to report an issue
function reportProblem(e) {
  if(!document.querySelector(".feedback-box")){
    const feedbackBox = document.createElement("textarea");
    feedbackBox.classList.add("feedback-box");
    feedbackBox.placeholder = "Please describe the problems you encountered.";
    document.querySelector(".report-problem-link").after(feedbackBox);
  }
}

function submit(e) {
    e.preventDefault();
    
    const walkerRating = rating;
    const complaints = [];
    if (walkerRating != 5) {
        const feedbackDiv = document.querySelector(".feedback-container");
        Array.prototype.forEach.call(feedbackDiv.children, (child) => {
            if (child.classList.contains('feedback') && child.style.backgroundColor == "green") {
                complaints.push(child.innerText);
            }
        })
    }

    //submit to server
    const url = '/walk/' + walkRequest._id;
    const requestBody = {
        walkerRating: walkerRating,
        walkerComplaints: complaints
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
            const feedbackBox = document.querySelector(".feedback-box");
            if (feedbackBox) {
                submitReport(complaints);
            }
            else {
                window.location.href = "pastWalks.html"
            }
        }
        else {
            if (res.status === 403) {
                alert("Session expired! Please log in again");
                window.location.href = "login.html";
            }
            else {
                return Promise.reject(res.status);
            }
        }
    }).catch((error) => {
        console.log(error);
    });
}

function submitReport(complaints) {
    let type;
    const feedbackBox = document.querySelector(".feedback-box");

    if (complaints.length == 0) {
        type = "Unspecified";
    }
    else {
        type = complaints[0];
        for (let i = 1; i < complaints.length; i++) {
            type += ", " + complaints[i];
        }
    }

    //submit to server
    const url = '/report';
    const requestBody = {
        type: type,
        description: feedbackBox.value,
        walkerId: walkRequest.walkerId,
        userId: walkRequest.userId,
        dogId: walkRequest.dogId,
        walkId: walkRequest._id
    }

    const request = new Request(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    });

    fetch(request).then((res) => {
        if (res.status === 200) {
            window.location.href = "pastWalks.html"
        }
        else {
            return Promise.reject(res.status);
        }
    }).catch((error) => {
        console.log(error);
    });
}

/*******************
 * Helper functions
 ******************/
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

//get the number of minutes' difference between two times
function timeDifference(laterTime, earlierTime) {
    return Math.round((((laterTime - earlierTime) % 86400000) % 3600000) / 60000);
}