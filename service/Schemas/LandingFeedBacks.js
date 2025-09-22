const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    email: { type: String, default: "" }, //почта для уведомлений
    //policyFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл политики конфиденциальности
    //personFileId: {type: mongoose.Schema.ObjectId, default: null}, //файл перс даннных
    policy: {
        policyFileId: { type: mongoose.Schema.ObjectId, default: null },
        policyLink: { type: String, default: '' },
        linkActive: {type: Boolean, default: false}
    }, //идентификатор вложения с файлом политиики обработки
    persData: {
        persDataFileId: { type: mongoose.Schema.ObjectId, default: null },
        persDataLink: { type: String, default: '' },
        linkActive: {type: Boolean, default: false}
    }, //идентификатор вложения с файлом политиики обработки
})

const LandingFeedBacks = mongoose.model('landingfeedbacks', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingFeedBacks
