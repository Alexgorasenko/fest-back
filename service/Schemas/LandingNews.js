const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    menuTitle: { type: String, default: "" }, //название пункта меню
    pageTitle: { type: String, default: "" }, //заголовок блока на странице
    getvknews: { type: Boolean, default: false }, //получать ли новости из вк
    autoposting: { type: Boolean, default: false }, //автоматически добавлять на сайт
    vklink: { type: String, default: "" }, //ссылка на страницу
    hashtag: { type: String, default: "" }, //хэштэг новости
    groupId: { type: String, default: "" }, //ид группы вк
    groupAccess: { type: String, default: "" }, //ключ доступа к группе
    access: { type: String, default: "" }, //доступ
    countBanners: {type: Number, default: 1},
    banners: { type: mongoose.Schema.Types.Mixed, default: []}, //баннеры
})

const LandingNews = mongoose.model('landingnews', publicationsSchema)
/*
body: { type: mongoose.Schema.Types.Mixed, default: [
    {"key": "subtitle", "subtitle": ""},
    {"key": "text", "text": ""},
    {"key": "video", "url": ""},
    {"key": "image", "images": [], "author": ""},
    {"key": "quote", "text": "", "author": "", "post": ""}
]}
*/
module.exports = LandingNews
