const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    isManualEnter: { type: Boolean, default: false }, //ручной ввод цифр или нет
    numbers: { type: mongoose.Schema.Types.Mixed, default: null}, //блок цифр
    childrenParticipiedQty: {type: Number, default: 0}, //участвовало детей,
    queriesCount: {type: Number, default: 0}, //всего участников, 
    totalReported: {type: Number, default: 0}, //всего мероприятий
    personInfo: { type: mongoose.Schema.Types.Mixed, default: null}, //персонаж
})

const LandingParticipants = mongoose.model('landingparticipants', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingParticipants
