const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    descriptions: { type: mongoose.Schema.Types.Mixed, default: []}, //
    timelines: { type: mongoose.Schema.Types.Mixed, default: []}, //года проведения фестиваля
})

const LandingHistories = mongoose.model('landinghistories', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingHistories
