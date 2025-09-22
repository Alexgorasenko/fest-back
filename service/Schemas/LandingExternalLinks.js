const mongoose = require('mongoose')

const landingexternallinksSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    isVisibleBtn: { type: Boolean, default: true }, //флаг отображается ли кнопка
    btnName: { type: String, default: "" }, //название кнопки
    btnLink: { type: String, default: "" }, //ссылка для перехода
    vk: { type: String, default: "" }, //соцсети
    tg: { type: String, default: "" },
    ok: { type: String, default: "" },
    file: {
        fileId: { type: mongoose.Schema.ObjectId, default: null },
        link: { type: String, default: '' },
        linkActive: {type: Boolean, default: false}
    }, //идентификатор вложения с файлом политиики обработки
})

const LandingExternalLinks = mongoose.model('landingexternallinks', landingexternallinksSchema)

module.exports = LandingExternalLinks
