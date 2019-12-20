/* Walk mongoose model */
const mongoose = require('mongoose')

const CoordinateSchema = new mongoose.Schema({
    x: Number,
    y: Number
})

//simplying assumption: walk starts immediately after walker accepts
const WalkSchema = new mongoose.Schema({
    walkerId: { type: String, required: true },
    userId: { type: String, required: true },
    dogId: { type: String, required: true },
    walkNeeds: { type: [String], default: [] },
    pickupInstructions: String,
    price: { type: Number, required: true },
    duration: Number, //in minutes, is an estimate until completed
    startTime: { type: Date },
    endTime: { type: Date }, //when !completed, is an estimate
    walkerRating: Number,
    walkerComplaints: { type: [String], default: [] }, //complaints about the walker
    dogRating: Number,
    dogComplaints: { type: [String], default: [] }, //complaints about the dog
    notes: [String],
    accepted: { type: Boolean, default: false }, //set to true when walker accepts
    completed: { type: Boolean, default: false }, //set to true when walk ends
    locations: [ CoordinateSchema ]
});

const Walk = mongoose.model('Walk', WalkSchema);

module.exports = { Walk }
