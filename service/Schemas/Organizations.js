const mongoose = require('mongoose')

const organizationsSchema = new mongoose.Schema({
    fullName: { type: String, default: null }, //полное наименование организации
    name: { type: String, default: null }, //наименование орг
    inn: { type: String, default: null }, //офф сайт орагнизации
    kpp: { type: String, default: null }, //офф сайт орагнизации
    ogrn: { type: String, default: null }, //офф сайт орагнизации
    active: { type: Boolean, default: true }, //активна ли организация
    userId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор пользователя подавшего заявку с органищацией
    createdAt: {type: Date, default: Date.now},//дата создания
    regionId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор региона
    apiFullBody: { type: mongoose.Schema.Types.Mixed, default: null}, // данные от апи в сыром виде (данные из подсказки на фронт)
    address: { type: mongoose.Schema.Types.Mixed, default: null}
})

const Organizations = mongoose.model('organizations', organizationsSchema)

module.exports = Organizations
