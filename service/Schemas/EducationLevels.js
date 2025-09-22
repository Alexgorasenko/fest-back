const mongoose = require('mongoose')

const educationlevelsSchema = new mongoose.Schema({
    name: { type: String, default: null }, //наименование уровня образования
    description: { type: String, default: null }, //описание уровня образования
    active: { type: Boolean, default: true }, //активен ли уровень образования
    sort: {type: Number, default: 0},
    option_description: { type: String, default: null }, //опциональное описание туровня образования
    nominationId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор номинации
})

const EducationLevels = mongoose.model('educationlevels', educationlevelsSchema)

module.exports = EducationLevels
