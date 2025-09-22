const mongoose = require('mongoose')

const queriesSchema = new mongoose.Schema({
    certificateFileId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор вложения с файлом сертификата
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
    userMsg: {
        userMsgFileId: { type: mongoose.Schema.ObjectId, default: null },
        userMsgLink: { type: String, default: '' },
        linkActive: {type: Boolean, default: false}
    }, //идентификатор вложения с файлом пользовательское сообщение
    mainInfoFileId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор вложения с файлом положения
})

const Publicdocs = mongoose.model('publicdocs', queriesSchema)

module.exports = Publicdocs
