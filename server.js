/* Server side code */

'use strict';

const express = require('express')
// starting the express server
const app = express();

// mongoose and mongo connection
const { mongoose } = require('./db/mongoose')

// import the mongoose models
const { User } = require('./models/user')
const { Dog } = require('./models/dogs')
const { Walker } = require('./models/walker')
const { Walk } = require('./models/walk')
const { Report } = require('./models/report')

// to validate object IDs
const { ObjectID } = require('mongodb')

// hash for passwords
const bcrypt = require('bcryptjs')

// handle file (image) uploads
const http = require("http");
const path = require("path");
const fs = require("fs");
const multer = require('multer');
const upload = multer({
    dest: "./public/images/uploaded"
});

// body-parser: middleware for parsing HTTP JSON body into a usable object
const bodyParser = require('body-parser')
app.use(bodyParser.json())

// express-session for managing user sessions
const session = require('express-session')
app.use(bodyParser.urlencoded({ extended: true }));

//enable CORS to bypass security (bad, baaaad)
let allowCrossDomain = function(req, res, next) {
    res.header('Access-Control-Allow-Origin', "*");
    res.header('Access-Control-Allow-Headers', "*");
    next();
}
app.use(allowCrossDomain);

/*** Session handling **************************************/
// Create a session cookie
app.use(session({
    secret: 'supersecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        expires: 600000, //60000 = 1 minute
        httpOnly: true
    }
}));

// Our own express middleware to check for
// an active user on the session cookie (indicating a logged in user.)
const sessionChecker = (req, res, next) => {

    if (req.session.user) {
        if (req.session.userType === "user") {
            res.redirect('/userProfile.html');
        }
        else if (req.session.userType === "walker") {
            res.redirect('/walkerProfile.html');
        }
        else if (req.session.userType === "admin") {
            res.redirect('/adminpage.html');
        }
    } else {
        next(); // next() moves on to the route.
    }
};

/*** Webpage routes below **********************************/

// route for root
app.get('/', sessionChecker, (req, res) => {
	res.sendFile(__dirname + '/public/index.html')
})

//redirect if user tries to login again while already logged in
app.get('/login.html', sessionChecker, (req,res) => {
    res.sendFile(__dirname + "/public/login.html");
})

// static directories
app.use(express.static(__dirname + '/public'))

/*********************************************************/

/*** API Routes below ************************************/

/** Login routes **/
/* example bodies
{
	"username": "doglover21",
	"password": "password",
	"userType": "user"
}
{
	"username": "john123",
	"password": "password123",
	"userType": "walker"
}
{
	"username": "admin",
	"password": "admin",
	"userType": "walker" //this field doesn't matter - it's not checked
}
*/
app.post('/login', (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    const userType = req.body.userType;

    if (!username || !password ) {
        res.redirect('/login.html');
        return;
    }

    else if (username === "admin" && password === "admin") {
        //hardcoded credentials, hurrah!
        req.session.user = "admin";
        req.session.userType = "admin";
        res.redirect('/adminpage.html')
        return;
    }

    else if (!userType) {
        res.redirect('/login.html');
        return;
    }

    else if (userType === "user") {
        User.findOne({username: username}).then((user) => {
            if (!user) {
                res.status(200).redirect("/login.html"); //invalid user
            }
            else {
                //compare password
                bcrypt.compare(password, user.passwordHash, (error, result) => {
                    if (error) {
                        res.status(400).send(error); //bcrypt error
                    }
                    else if (result) {
                        req.session.user = user._id;
                        req.session.userType = "user";
                        res.redirect('/userProfile.html');
                    }
                    else {
                        res.status(200).redirect("/login.html"); //invalid password
                    }
                })
            }
        }).catch((error) => {
            res.status(400).send('server error');
        });
    }
    else if (userType === "walker") {
        Walker.findOne({username: username}).then((walker) => {
            if (!walker) {
                 res.status(200).redirect("/login.html"); //invalid user
            }
            else {
                //compare password
                bcrypt.compare(password, walker.passwordHash, (error, result) => {
                    if (error) {
                        res.status(400).send(); //bcrypt error
                    }
                    else if (result) {
                        req.session.user = walker._id;
                        req.session.userType = "walker";
                        res.redirect('/walkerProfile.html');
                    }
                    else {
                         res.status(200).redirect("/login.html"); //invalid password
                    }
                })
            }
        }).catch((error) => {
            res.status(400).send('server error');
        });
    }
    else {
        res.status(400).send('no userType set');
    }
});

/** User resource routes **/
// a POST route to *create* a user
/* example body
{
	"username": "doglover21",
	"password" : "password",
	"firstName": "Jane",
	"lastName": "Doe",
	"homeAddress": "123 Baker St",
	"emailAddress": "me@jane.com"
}
*/
app.post('/user', (req, res) => {
    if (req.body.username && req.body.password) {
        //check if username already taken
        User.findOne({username: req.body.username}).then((user) => {
            if (req.body.username === "admin") {
                res.status(403).send("Cannot use username 'admin'");
            }
            else if (user) {
                res.status(403).send("Username taken");
            }
            else {
                bcrypt.genSalt(10, (err, salt) => {
                    // password is hashed with the salt
                    bcrypt.hash(req.body.password, salt, (err, hash) => {
                        /*
                        //to compare to another password
                        bcrypt.compare("password", hash, (error, res) => {
                            console.log(error, res);
                        });*/

                        const user = new User({
                            username: req.body.username,
                            passwordHash: hash,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            homeAddress: req.body.homeAddress,
                            city: req.body.city,
                            province: req.body.province,
                            phoneNumber: req.body.phoneNumber,
                            emailAddress: req.body.emailAddress,
                            dateJoined: new Date(),
                            userDogs: []
                        });
                        // console.log(user)
                        user.save().then((result) => {
                            res.status(200).send(result);
                        }, (error) => {
                            res.status(400).send(error);
                        })
                    });
                });
            }
        });
    }
    else {
        res.status(400).send("Bad request");
    }
});

app.post('/walker', (req, res) => {

    if (req.body.username && req.body.password) {
        //check if username already taken
        Walker.findOne({username: req.body.username}).then((walker) => {
            if (req.body.username === "admin") {
                res.status(403).send("Cannot use username 'admin'");
            }
            else if (walker) {
                res.status(403).send("Username taken");
            }
            else {
                bcrypt.genSalt(10, (err, salt) => {
                    // password is hashed with the salt
                    bcrypt.hash(req.body.password, salt, (err, hash) => {
                        const walker = new Walker({
                            username: req.body.username,
                            passwordHash: hash,
                            firstName: req.body.firstName,
                            lastName: req.body.lastName,
                            homeAddress: req.body.homeAddress,
                            city: req.body.city,
                            province: req.body.province,
                            phoneNumber: req.body.phoneNumber,
                            emailAddress: req.body.emailAddress,
                            dateJoined: new Date(),
                            languages: [],
                            qualifications: [],
                            ratings: []
                        });
                        walker.save().then((result) => {
                            console.log(walker)
                           res.status(200).send(result);
                        }, (error) => {
                            res.status(400).send(error);
                        })
                    });
                });
            }
        });
    }
    else {
        res.status(400).send("Bad request");
    }
});

/// Route for getting information for one user.
// GET /user/id
app.get('/user/:id', (req, res) => {
	const id = req.params.id;

	if (!ObjectID.isValid(id)) {
		res.status(404).send();
	}

	User.findById(id).then((user) => {
		if (!user) {
			res.status(404).send(); //could not find user
		} else {
			res.send(user);
		}
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

/// Route for getting information for the user logged in
// GET /user
app.get('/user', (req, res) => {
	const id = req.session.user;

	if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
	}

	User.findById(id).then((user) => {
		if (!user) {
			res.status(404).send(); //could not find user
		} else {
			res.send(user);
		}
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

/// Route for all users
// GET /allusers
app.get('/allusers', (req, res) => {
	User.find().then((users) => {
		res.send(users)
	}, (error) => {
		res.status(500).send(error) // server error
	}).catch((error) => {
		res.status(500).send()
	})
})

// Route to change a user's data
// Changes the data for the user logged in
app.patch('/user', (req, res) => {
    const id = req.session.user;

	if (!ObjectID.isValid(id)) {
        res.status(404).send();
        return;
    }
    else if (!req.body.currpwd) {
        res.status(401).send();
        return;
    }

    User.findById(id).then((user) => {
        if (!user) {
            res.status(404).send(); //could not find user
        }
        else {
            //check user password before making changes
            bcrypt.compare(req.body.currpwd, user.passwordHash, (error, result) => {
                if (error) {
                    res.status(400).send(error); //bcrypt error
                }
                else if (result) {
                    //update user
                    if (req.body.fname) {
                        user.firstName = req.body.fname;
                    }
                    if (req.body.lname) {
                        user.lastName = req.body.lname;
                    }
                    if (req.body.email) {
                        user.emailAddress = req.body.email;
                    }
                    if (req.body.adrs) {
                        user.homeAddress = req.body.adrs;
                    }
                    if (req.body.city) {
                        user.city = req.body.city;
                    }
                    if (req.body.prov) {
                        user.province = req.body.prov;
                    }
                    if (req.body.description) {
                        user.description = req.body.description;
                    }
                    if (req.body.newpwd) {
                        bcrypt.genSalt(10, (err, salt) => {
                            bcrypt.hash(req.body.newpwd, salt, (err, hash) => {
                                user.passwordHash = hash;

                                //asynchronous call waits on bcrypt result
                                //save the user here if the password changed
                                user.save().then((result) => {
                                    res.send(result);
                                }, (error) => {
                                    res.status(400).send(error);
                                })
                            });
                        });
                    }
                    else {
                        //save the user if their password didn't change
                        user.save().then((result) => {
                            res.send(result);
                        }, (error) => {
                            res.status(400).send(error);
                        })
                    }
                }
                else {
                    res.status(401).send(); //invalid password
                }
            })
        }
    }).catch((error) => {
        res.status(500).send(); //server error
    })
})

/// route to delete a user by ID
// restricted to admins
app.delete('/user/:id', (req, res) => {
    const id = req.params.id;

    if (req.session.user !== "admin") {
        res.status(403).send(); //unauthorized
        return;
    }
    // Validate id
	else if (!ObjectID.isValid(id)) {
		res.status(404).send();
    }
    User.findOneAndDelete({_id: id}).then((user) => {
        if (!user) {
            res.status(404).send();
        }
        else {
            res.send(user);
        }
    }).catch((error) => {
        res.status(500).send(); //server error, could not delete
    })
})

/// route to delete the currently logged in user
app.delete('/user', (req, res) => {
    const id = req.session.user;

    // Validate id
	if (!ObjectID.isValid(id)) {
		res.status(404).send();
    }
    User.findOneAndDelete({_id: id}).then((user) => {
        if (!user) {
            res.status(404).send();
        }
        else {
            res.send(user);
        }
    }).catch((error) => {
        res.status(500).send(); //server error, could not delete
    });

    // Remove the session; log out the user
	req.session.destroy((error) => {
		if (error) {
			; //hope that nothing goes wrong
		} else {
			res.redirect('/')
		}
	})
})

/** Dog resource routes **/

/// Route for adding dog to a user
// POST /dogs/userid
/* example body
{
	"dogName" : "Rufus",
	"weight" : 10
}
*/
app.post('/dogs/:userid', (req, res) => {
	// Add code here
	const id = req.params.userid;

	if (!ObjectID.isValid(id)) {
		res.status(404).send();
	}
	const dog = {
        dogName: req.body.dogName,
        needs: [], //fill this in dynamically first time dog requests a walk
        weight: req.body.weight,
        ratings: []
	};

	User.findById(id).then((user) => {
		if (!user) {
			res.status(404).send(); //could not find user
		} else {
			user.userDogs.push(dog);
			return user.save();
		}
	}).then((result) => {
		res.send(result);
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

/// Route for getting all of a user's dogs
// GET /dogs/userid
app.get('/dogs/:userid', (req, res) => {
	// Add code here
	const id = req.params.userid;

	if (!ObjectID.isValid(id)) {
		res.status(404).send();
	}

	User.findById(id).then((user) => {
		if (!user) {
			res.status(404).send(); //could not find user
		} else {
			res.send( user.userDogs );
		}
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

/// Route to edit a user's dog
// PATCH /dogs/userid
/* example body
{
	"dogName" : "Joplin",
    "weight" : 50
}
*/
app.patch('/dogs/:userid/:dogid', (req, res) => {
    const userId = req.params.userid;
    const dogId = req.params.dogid;

	if (!ObjectID.isValid(userId)) {
		res.status(404).send();
	}

	User.findById(userId).then((user) => {
		if (!user) {
			res.status(404).send(); //could not find user
        } 
        else {
            const dog = user.userDogs.id(dogId);
            if (req.body.dogName) {
                dog.dogName = req.body.dogName;
            }
            if (req.body.weight) {
                dog.weight = req.body.weight;
            }
            if (req.body.description) {
                dog.description = req.body.description;
            }
			return user.save();
		}
	}).then((result) => {
		res.send(result);
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

/** Walker resource routes **/

// a POST route to *create* a walker
/* example body
{
	"username": "john123",
	"password" : "password123",
	"firstName": "John",
	"lastName": "Smith",
	"homeAddress": "125 Baker St",
	"emailAddress": "john@smith.com"
}
*/
// Route for getting all active walkers
app.get('/walker/active', (req, res) => {
    const query = { active: true };

    Walker.find(query).then((walkers) => {
        res.send(walkers);
    }).catch((error) => {
        res.status(500).send(); //server error
        console.log(error);
    });
});


/// Route for getting information for one walker by id.
// GET /walker/id
app.get('/walker/:id', (req, res) => {
	// Add code here
	const id = req.params.id;

	if (!ObjectID.isValid(id)) {
		res.status(404).send();
	}

	Walker.findById(id).then((walker) => {
		if (!walker) {
			res.status(404).send(); //could not find user
		} else {
			res.send(walker);
		}
	}).catch((error) => {
		res.status(500).send(); //server error
	});
})

// route for editing a walker's information
app.patch('walker/:id', (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
        res.status(404).send()
    }

    Walker.findById(id).then((walker) => {
        if(!walker){
            res.status(404).send()
        } else {

            if (req.body.fname) {
                walker.firstName = req.body.fname;
            }
            if (req.body.lname) {
                walker.lastName = req.body.lname;
            }
            if (req.body.email) {
                walker.emailAddress = req.body.email;
            }
            if (req.body.adrs) {
                walker.homeAddress = req.body.adrs;
            }
            if (req.body.city) {
                walker.city = req.body.city;
            }
            if (req.body.prov) {
                walker.province = req.body.prov;
            }
            if (req.body.phone) {
                walker.phoneNumber = req.body.phone
            }
            if (req.body.languages) {
                walker.languages = req.body.languages
            }
            if (req.body.qual) {
                walker.qualifications = req.body.qual
            }
            if (req.body.ratings){
                walker.ratings = req.body.ratings
            }
            if (req.body.active != undefined) {
                walker.active = req.body.active
            }

            if (req.body.pwd) {
                bcrypt.genSalt(10, (err, salt) => {
                    // password is hashed with the salt

                    bcrypt.hash(req.body.password, salt, (err, hash) => {

                        // Change password
                        walker.passwordHash = hash
                    });
                });
            }

            walker.save().then((result) => {
                res.send(result);
            }, (error) => {
                res.status(400).send(error);
            })
        }
    })
})

// Route to update walker active/inactive status - does not need a password
app.patch('/walker/active', (req, res) => {
    const id = req.session.user;

    if (!ObjectID.isValid(id)) {
        res.status(404).send()
    }

    Walker.updateOne( //set walker as no longer active so they don't get a second walk request
        { _id: id },
        { $set: { active: req.body.active } },
        (err, success) => {
            if (err) {
                console.log(err);
            }
            else {
                res.status(200).send();
            }
        }
    );
})

// route for editing a walker's information
app.patch('/walker', (req, res) => {
    const id = req.session.user;

    if (!ObjectID.isValid(id)) {
        res.status(404).send()
    }

    Walker.findById(id).then((walker) => {
        if (!walker) {
            res.status(404).send(); //could not find user
        }
        else {
            //allow modification of active without a password
            if ( req.body.active != undefined) {
                Walker.updateOne( //set walker as no longer active so they don't get a second walk request
                    { _id: id },
                    { $set: { active: req.body.active } },
                    (err, success) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            ; //success
                        }
                    }
                );
            }
            //check user password before making changes
            bcrypt.compare(req.body.currpwd, walker.passwordHash, (error, result) => {
                if (error) {
                    res.status(400).send(error); //bcrypt error
                }
                else if (result) {
                    //update walker
                    if (req.body.fname) {
                        walker.firstName = req.body.fname;
                    }
                    if (req.body.lname) {
                        walker.lastName = req.body.lname;
                    }
                    if (req.body.email) {
                        walker.emailAddress = req.body.email;
                    }
                    if (req.body.adrs) {
                        walker.homeAddress = req.body.adrs;
                    }
                    if (req.body.city) {
                        walker.city = req.body.city;
                    }
                    if (req.body.prov) {
                        walker.province = req.body.prov;
                    }
                    if (req.body.phone) {
                        walker.phoneNumber = req.body.phone
                    }
                    if (req.body.languages) {
                        walker.languages = req.body.languages
                    }
                    if (req.body.qual) {
                        walker.qualifications = req.body.qual
                    }
                    if (req.body.ratings){
                        walker.ratings = req.body.ratings
                    }
                    if (req.body.active != undefined) {
                        walker.active = req.body.active
                    }
                    if (req.body.description) {
                        walker.description = req.body.description;
                    }
                    if (req.body.qualifications) {
                        walker.qualifications = req.body.qualifications;
                    }
                    if (req.body.languages) {
                        walker.languages = req.body.languages;
                    }
                    if (req.body.pwd) {
                        bcrypt.genSalt(10, (err, salt) => {
                            // password is hashed with the salt
        
                            bcrypt.hash(req.body.password, salt, (err, hash) => {
        
                                // Change password
                                walker.passwordHash = hash
                            });
                        });
                    }
                    else {
                        //save the user if their password didn't change
                        walker.save().then((result) => {
                            res.send(result);
                        }, (error) => {
                            res.status(400).send(error);
                        })
                    }
                }
                else {
                    res.status(401).send(); //invalid password
                }
            })
        }
    })
})

app.delete('/walker/:id', (req, res) => {
    const id = req.params.id

    //Validate Id
    if(!ObjectID.isValid(id)){
        res.status(404).send()
    }

    //Delete a walker by ID
    Walker.findByIdAndRemove(id).then((walker) => {
        if(!walker){
            res.status(404).send()
        } else [
            res.send(walker)
        ]
    }).catch((error) => {
        res.status(500).send() // Server error
    })
})

/// Route for getting information walker information

// Has two modes - if a query is given in the body, will execute the search and return results
//      otherwise, will return the currently logged in user if they are a walker
// GET /walker/id
app.get('/walker', (req, res) => {
    if (req.body.query) {
        const query = req.body.query;

        Walker.find(query).then((walkers) => {
            res.send(walkers);
        }).catch((error) => {
            res.status(500).send(); //server error
        });
    }
    else if (req.session.userType == "admin") {
        Walker.find().then((walkers) => {
            res.send(walkers)
        }, (error) => {
            res.status(500).send(error) // server error
        }).catch((error) => {
            res.status(500).send()
        })
    }
    else {
        const id = req.session.user;

        if (!ObjectID.isValid(id)) {
            res.status(404).send();
        }

        Walker.findById(id).then((walker) => {
            if (!walker) {
                res.status(404).send(); //could not find walker
            } else {
                res.send(walker);
            }
        }).catch((error) => {
            res.status(500).send(); //server error
        });
    }
})

/** Walk resource routes **/

/// Route for adding a walk for a user's dog and a walker
// POST /dogs/userid
/* example body
{
    "walkerId": "5ddf04dd765a2b0624face6c",
    "userId" : "5ddf0314d7048e253836ec22",
    "dogId" : "5ddf258ceae46928e0e903ac",
    "pickupInstructions" : "The key is under the flowerpot",
	"walkNeeds" : [ "hyper", "puppy" ],
    "duration" : 10,
    "location" : {"x" : 10, "y" : 20}
}
*/
app.post('/walk', (req, res) => {
	// Add code here
    const walkerId = req.body.walkerId;
    const userId = req.body.userId;
    const dogId = req.body.dogId;

	if (!ObjectID.isValid(walkerId) || !ObjectID.isValid(dogId)) {
        res.status(404).send();
        return;
    }

    User.findById(userId).then((user) => {
        if (!user) {
            res.status(400).send("Could not find user");
            return;
        }
        else {
            user.userDogs.id(dogId).needs = req.body.walkNeeds;
            user.save().then((result) => {
                ; //dog saved
            }, (error) => {
                res.status(500).send(); //server error
                return;
            });
        }
    }).catch((error) => {
        console.log(error);
    });

	const walk = new Walk({
        walkerId: walkerId,
        userId: userId,
        dogId: dogId,
        walkNeeds: req.body.walkNeeds,
        pickupInstructions: req.body.pickupInstructions,
        price: 8 + 2*parseInt(req.body.duration)/5 + 5*req.body.walkNeeds.length,
        duration: req.body.duration,
        notes: [],
        locations: [{x: req.body.location.x, y: req.body.location.y }]
    });

    walk.save().then((result) => {
        res.send(result);
    }, (error) => {
        res.status(400).send(error);
    })


})

// Route for getting information for a walk
app.get('/walk/:id', (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
		res.status(404).send();
	}

	Walk.findById(id).then((walk) => {
		if (!walk) {
			res.status(404).send(); //could not find walk
		} else {
			res.send(walk);
		}
	}).catch((error) => {
		res.status(500).send(); //server error
	});

})

/// Context-sensitive route for getting information for walk
// If query is supplied, will return results of query
// Else, will return (active) walks for which the user is involved in
app.get('/walk', (req, res) => {
    if (req.body.query) {
        const query = req.body.query;

        Walk.find(query).then((walk) => {
            res.send(walk);
        }).catch((error) => {
            res.status(500).send(); //server error
        });
    }

    else if (req.session.userType === "admin" ) { //user is admin
        Walk.find({}).then((walk) => {
            res.send(walk);
        }).catch((error) => {
            res.status(500).send(); //server error
        });
    }

    else {
        const id = req.session.user;

        if (!ObjectID.isValid(id)) {
            res.status(404).send();
        }

        if (req.session.userType === "walker" ) { //user is walker
            Walk.find({walkerId: id, dogRating: {$exists: false}}).then((walk) => {
                res.send(walk);
            }).catch((error) => {
                res.status(500).send(); //server error
            });
        }
        else if (req.session.userType === "user" ) { //user is owner
            Walk.find({userId: id, walkerRating: {$exists: false}}).then((walk) => {
                res.send(walk);
            }).catch((error) => {
                res.status(500).send(); //server error
            });
        }
    }
})


/// Route for all users
// GET /allusers
app.get('/allusers', (req, res) => {
	User.find().then((users) => {
		res.send(users)
	}, (error) => {
		res.status(500).send(error) // server error
	}).catch((error) => {
		res.status(500).send()
	})
})

//route for getting all walks for a user
app.get('/allwalks', (req, res) => {
    if (req.session.userType === "admin" ) { //user is admin
        Walk.find({}).then((walk) => {
            res.send(walk);
        }).catch((error) => {
            res.status(500).send(); //server error
        });
    }

    else {
        const id = req.session.user;

        if (!ObjectID.isValid(id)) {
            res.status(404).send();
        }

        if (req.session.userType === "walker" ) { //user is walker
            Walk.find({walkerId: id}).then((walk) => {
                res.send(walk);
            }).catch((error) => {
                res.status(500).send(); //server error
            });
        }
        else if (req.session.userType === "user" ) { //user is owner
            Walk.find({userId: id}).then((walk) => {
                res.send(walk);
            }).catch((error) => {
                res.status(500).send(); //server error
            });
        }
    }
})

// Route for changing properties of a walk
/* example bodies:
{
    "note": "Heading out",
    "accepted": true,
    "location": { "x": 20, "y": 20 }
}
{
    "dogRating": 5,
    "note": "We're back",
    "completed": true,
    "location": { "x": 10, "y": 10 }
}
{
    "walkerRating": 5
}
*/
app.patch('/walk/:id', (req, res) => {
    const id = req.params.id;

    if (!ObjectID.isValid(id)) {
		res.status(404).send()
	}

    /* security TODO for this part
        - only walkers should be able to update all fields except walkerRating
        - only users should be able to update walkerRating
        - price should be auto-updated based on duration and walk needs
    */

    //find the walk and update it
	Walk.findById(id).then((walk) => {
		if (!walk) {
            res.status(404).send(); //could not find walk
            return;
		} else {
            if (req.body.duration && !walk.completed) {  //disable duration changes of a done walk
                walk.duration = req.body.duration;
                walk.price = 8 * 2*walk.duration/5 + 5*walk.walkNeeds.length;
                walk.endTime = new Date(walk.startTime.getTime() + (parseInt(walk.duration) * 60000));
            }
            if (req.body.accepted) {
                if (walk.accepted) {
                    //walk is already started
                    res.status(422).send(); //invalid update
                    return;
                }
                else {
                    walk.startTime = new Date();
                    walk.accepted = true;
                    Walker.updateOne( //set walker as no longer active so they don't get a second walk request
                        { _id: walk.walkerId },
                        { $set: { active: false } },
                        (err, success) => {
                            if (err) {
                                console.log(err);
                            }
                            else {
                                ; //success
                            }
                        }
                    );
                    walk.endTime = new Date(walk.startTime.getTime() + (parseInt(walk.duration) * 60000));
                }
            }
            if (req.body.completed) {
                if (walk.completed) {
                    //walk is already ended
                    res.status(422).send(); //invalid update
                    return;
                }
                else {
                    walk.endTime = new Date();
                    walk.completed = true;
                    walk.duration = Math.round((((walk.endTime - walk.startTime) % 86400000) % 3600000) / 60000);
                    walk.price = 8 * 2*walk.duration/5 + 5*walk.walkNeeds.length;
                }
            }
            if (req.body.walkerRating && walk.completed) {
                //some security..
                if (req.session.user !== walk.userId) {
                    res.status(403).send();
                    return;
                }
                walk.walkerRating = req.body.walkerRating;
                if (walk.walkerRating != 5 && req.body.walkerComplaints) {
                    walk.walkerComplaints = req.body.walkerComplaints;
                }
                Walker.updateOne(
                    { _id: walk.walkerId },
                    { $push: { ratings: parseInt(req.body.walkerRating, 10)} },
                    (err, success) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            ; //success
                        }
                    }
                );
            }
            if (req.body.dogRating && walk.completed) {
                //some more security..
                if (req.session.user !== walk.walkerId) {
                    res.status(403).send();
                    return;
                }
                walk.dogRating = req.body.dogRating;
                if (walk.dogRating != 5 && req.body.dogComplaints) {
                    walk.dogComplaints = req.body.dogComplaints;
                }
                User.updateOne(
                    { "_id": walk.userId, "userDogs._id": walk.dogId },
                    {
                        "$push": {
                            "userDogs.$.ratings": parseInt(req.body.dogRating, 10)
                        }
                    },
                    (err, success) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            ; //success
                        }
                    }
                );
            }
            if (req.body.note) {
                walk.notes.push(req.body.note);
            }
            if (req.body.location) {
                walk.locations.push(req.body.location);
            }

            walk.save().then((result) => {
                res.send(result);
            }, (error) => {
                res.status(400).send(error);
            });
		}
	}).catch((error) => {
		res.status(500).send(error); //server error
	});
})

/// Route to create a report
/** Report resource routes **/
/* example body:
{
    "type" : "Unprofessional",
    "description" : "John put a clown costume on my dog. How dare he!",
    "walkerId" : "5ddf04dd765a2b0624face6c",
    "userId" : "5ddf0314d7048e253836ec22",
    "dogId" : "5ddf258ceae46928e0e903ac",
    "walkId" : "5de1d2987ed1b8360477f21c"
}
*/
app.post('/report', (req, res) => {
    const walkerId = req.body.walkerId;
    const userId = req.body.userId;
    const dogId = req.body.dogId;
    const walkId = req.body.walkId;
    const description = req.body.description;

    if (!ObjectID.isValid(walkerId) || !ObjectID.isValid(dogId) || !ObjectID.isValid(userId) || !ObjectID.isValid(walkId)) {
		res.status(404).send();
    }

    const report = new Report({
        type: req.body.type,
        description: description,
        walkerId: walkerId,
        userId: userId,
        dogId: dogId,
        walkId: walkId
    })


    report.save().then((result) => {
        res.send(result);
    }, (error) => {
        res.status(400).send();
    });
})

/// route to get all reports
app.get('/report', (req, res) => {
    if (req.session.user !== "admin") {
        res.status(403).send();
        return;
    }
    Report.find({}).then((reports) => {
        res.send({reports}); //send all reports
    }, (error) => {
        res.status(500).send(error); //server error
    })
})

// Get report by id
app.get('/report/:id', (req, res) => {
    const id = req.params.id
    if(!ObjectID.isValid(id)){
        res.status(404).send()
    }

    Report.findById(id).then((report) => {
        if(!report){
            res.status(404).send()
        } else {
            res.send(report)
        }
    }).catch((error) => {
        res.status(500).send()
    })
})

app.patch('/report/:id', (req, res) => {
    const id = req.params.id
    if(!ObjectID.isValid(id)){
        res.status(404).send()
    }

    Report.findById(id).then((report) => {
        if(req.body.type){
            report.type = req.body.type
        }
        if(req.body.walkerId){
            report.walkerId = req.body.walkerId
        }
        if(req.body.userId){
            report.userId = req.body.userId
        }
        if(req.body.dogId){
            report.dogId = req.body.dogId
        }
        if(req.body.walkId){
            report.walkId = req.body.walkId
        }
        if(req.body.status){
            report.status = req.body.status
        }
        if(req.body.action){
            report.action = req.body.action
        }

        report.save().then((result) => {
            res.send(result);
        }, (error) => {
            res.status(400).send(error);
        });
    }).catch((error) => {
		res.status(500).send(); //server error
	});
})

app.delete('/report/:id', (req, res) => {
    const id = req.params.id
    if(!ObjectID.isValid(id)){
        res.status(404).send()
    }

    Report.findByIdAndRemove(id).then((report) => {
        if(!report){
            res.status(404).send()
        } else {
            res.send(report);
        }
    }).catch((error) => {
        res.status(500).send()
    })
})

/** Other routes **/

/// Route for uploading an image for a dog's profile picture
/// Image will be stored as /public/images/uploaded/id.{jpg.png}
// POST /upload/userid/dogid/
app.post('/upload/:userid/:dogid', upload.single("file" /* name of file element in form */),
(req, res) => {
    const userId = req.params.userid;
    const dogId = req.params.dogid;

    if (!ObjectID.isValid(userId) || !ObjectID.isValid(dogId)) {
		res.status(404).send("Cannot find entity with that id");
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./public/images/uploaded/", dogId + ext);

    fs.rename(tempPath, targetPath, err => {
        if (err) res.status(500).send(err);
        else {

            User.findById(userId).then((user) => {
                if (!user) {
                    res.status(404).send(); //could not find user
                } 
                else {
                    const dog = user.userDogs.id(dogId);
                    dog.pictureURL = "images/uploaded/" + dogId + ".jpg"
                    return user.save();
                }
            }).then((result) => {
                res.status(200).end("File uploaded!");
            }).catch((error) => {
                res.status(500).send(); //server error
            });
            
        }
    });
})

/// Route for uploading an image for a profile picture for the currently logged in user
/// Image will be stored as /public/images/uploaded/id.{jpg.png}
// POST /upload
app.post('/upload', upload.single("file" /* name of file element in form */),
(req, res) => {
    const id = req.session.user;
    if (!ObjectID.isValid(id)) {
		res.status(404).send("Cannot find entity with that id");
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    const tempPath = req.file.path;
    const targetPath = path.join(__dirname, "./public/images/uploaded/", id + ext);

    fs.rename(tempPath, targetPath, err => {
        if (err) res.status(500).send(err);
        else {
            if (req.session.userType === "user") {
                User.updateOne(
                    { _id: id },
                    { $set: { pictureURL: "images/uploaded/" + id + ".jpg"} },
                    (err, success) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            //success
                            res.redirect("userProfileEdit.html");
                        }
                    }
                );
            }
            else if (req.session.userType === "walker") {
                Walker.updateOne(
                    { _id: id },
                    { $set: { pictureURL: "images/uploaded/" + id + ".jpg"} },
                    (err, success) => {
                        if (err) {
                            console.log(err);
                        }
                        else {
                            //success
                            res.redirect("walkerProfile.html");
                        }
                    }
                );
            }
            else {
                //why's an admin uploading a picture?
                res.status(200).end("File uploaded!");
            }
        }

    });
})

// app.get("logout")
app.get('/users/logout', (req, res) => {
    // Remove the session
    req.session.destroy((error) => {
        if (error) {
            res.status(500).send(error)
        } else {
            res.redirect('/')
        }
    })
})

const port = process.env.PORT || 3001
app.listen(port, () => {
	console.log(`Listening on port ${port}...`)
});
