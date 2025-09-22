const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    stages: { type: mongoose.Schema.Types.Mixed, default: null}, //этапы
})

const LandingStages = mongoose.model('landingstages', publicationsSchema)

module.exports = LandingStages
