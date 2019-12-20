"use strict";

// Initialize the page
window.addEventListener("load", initializePage);
function initializePage(e) {
    //fill the boxes with the user's info
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
        console.log(json);
        document.querySelector("#fname").innerText = json.firstName;
        document.querySelector("#lname").innerText = json.lastName;
        document.querySelector("#emailAddress").innerText = json.emailAddress;
        document.querySelector("#address").innerText = json.homeAddress + ", " + json.city + ", " + json.province;
        document.querySelector("#joinDate").innerText = niceDate(new Date(json.dateJoined));
        // let joinDate = new Date(json.dateJoined);
        // console.log(joinDate);
        // console.log(niceDate(joinDate));

        //check if the user has uploaded a picture
        const id = json._id;
        fetch("/images/uploaded/"+id+".jpg").then((res) => {
            if (res.status === 200) {
                document.querySelector("#media-object").src = "images/uploaded/" + id + ".jpg";
            }
        }).catch((error) => {
            //no image uploaded, but this is okay
        })

        document.querySelector("#user-description").innerText = json.description || "No description set!";

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