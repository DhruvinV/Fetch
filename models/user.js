/* User mongoose model */
const mongoose = require('mongoose')
const { Dog, DogSchema } = require('./dogs')

const UserSchema = new mongoose.Schema({
	username: { type: String, required: true, minlength: 1, trim: true},
	passwordHash: { type: String, required: true, trim: true },
	firstName: { type: String, required: true, minlength: 1, trim: true},
	lastName: { type: String, required: true, minlength: 1, trim: true},
	homeAddress: { type: String, required: true },
	city: { type: String, default: "Toronto" },
	province: { type: String, default: "Ontario" },
	emailAddress: { type: String, required: true },
	dateJoined: Date,
	userDogs: [ DogSchema ],
	pictureURL: String,
	description: String
});

const User = mongoose.model('User', UserSchema);

module.exports = { User }
