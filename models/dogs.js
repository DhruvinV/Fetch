/* User mongoose model */
const mongoose = require('mongoose')

const DogSchema = new mongoose.Schema({
	dogName: { type: String, required: true },
	needs: [String],
	weight: Number,
	ratings: [Number],
	pictureURL: String,
	description: String
});

const Dog = mongoose.model('Dog', DogSchema);

module.exports = { Dog, DogSchema };
