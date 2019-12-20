"use strict";
class User {
    constructor(name, picture, rating, description) {
        this.name = name;
        this.picture = picture;
        this.rating = rating;
        this.description = description;
    }
}

class WalkRequest {
  constructor(xCoord, yCoord, length, needs, price){
    this.x = xCoord
    this.y = yCoord
    this.length = length
    this.needs = needs
    this.price = price
  }
}

//default things for when the dog doesn't have these set
const defaultDescription = "I'm a doggo! Walk me!!";
const defaultPicture = "images/defaultdog.jpg";

const searchButton = document.querySelector("#searchForWalkButton");
let acceptButton = null;

const map = document.getElementById("map");

//storage for server call results
let walkRequest = null; //incoming walk request
let doggo = null; //the doggo with an incoming walk request

/*************************
 * Page initialization
 *************************/
window.addEventListener("load", getInfo);

function getInfo(e) {
  const url = '/walker';
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

    if (json.active) { //user is already active
      searchButton.addEventListener('click', setInactive);
      searchButton.innerText = "Searching... Click to cancel";
    }
    else { //user is not active
      searchButton.addEventListener('click', setActive);
      searchButton.innerText = "Find Walk";
    }
  }).catch((error) => {
    console.log(error);
  });

  checkForRequests();
}

/**********************
* Walker status toggle
*********************/
function setActive(e) {
  e.preventDefault();

  if (walkRequest) {
    return; //we do not allow the rejection of work here!!
  }
  
  const url = "/walker/active";
  const requestBody = {
    active: true
  };

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
      searchButton.innerText = "Searching... Click to cancel";
      searchButton.removeEventListener("click", setActive);
      searchButton.addEventListener("click", setInactive);
    }
  })
}

function setInactive(e) {
  e.preventDefault();

  const url = "/walker/active";
  const requestBody = {
    active: false
  };

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
      searchButton.innerText = "Find Walk";
      searchButton.removeEventListener("click", setInactive);
      searchButton.addEventListener("click", setActive);
    }
  })
}

/*******************************
 * Poll server for walk requests
 *******************************/

function checkForRequests() {
  const url = '/walk';
  fetch(url).then((res) => {
    if (res.status === 200) {
      return res.json();
    }
    else {
      ; //above will catch this
    }
  }).then((json) => {
    if (json.length > 0) {
      walkRequest = json[0];
      if (walkRequest.accepted) {
        //walker already accepted this request - go to the status page
        window.location.href = "walkerWalkStatus.html";
      }
      walkFound(walkRequest);
    }
    else {
      setTimeout(checkForRequests, 1000); //check again for a request in 1s
    }
  }).catch((error) => {
    console.log(error);
  });
}

/*************************
 * Display a walk request
 ************************/

let marker = null; //marker on map to display walk request location

function walkFound(walkRequest) {
  const markerRadius = 10;
  const xCoordinate = walkRequest.locations[0].x;
  const yCoordinate = walkRequest.locations[0].y;

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

  //get the dog's info
  const url = '/dogs/' + walkRequest.userId;

  fetch(url).then((res) => {
    if (res.status === 200) {
      return res.json();
    }
    else {
      return Promise.reject(res.status);
    }
  }).then((json) => {
    //find the correct doggo
    doggo = json.filter((dog) => dog._id == walkRequest.dogId)[0];
    console.log(doggo, walkRequest);
    fillWalkInfo(doggo, walkRequest)
    //TODO: set inactive
    searchButton.innerText = "Find Walk"
  }).catch((error) => {
    console.log(error);
  });
}

function fillWalkInfo(dog, request){
  const info = document.getElementById("dog-info");
  while(info.firstChild){
    info.removeChild(info.firstChild) // remove all child elements
  }
  const pic = document.createElement("img")
  pic.src = dog.pictureURL || defaultPicture;
  pic.className = "user-pic"
  info.appendChild(pic)

  const bio = document.createElement("div")
  bio.className = "user-bio"

  const name = document.createElement("span")
  const nameTxt = document.createTextNode(dog.dogName)
  name.className = "user-name"
  name.appendChild(nameTxt)
  bio.appendChild(name)

  const rating = document.createElement("div")
  rating.className = "rating"

  const rating_stars = document.createElement("span")
  const starTxt = document.createTextNode("★")
  rating_stars.className = "rating-stars"
  rating_stars.appendChild(starTxt)
  rating.appendChild(rating_stars)

  const rating_number = document.createElement("span")
  const number = document.createTextNode(average(dog.ratings))
  rating_number.className = "rating-number"
  rating_number.appendChild(number)
  rating.appendChild(rating_number)

  bio.appendChild(rating)

  const desc = document.createElement("p")
  const desc_txt = document.createTextNode((dog.description || defaultDescription))
  desc.className = "user-description"
  desc.appendChild(desc_txt)
  bio.appendChild(desc_txt)
  info.appendChild(bio)

  const pickupInstructionsDiv = document.getElementById("pickup-instructions");
  while (pickupInstructionsDiv.firstChild) {
    pickupInstructionsDiv.removeChild(pickupInstructionsDiv.firstChild); //remove all children
  }
  const pickupLabel = document.createElement("span");
  pickupLabel.classList.add("label");
  pickupLabel.innerText = "Pickup instructions";
  pickupInstructionsDiv.appendChild(pickupLabel);

  const pickupText = document.createElement("div");
  pickupText.innerText = request.pickupInstructions;
  pickupText.classList.add("pickup-instructions");
  pickupInstructionsDiv.appendChild(pickupText);

  const walkLenDiv = document.getElementById("walk-length")
  while(walkLenDiv.firstChild){
    walkLenDiv.removeChild(walkLenDiv.firstChild) // remove all child elements
  }
  const walkLenLabel = document.createElement("span")
  const walkLenTxt = document.createTextNode("Walk Length")
  walkLenLabel.className = "label"
  walkLenLabel.appendChild(walkLenTxt)

  const walkLenNumber = document.createElement("span")
  walkLenNumber.className = "walk-length-number"
  const walkLenNumberTxt = document.createTextNode(request.duration.toString() + "min")
  walkLenNumber.appendChild(walkLenNumberTxt)

  walkLenDiv.appendChild(walkLenLabel)
  walkLenDiv.appendChild(walkLenNumber)

  const walkNeedsDiv = document.getElementById("walk-needs")
  while(walkNeedsDiv.firstChild){
    walkNeedsDiv.removeChild(walkNeedsDiv.firstChild) // remove all child elements
  }

  const walkNeedsLabel = document.createElement("span")
  const walkNeedsTxt = document.createTextNode("Walk Needs")
  walkNeedsLabel.className = "label"
  walkNeedsLabel.appendChild(walkNeedsTxt)
  walkNeedsDiv.appendChild(walkNeedsLabel)

  const walkNeedsContainer = document.createElement("ul")
  walkNeedsContainer.id = "walk-needs-container"

  var newNeed;
  var newNeedTxt;
  request.walkNeeds.forEach(function(item, index){
    newNeed = document.createElement("li")
    newNeed.className = "walk-need"
    newNeedTxt = document.createTextNode(item)
    newNeed.appendChild(newNeedTxt)
    walkNeedsContainer.appendChild(newNeed)
    });

  walkNeedsDiv.appendChild(walkNeedsContainer)

  const priceEstDiv = document.getElementById("price-estimate")
  while(priceEstDiv.firstChild){
    priceEstDiv.removeChild(priceEstDiv.firstChild) // remove all child elements
  }
  const priceEstLabel = document.createElement("span")
  priceEstLabel.className = "label"
  const priceEstTxt = document.createTextNode("Estimated earnings")
  priceEstLabel.appendChild(priceEstTxt)
  priceEstDiv.appendChild(priceEstLabel)

  const priceEst = document.createElement("span")
  const price = document.createTextNode("$" + request.price.toString())
  priceEst.id = "price"
  priceEst.appendChild(price)
  priceEstDiv.appendChild(priceEst)

  if(!acceptButton){
    acceptButton = document.createElement("button")
    acceptButton.id = "acceptJobButton"
    const acceptButtonTxt = document.createTextNode("Start Walk")
    acceptButton.appendChild(acceptButtonTxt)
    acceptButton.addEventListener('click', acceptWalk)
    document.getElementById("walk-container").appendChild(acceptButton)
  }
}

function acceptWalk(e) {
  e.preventDefault();

  //tell the server we accept the walk
  const url = '/walk/' + walkRequest._id;
  const requestBody = { accepted: true };

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
      acceptButton.innerText = "Walk accepted!";
      setTimeout(redirect);
    }
    else {
      return Promise.reject();
    }
  }).catch((error) => {
    console.log(error);
  })
}

function redirect() {
    window.location.href = 'walkerWalkStatus.html';
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