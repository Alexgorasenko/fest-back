const mongoose = require('mongoose')

const landingpartnersSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
})

const LandingPagePartners = mongoose.model('landingpagepartners', landingpartnersSchema)

module.exports = LandingPagePartners
