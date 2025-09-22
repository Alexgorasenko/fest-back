const mongoose = require('mongoose')

const regionsSchema = new mongoose.Schema({
    name: { type: String, default: null },
    kladr_id: { type: String, default: null },
    federal_district: { type: String, default: null },
    visible: {type: Boolean, default: true}
})

const Regions = mongoose.model('regions', regionsSchema)

module.exports = Regions
