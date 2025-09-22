const mongoose = require('mongoose')

const activityreportsSchema = new mongoose.Schema({
    activityId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор мероприятия
    nominationId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор мероприятия
    queryId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор заявки
    festivalId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор фестиваля
    regionId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор региона
    userId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор пользователя подавшего заявку
    handledBy: {type: mongoose.Schema.ObjectId, default: null},//идентификатор админа
    reportData: {type: mongoose.Schema.Types.Mixed, default: null},//информация по заявке уровень учащихся м д
    createdAt: {type: Date, default: Date.now},//дата создания
    date: { type: String, default: null },//дата проведения
    archived: {type: Boolean, default: false},//архивация заявки
})

const ActivityReports = mongoose.model('activityreports', activityreportsSchema)

module.exports = ActivityReports
