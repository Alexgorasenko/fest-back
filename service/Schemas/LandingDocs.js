const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    chapters: { type: mongoose.Schema.Types.Mixed, default: [] }, //разделы
})

const LandingDocs = mongoose.model('landingdocs', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingDocs
