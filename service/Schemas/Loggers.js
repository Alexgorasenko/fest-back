const mongoose = require('mongoose')

const loggersSchema = new mongoose.Schema({
    action: { type: String, default: null }, //действие
    collectionName: { type: String, default: '' }, //коллекция
    id: { type: String, default: '' }, //ид дока
    authorCollection: { type: String, default: '' }, //коллекция автора
    authorId: { type: String, default: '' }, //ид автора
    author: { type: String, default: '' }, //фио автора
    patch: {type: mongoose.Schema.Types.Mixed, default: null},//патч дока при наличии
    createdAt: { type: Date, default: Date.now }, //дата создания
})

const Loggers = mongoose.model('loggers', loggersSchema)

module.exports = Loggers
