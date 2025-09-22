const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: null }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    slides: { type: mongoose.Schema.Types.Mixed, default: []} //слайды
})

const LandingFirstPages = mongoose.model('landingfirstpages', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingFirstPages
