const mongoose = require('mongoose')

const landingpartnersSchema = new mongoose.Schema({
    title: { type: String, default: null }, //название
    image: { type: String, default: null }, //ссыка на картинку
    url: { type: String, default: null }, //ссылка на партнера
    alt: { type: String, default: null }, //алт изображения
    isVisible: { type: Boolean, default: true } //видимость партнера
})

const LandingPartners = mongoose.model('landingpartners', landingpartnersSchema)

module.exports = LandingPartners
