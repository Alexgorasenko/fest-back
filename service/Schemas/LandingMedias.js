const mongoose = require('mongoose')

const landingmediasSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    media: { type: mongoose.Schema.Types.Mixed, default: []}, //содержимое альбома
})

const LandingMedias = mongoose.model('landingmedias', landingmediasSchema)

module.exports = LandingMedias
