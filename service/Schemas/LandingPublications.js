const mongoose = require('mongoose')

const publicationsSchema = new mongoose.Schema({
    title: { type: String, default: "" }, //заголовок
    description: { type: String, default: "" }, //описание
    imgLink: { type: String, default: "" }, //главное изображение
    isPinned: { type: Boolean, default: false }, //закреплена ли публикация
    isVisible: { type: Boolean, default: true }, //видима ли публикация
    datePublished: { type: String, default: "" }, //дата публикации
    date: { type: Number, default: "" }, //дата публикации unix
    body: { type: mongoose.Schema.Types.Mixed, default: [] },
    socialVkData: { type: mongoose.Schema.Types.Mixed, default: null},
    //videoLink: { type: String, default: "" } //сылка на видео
})

const LandingPublications = mongoose.model('landingpublications', publicationsSchema)
/*
body: [
        {
            "key": "subtitle",
            "subtitle": "<h1>subtitle</h1>",
            "id": "subtitle0"
        },
        {
            "key": "content",
            "text": "<p>text</p>",
            "id": "text1"
        },
        {
            "key": "attachments",
            "images": [],
            "id": "images2"
        },
        {
            "key": "videoLink",
            "url": '',
            "id": "url3"
        },
    ]
*/
/*
//content: { type: String, default: null }, //текст публикации
//attachments: { type: mongoose.Schema.Types.Mixed, default: [] }, //вложения

outerLink: { type: String, default: "" }, //ссылка на публикацию
domain: { type: String, default: "" }, //ссылка на публикацию
vkId: { type: Number, default: "" }, //ссылка на публикацию
post_type: { type: String, default: "" }, //тип публикации
from_id: { type: String, default: "" }, //from_id публикации
owner_id: { type: String, default: "" }, //owner_id публикации
inner_type: { type: String, default: "" }, //inner_type публикации
*/
module.exports = LandingPublications
