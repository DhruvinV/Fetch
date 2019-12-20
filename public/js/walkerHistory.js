"use strict";

// Initialize the page
window.addEventListener("load", initializePage);
function helperforWalker(url) {
  const name = [];
  fetch(url).then((res) => {
    if (res.status === 200) {
        return res.json();
    }
    else {
        console.log("Error " + res.status + ": Could not get user data");
        return Promise.reject(res.status);
    }
  }).then((walker) => {
    const fname = walker.firstName;
    const lname = walker.lastName;
    name.push(fname, lname);
    console.log(name)
    return name;

    // walkerName.innerText = fname + " " lname;
  }).catch((error) => {
    if (error === 404) {
        alert("Session expired! Please log in again");
        window.location.href = "login.html";
    }
    else {
        console.log("????");
    }
  });
}

function initializePage(e) {
  // first find the user
  const url = '/walker';

  fetch(url).then((res) => {
      if (res.status === 200) {
          return res.json();
      }
      else {
          console.log("Error " + res.status + ": Could not get walker data");
          return Promise.reject(res.status);
      }
  }).then((json) => {
    const walkUrl = '/allwalks';

    fetch(walkUrl).then((res) => {
      if (res.status === 200) {
        return res.json();
      }
      else {
        console.log("Error " + res.status + ": Could not get walk data");
        return Promise.reject(res.status);
      }
    }).then((walks) => {
      // got all walks for user, update the view
      $.each(walks, function (index, value) {

        const doc = document.getElementById("main");
        const container = document.createElement("div");
        container.className = "container-fluid";
        doc.appendChild(container);

        const walkHistory = document.createElement("div");
        walkHistory.className = "col-md-12";
        walkHistory.id = "walkHistory";
        container.appendChild(walkHistory);

        const walkerName = document.createElement("p");
        walkerName.className = "walkerName";
        walkerName.innerText = String(value.userId) + "*" + String(value.dogId)


        const walkDate = document.createElement("span");
        walkDate.id = "walkDate";
        walkDate.innerText = new Date(value.startTime).toLocaleDateString();
        walkerName.appendChild(walkDate);
        walkHistory.appendChild(walkerName);

        const from = document.createElement("p");
        from.className = "from";
        console.log(value.locations);
        from.innerHTML = "<span class='fromcircle'></span>" + formatLocations(value.locations);
        walkHistory.appendChild(from);

        const row = document.createElement("div");
        row.className = "row justify-content-md-center";

        const rating = document.createElement("div");
        rating.className = "col-3";
        const ratingtxt = document.createElement("p");
        ratingtxt.id = "rating";
        ratingtxt.innerText = "Walk Rating";
        rating.appendChild(ratingtxt);
        const ratingtxt2 = document.createElement("p");
        ratingtxt2.innerText = value.walkerRating + "\u2605";
        rating.appendChild(ratingtxt2);
        row.appendChild(rating);

        const duration = document.createElement("div");
        duration.className = "col-3";
        const durationtxt = document.createElement("p");
        durationtxt.id = "dur"
        durationtxt.innerText = "Duration"
        duration.appendChild(durationtxt);
        const durationtxt2 = document.createElement("p");
        durationtxt2.innerText = value.duration + " minutes";
        duration.appendChild(durationtxt2);
        row.appendChild(duration);

        const price = document.createElement("div");
        price.className = "col-3";
        const pricetxt = document.createElement("p");
        pricetxt.id = "price"
        pricetxt.innerText = "Walk Price"
        price.appendChild(pricetxt);
        const pricetxt2 = document.createElement("p");
        pricetxt2.innerText = "$" + value.price.toFixed(2);
        price.appendChild(pricetxt2);
        row.appendChild(price);

        walkHistory.appendChild(row);
      });
      initHelper();
      }).catch((error) => {
        if (error === 404) {
            alert("Session expired! Please log in again");
            window.location.href = "login.html";
        }
        else {
            console.log("????");
        }
      })
    }).catch((error) => {
      if (error === 404) {
          alert("Session expired! Please log in again");
          window.location.href = "login.html";
      }
      else {
          console.log("????");
      }
    })
}

// helper function to get name for each dog
function initHelper(){
  const walkerName = document.getElementsByClassName("walkerName");

  for (let i=0; i < walkerName.length; i++){
    const walkArray = walkerName[i].innerHTML.split("<span");
    const doguser = walkArray[0].split("*");

    const userurl = '/user/' + doguser[0];

    fetch(userurl).then((res) => {
      if (res.status === 200) {
          return res.json();
      }
      else {
          console.log("Error " + res.status + ": Could not get user data");
          return Promise.reject(res.status);
      }
    }).then((user) => {
      for (let k=0; k < (user.userDogs).length; k++) {
        if (user.userDogs[k]._id == doguser[1]){
          walkerName[i].innerHTML =  user.userDogs[k].dogName + "<span" + walkArray[1];
        }
      }
    }).catch((error) => {
      if (error === 404) {
          alert("Session expired! Please log in again");
          window.location.href = "login.html";
      }
      else {
          console.log("????");
      }
    })
  }
}

function formatLocations(locationArray) {
  let string = "";
  if (locationArray.length > 0) {
    string = "(" + locationArray[0].x + ", " + locationArray[0].y + ")";
  }
  for (let i = 1; i < locationArray.length; i++) {
    string += " -> (" + locationArray[i].x + ", " + locationArray[i].y + ")";
  }
  return string + " ";
}
