const mongoose = require('mongoose')

const attachmentsSchema = new mongoose.Schema({
    userId: {type: mongoose.Schema.ObjectId, default: null},
    sampleId: {type: mongoose.Schema.ObjectId, default: null},
    sampleType: { type: String, default: null },
    filename: { type: String, default: null },
    localname: { type: String, default: null },
    path: { type: String, default: null },
    size: { type: Number, default: null },
    date: { type: String, default: null },
    fullpath: { type: String, default: null },
})

const Attachments = mongoose.model('attachments', attachmentsSchema)

module.exports = Attachments
