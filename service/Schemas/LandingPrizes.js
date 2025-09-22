const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    url: { type: String, default: true }, //сылка из "посмотреть на сайте"
    prizes: { type: mongoose.Schema.Types.Mixed, default: []}, //список призов
    banner: { type: mongoose.Schema.Types.Mixed, default: {}} //баннер
})

const LandingPrizes = mongoose.model('landingprizes', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingPrizes
