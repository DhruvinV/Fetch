"use strict";

/*******************
 * class definitions
 *******************/
class User {
   constructor(name, picture, rating, description) {
       this.name = name;
       this.picture = picture;
       this.rating = rating;
       this.description = description;
   }
}

class walkRequest {
    constructor(xCoord, yCoord, length, needs, price){
    this.x = xCoord
    this.y = yCoord
    this.length = length
    this.needs = needs
    this.price = price
    }
}

let defaultPicture = "images/defaultprofile.jpg";
let defaultDescription = "I'll walk your dog for you!";

//storage for server call results
let userData; //the owner's data
let walkRequested = false; //whether or not there is an active walk - disables page changes if there is

/*****************************
 * Page initialization
 *****************************/

window.addEventListener("load", initializePage);
function initializePage(e) {
    const url = '/user';
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get user data");
            if (res.status === 404) {
              alert("Session expired! Please log in again");
              window.location.href = "login.html";
            }
            else {
              return Promise.reject(res.status);
            }
        }
    }).then((json) => {
        //if needed, can save ID here - but probably don't need
        userData = json;

        json.userDogs.forEach((dog, index) => {
            addDog(dog);
        })
    }).catch((error) => {
        console.log(error);
    });

    //if the user has a walk pending, then display it instead of showing the select a walk page again
    const walkurl = '/walk';
    fetch(walkurl).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get user data");
            return Promise.reject(res.status);

        }
    }).then((json) => {
        if (json.length > 0) {
            const walk = json[0];
            if (walk.accepted) {
                window.location.href = "userWalkStatus.html"
            }
            else {
                //initialize page to reflect the walk in progress
                walkRequested = true;
                showPendingWalk(walk);
            }
        }
    }).catch((error) => {
        console.log(error);
    })
}

/*****************************
 * Dog selection functionality
 *****************************/
//add the dog to the list of dogs at the top of the page
function addDog(dog) {
    const dogSpan = document.createElement("span");
    dogSpan.classList.add("dogListItem");
    dogSpan.innerText = dog.dogName;
    document.querySelector('#dog-container').appendChild(dogSpan);
    dogSpan.addEventListener('click', toggleDog);
}

let selectedDog = null;
let selectedDogIndex = null;

function toggleDog(e){
    //disable changes if a walk has been requested
    if (walkRequested) return;
    let dog = e.currentTarget

    if (dog.className == "dogListItem") {
        if (selectedDog) {
            selectedDog.className = "dogListItem";
        }
        selectedDog = dog;
        dog.className = "dogListSel";
        //get the index of this dog so we can submit a request later
        const parent = selectedDog.parentNode;
        selectedDogIndex = Array.prototype.indexOf.call(parent.children, selectedDog);
    }
    else {
        dog.className = "dogListItem"
        selectedDog = null;
        selectedDogIndex = null;
    }
}

/******************************
 * Map click functionality
 ******************************/

const map = document.querySelector("#map");
let marker = null;
let xCoordinate = null;
let yCoordinate = null;
let availableWalkers = null;

/* Function to handle the user clicking on the map */
function mapClick(e) {
    //disable changes if a walk has been requested
    if (walkRequested) return;

    const markerRadius = 10;
    xCoordinate = e.layerX;
    yCoordinate = e.layerY;

    if (!marker) {
        marker = document.createElement("div");
        marker.classList.add("marker");
        marker.style.top = (yCoordinate - markerRadius).toString() + "px";
        marker.style.left = (xCoordinate - markerRadius).toString() + "px";
        map.appendChild(marker);
    }
    else {
        marker.style.top = (yCoordinate - markerRadius).toString() + "px";
        marker.style.left = (xCoordinate - markerRadius).toString() + "px";
    }

    //send these coordinates to the server and query nearby walkers
    const url = '/walker/active';
    
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log(res.status);
        }
    }).then((json) => {
        availableWalkers = json;
        removeAllWalkers();

        json.forEach((walker, index) => {
            addWalker(walker);
        })
    }).catch((error) => {
        console.log(error);
    })

}

map.addEventListener('click', mapClick);

/****************************
 * Setting walk cost estimate
 ****************************/
let numWalkNeeds = 0;
let walkLength = 30;

const price = document.querySelector('#price');

function updateCostEstimate() {
    const priceEstimate = 8 + 2*walkLength/5 + 5*numWalkNeeds;
    price.innerText = "$" + priceEstimate.toString(10);
}

/************************
 * Walk length slider bar
 ************************/

const walkLengthSlider = document.querySelector('#walk-length-slider');
const walkLengthLabel = document.querySelector('#walk-length-number');

walkLengthSlider.addEventListener('input', updateWalkSlider);

//TODO: add functionality to only allow certain values: 5, 10, 15, 20, 30, 45, 60, 75, 90, 120 mins
function updateWalkSlider(e) {
    walkLengthLabel.innerText = walkLengthSlider.value + "min";
    walkLength = walkLengthSlider.value;
    updateCostEstimate();
}

/*******************
 * Walk needs toggle
 ******************/

const walkNeeds = document.querySelector('#walk-needs-container');
walkNeeds.addEventListener('click', toggleNeed);

function toggleNeed(e) {
    e.preventDefault();
    //disable changes if a walk has been requested
    if (walkRequested) return;

    if (e.target.classList.contains('walk-need')) {
        //select the styling for the need that was clicked on
        const need = e.target.style;
        if (need.backgroundColor === "" || need.backgroundColor == "white") {
            need.backgroundColor = "green";
            need.color = "white";

            //update number of needs for pricing
            numWalkNeeds++;
        }
        else {
            need.backgroundColor = "white";
            need.color = "green";

            //update number of needs for pricing
            numWalkNeeds--;
        }
        updateCostEstimate();
    }
}

/**********************************
 * manipulating walkers on the page
 **********************************/

//clear all walkers
function removeAllWalkers() {
    const walkerArea = document.querySelector('#walker-container');
    while (walkerArea.firstChild) {
        walkerArea.removeChild(walkerArea.firstChild);
    }
}

//add walker to the "Available Walkers" panel
function addWalker(walker) {

    //get the area to add the walker
    const walkerArea = document.querySelector('#walker-container');

    const walkerDiv = document.createElement("div");
    walkerDiv.classList.add("walker");

    //add walker to walker area
    walkerArea.appendChild(walkerDiv);

    const walkerPic = document.createElement("img");
    walkerPic.classList.add("walker-pic");
    walkerPic.src = walker.pictureURL || defaultPicture;

    const walkerBio = document.createElement("div");
    walkerBio.classList.add("walker-bio");

    //add pic and description to walker
    walkerDiv.appendChild(walkerPic);
    walkerDiv.appendChild(walkerBio);

    const walkerName = document.createElement("span");
    walkerName.classList.add("walker-name");
    walkerName.innerText = walker.firstName + " " + walker.lastName;

    //add bio elements to walker bio
    walkerBio.appendChild(walkerName);

    const rating = document.createElement("span");
    rating.classList.add("rating");

    //add rating to the bio
    walkerBio.appendChild(rating);

    const ratingStars = document.createElement("span");
    ratingStars.classList.add("rating-stars");

    const fullStar = "\u2605";
    ratingStars.innerText = fullStar;

    //add the stars to the rating
    rating.appendChild(ratingStars);

    const ratingNumber = document.createElement("span");
    ratingNumber.classList.add("rating-number");
    ratingNumber.innerText = average(walker.ratings).toString(10);

    //add the number to the rating
    rating.appendChild(ratingNumber);

    const desc = document.createElement("p");
    desc.classList.add("walker-description");
    desc.innerText = walker.description || defaultDescription;
    //desc.innerText = walker.description;

    walkerBio.appendChild(desc);
}

//get the walker display area
const walkerArea = document.querySelector('#right-pane-body');
walkerArea.addEventListener('click', selectWalker);

//variable to store popup when walker has been selected
let selectWalkerPopup = null;
let savedWalkers = null;
let confirmationDiv = null;
let statusMessage = null;
let selectedWalkerIndex = null;

function removePopup(e) {
    e.preventDefault();
    selectWalkerPopup.remove();
    selectWalkerPopup = -1;

    const walkerArea = document.querySelector("#right-pane-body");
    walkerArea.appendChild(savedWalkers);
    savedWalkers = null;
    confirmationDiv = null;
}

function selectWalker(e) {
    //clicking the no button causes this function to be called again, so suppress this extra call
    if (selectWalkerPopup === -1) {
        selectWalkerPopup = null;
        return;
    }

    /* not sure if still necessary - keeping in case */
    //only allow selecting one walker at a time
    if (selectWalkerPopup != null) {
        return;
    }

    let targetWalker = e.target;
    while (targetWalker && !(targetWalker.classList.contains("walker"))) {
        targetWalker = targetWalker.parentElement;
    }

    if (!targetWalker) {
        return;
    }

    //get the index of this walker so we can send them a request later
    const parent = targetWalker.parentNode;
    selectedWalkerIndex = Array.prototype.indexOf.call(parent.children, targetWalker);

    savedWalkers = document.querySelector("#walker-container");
    savedWalkers.remove();

    //get walker's data
    const walkerPic = targetWalker.children[0].src;
    targetWalker = targetWalker.children[1];
    const walkerName = targetWalker.children[0].innerText;
    const walkerRating = targetWalker.children[1].children[1].innerText;
    const walkerRatingStars = targetWalker.children[1].children[0].innerText;

    //box for the popup
    selectWalkerPopup = document.createElement("div");
    selectWalkerPopup.classList.add("walkerPopup");

    //add walker's picture
    const walkerImage = document.createElement("img");
    walkerImage.classList.add("walker-popup-image");
    walkerImage.src = walkerPic;
    selectWalkerPopup.appendChild(walkerImage);

    //add walker's name
    const walkerNameSpan = document.createElement("span");
    walkerNameSpan.classList.add("walker-popup-name");
    walkerNameSpan.innerText = walkerName;
    selectWalkerPopup.appendChild(walkerNameSpan);

    //add walker's rating
    const walkerRatingDisplay = document.createElement("div");

    const walkerRatingStarsSpan = document.createElement("span");
    walkerRatingStarsSpan.classList.add("walker-popup-stars");
    walkerRatingStarsSpan.innerText = walkerRatingStars;

    const walkerRatingNumberSpan = document.createElement("span");
    walkerRatingNumberSpan.classList.add("walker-popup-rating");
    walkerRatingNumberSpan.innerText = walkerRating;

    walkerRatingDisplay.appendChild(walkerRatingStarsSpan);
    walkerRatingDisplay.appendChild(walkerRatingNumberSpan);
    selectWalkerPopup.appendChild(walkerRatingDisplay);

    confirmationDiv = document.createElement("div");
    confirmationDiv.classList.add("confirmation-div")
    selectWalkerPopup.appendChild(confirmationDiv);

    const confirmationMessage = document.createElement("p");
    confirmationMessage.classList.add("popup-confirmation");
    confirmationMessage.innerText = "Hire this walker?"
    confirmationDiv.appendChild(confirmationMessage);

    /* add buttons for confirmation */
    const buttonsDiv = document.createElement("div");

    const yesButton = document.createElement("button");
    yesButton.classList.add("yes-button");
    yesButton.innerText = "Yes";

    const noButton = document.createElement("button");
    noButton.classList.add("no-button");
    noButton.innerText = "No";

    noButton.addEventListener("click", removePopup);
    yesButton.addEventListener("click", requestDetails)

    buttonsDiv.appendChild(yesButton);
    buttonsDiv.appendChild(noButton);

    confirmationDiv.appendChild(buttonsDiv);

    //add box as child for area
    const walkerArea = document.querySelector("#right-pane-body");
    walkerArea.appendChild(selectWalkerPopup);

}

function requestDetails(e) {
    e.preventDefault();

    //we create a box requesting additional details on how to pick up the dog
    const detailsRequest = document.createElement("div");
    detailsRequest.classList.add("confirmation-div")

    //prompt text
    const detailsMessage = document.createElement("p");
    detailsMessage.innerText = "Please enter pickup instructions:";
    detailsRequest.appendChild(detailsMessage);

    const detailsBox = document.createElement("textarea");
    detailsBox.classList.add("detailsBox");
    detailsBox.placeholder = "e.g. My address is 123 Main St. The key is under the flowerpot. Please put it back when you're done."
    detailsRequest.appendChild(detailsBox);

    const newButtonsDiv = document.createElement("div");
    detailsRequest.appendChild(newButtonsDiv);

    const confirmButton = document.createElement("button");
    confirmButton.classList.add("yes-button");
    confirmButton.innerText = "Confirm";
    newButtonsDiv.appendChild(confirmButton);

    const cancelButton = document.createElement("button");
    cancelButton.classList.add("no-button");
    cancelButton.innerText = "Cancel";
    newButtonsDiv.appendChild(cancelButton);

    confirmationDiv.before(detailsRequest);
    confirmationDiv.remove();
    confirmationDiv = detailsRequest;

    //add in event listeners
    cancelButton.addEventListener("click", removePopup);
    confirmButton.addEventListener("click", submitWalkRequest);
}

function submitWalkRequest(e) {
    e.preventDefault();

    //make sure a dog is selected
    if (selectedDogIndex === null) {
        alert("Please select a dog to be walked!");
        return;
    }

    const detailsBox = document.querySelector(".detailsBox");

    //submit the walk request to the server here
    const pickupInstructions = detailsBox.value;
    const duration = walkLengthSlider.value;
    const userId = userData._id;
    const walkerId = availableWalkers[selectedWalkerIndex]._id;
    const dogId = userData.userDogs[selectedDogIndex]._id;
    const selectedWalkNeeds = [];
    const location = { x: xCoordinate, y: yCoordinate };
    Array.prototype.forEach.call(walkNeeds.children, (child, index) => {
        if (child.style.backgroundColor === "green") {
            selectedWalkNeeds.push(child.innerText);
        }
    });

    //submit request to server
    const url = '/walk';
    const requestBody = {
        userId,
        dogId,
        walkerId,
        pickupInstructions,
        duration,
        walkNeeds : selectedWalkNeeds,
        location
    }

    const request = new Request(url, {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Content-Type': 'application/json'
        }
    });

    //replace the confirmation requests with a message telling user to wait
    const requestingDiv = document.createElement("div");
    requestingDiv.classList.add("confirmation-div");

    statusMessage = document.createElement("p");
    statusMessage.innerText = "Requesting a walk...";

    requestingDiv.appendChild(statusMessage);

    confirmationDiv.before(requestingDiv);

    confirmationDiv.remove();
    confirmationDiv = requestingDiv;

    walkRequested = true;

    fetch(request).then((res) => {
        if (res.status === 200) {
            
            //TODO: add a cancel button
            setTimeout(waitForResponse, 1000);
            
        }
        else {
            alert("something went wrong");
            console.log(res.status);
        }
    }).catch((error) => {
        console.log(error);
    })

    //this string of calls simulates communicating with the server
    //setTimeout(waiting, 1000)
}

/* the below string of function calls simulates talking to the server */
function waitForResponse() {
    const url = '/walk';
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            return Promise.reject();
        }
    }).then((json) => {
        if (json.length > 0 && json[0].accepted) {
            walkAccepted();
        }
        else {
            statusMessage.innerText = "Waiting...";
            setTimeout(waitForResponse, 1000);
        }
    }).catch((error) => {
        console.log(error);
    })
    
}

function walkAccepted() {
    statusMessage.innerText = "Walk accepted!";
    setTimeout(redirect, 1000);
}

function redirect() {
    window.location.href = 'userWalkStatus.html';
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

function showPendingWalk(walk) {
    const dogId = walk.dogId;
    const selectedWalkNeeds = walk.walkNeeds;
    const walkerId = walk.walkerId;

    //toggle selected dog
    const userDogs = userData.userDogs;
    for (let i = 0; i < userDogs.length; i++) {
        if (userDogs[i]._id == dogId) {
            selectedDogIndex = i;
            selectedDog = document.querySelector('#dog-container').children[i];
            selectedDog.className = "dogListSel"
            break;
        }
    }

    //toggle selected needs
    for (let i = 0; i < walkNeeds.children.length; i++) {
        if (selectedWalkNeeds.includes(walkNeeds.children[i].innerText)) {
            walkNeeds.children[i].style.backgroundColor = "green";
            walkNeeds.children[i].style.color = "white";

            //update number of needs for pricing
            numWalkNeeds++;
        }
    }

    updateCostEstimate();

    //get the walker's data and display it
    const url = '/walker/' + walkerId;
    fetch(url).then((res) => {
        if (res.status === 200) {
            return res.json();
        }
        else {
            console.log("Error " + res.status + ": Could not get user data");
            return Promise.reject(res.status);
        }
    }).then((json) => {
        let walkerPic;
        if (json.pictureURL) {
            walkerPic = json.pictureURL;
        }
        else {
            walkerPic = "images/defaultprofile.jpg";
        }
        const walkerName = json.firstName + " " + json.lastName;
        const walkerRating = average(json.ratings).toString(10);
        const walkerRatingStars = "\u2605";

        //box for the popup
        selectWalkerPopup = document.createElement("div");
        selectWalkerPopup.classList.add("walkerPopup");
        

        const walkerArea = document.querySelector("#right-pane-body");
        walkerArea.appendChild(selectWalkerPopup);

        //add walker's picture
        const walkerImage = document.createElement("img");
        walkerImage.classList.add("walker-popup-image");
        walkerImage.src = walkerPic;
        selectWalkerPopup.appendChild(walkerImage);

        //add walker's name
        const walkerNameSpan = document.createElement("span");
        walkerNameSpan.classList.add("walker-popup-name");
        walkerNameSpan.innerText = walkerName;
        selectWalkerPopup.appendChild(walkerNameSpan);

        //add walker's rating
        const walkerRatingDisplay = document.createElement("div");

        const walkerRatingStarsSpan = document.createElement("span");
        walkerRatingStarsSpan.classList.add("walker-popup-stars");
        walkerRatingStarsSpan.innerText = walkerRatingStars;

        const walkerRatingNumberSpan = document.createElement("span");
        walkerRatingNumberSpan.classList.add("walker-popup-rating");
        walkerRatingNumberSpan.innerText = walkerRating;

        walkerRatingDisplay.appendChild(walkerRatingStarsSpan);
        walkerRatingDisplay.appendChild(walkerRatingNumberSpan);
        selectWalkerPopup.appendChild(walkerRatingDisplay);
        
        const requestingDiv = document.createElement("div");
        requestingDiv.classList.add("confirmation-div");
        selectWalkerPopup.appendChild(requestingDiv);

        statusMessage = document.createElement("p");
        statusMessage.innerText = "Requesting a walk...";

        requestingDiv.appendChild(statusMessage);
        
        setTimeout(waitForResponse, 1000);

    }).catch((error) => {
        console.log(error);
    });
}