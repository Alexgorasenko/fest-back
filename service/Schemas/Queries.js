const mongoose = require('mongoose')

const queriesSchema = new mongoose.Schema({
    status: { type: String, default: 'DRAFT' }, //статус заявки
    verified: { type: Boolean, default: false }, //корректно ли заполнена заявка
    organizationQueryData: {type: mongoose.Schema.Types.Mixed,default: {
        name: '',
        fullName: '',
        inn: '',
        kpp: '',
        ogrn: '',
        site: '',
        phone: '',
        email: '',
        address: {
            display: '',
            region: {
                name: '',
                kladr_id: ''
            },
            city: {
                name: '',
                kladr_id: ''
            }
        }
    }},// данные по организации
    organizationId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор организации
    nominations: {type: mongoose.Schema.Types.Mixed, default: []},//номинации по типу ОУ, в которые подаётся заявка
    userId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор пользователя подавшего заявку
    createdAt: {type: Date, default: Date.now},//дата создания
    deliveryToModerated: {type: Date, default: null},//дата создания
    handledBy: {type: mongoose.Schema.ObjectId, default: null},//идентификатор админа
    handledAt: {type: Date, default: null},//дата обработки
    moderatorData: {type: mongoose.Schema.Types.Mixed, default: null},//информация по модерации заявки
    archived: {type: Boolean, default: false},//архивация заявки
    finishedReports:  {type: mongoose.Schema.Types.Mixed, default: null},
    isPrintFormGetted: {type: Boolean, default: false},//создавшим заяку пользователем получалась печатная форма заявки
    festivalId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор фестиваля
    regionId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор региона
    contactPerson: {type: mongoose.Schema.Types.Mixed, default: null}, //контактное лицо
    director: {type: mongoose.Schema.Types.Mixed, default: null}, // руководитель организации
    attachmentFormId: {type: mongoose.Schema.ObjectId, default: null},//идентификатор последнего вложения подписанной формы заявки
    attachmentReports: {type: mongoose.Schema.Types.Mixed, default: null},//идентификаторы итоговой формы отправленных отчетов

})

const status = {
    'DRAFT': 'Черновик', //заявка создается в момент взаимодействия пользователя с CTA "Создать заявку" на фронтенде. Черновик должен отдаваться с последними изменениями после обновления страницы
    'NEED_MODERATION': 'Нужна модерация',
    'NOT_VALID': 'Не валидный',
    'VALID': 'Валидный',
    'ARCHIVED': "Удалена"
}

const Queries = mongoose.model('queries', queriesSchema)

module.exports = Queries
