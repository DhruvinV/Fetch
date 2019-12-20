/* Report mongoose model */
const mongoose = require('mongoose')

const ReportSchema = new mongoose.Schema({
    type: { type: String, required: true },
    description: { type: String },
    walkerId: { type: String, required: true },
    userId: { type: String, required: true },
    dogId: { type: String, required: true },
    walkId: { type: String, required: true },
    status: { type: String, default: "Pending" },
    action: { type: String, default: "Pending" },
});

const Report = mongoose.model('Report', ReportSchema);

module.exports = { Report }
