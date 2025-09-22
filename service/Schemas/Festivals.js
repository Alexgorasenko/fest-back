const mongoose = require('mongoose')

const festivalsSchema = new mongoose.Schema({
    title: { type: String, default: null }, //Полное название в именительном падеже
    titleGenetive: { type: String, default: null }, //Полное название в родительном падеже
    titleShort: { type: String, default: null }, //Сокращенное название в именительном падеже
    titlePrepositional: { type: String, default: null }, //Полное название в  предложном падеже
    description: { type: String, default: null }, //описание фестиваля
    descriptionForQuery: { type: String, default: null }, //описание заявки для участия в фестивале
    descriptionForReports: { type: String, default: null }, //описание в формах с отчетами
    logos: { type: mongoose.Schema.Types.Mixed,
        default: {
            desktop: '',
            laptop: '',
            mobile: ''
        }
    }, //логотипы фестиваля
    logo: { type: String, default: null }, //основное лого фестиваля
    support: { type: mongoose.Schema.Types.Mixed,
        default: {
            phone: '',
            email: '',
            tg: ''
        }
    }, //логотипы фестиваля
    createdAt: {type: Date, default: Date.now},//дата создания
    dateStart: { type: String, default: null }, //дата старта фестиваля
    dateEnd: { type: String, default: null }, //дата окончания фестиваля
    dateQueriesStart: { type: String, default: null }, //дата начала приема заявок в фестивале
    dateQueriesEnd: { type: String, default: null }, //дата окончания приема заявок в фестивале
    dateReportStart: { type: String, default: null }, //дата начала приема отчетов в фестивале
    dateReportEnd: { type: String, default: null }, //дата окончания приема отчетов  в фестивале
    dateSummingStart: { type: String, default: null }, //дата начала подведения итогов фестиваля
    dateSummingEnd: { type: String, default: null }, //дата окончания подведения итогов фестиваля
    finishedAt: {type: Date, default: null},//дата деактивации  фестиваля
    active: {type: Boolean, default: false},//активен ли фестиваль
    //educationLevelsDescription: { type: mongoose.Schema.Types.Mixed, default: null}, //максимальный год рождения дошкольников
    // nominations: {
    //     type: [mongoose.Schema.ObjectId],
    //     default: []
    // },
    countStudents: {
        type: [mongoose.Schema.Number],
        default: [300]
    }, //количество учащихся рубежи численности
    minCountFinishedReports: {type: Number, default: 5}, //Минимальное кол-во проведенных мероприятий*
    finishedVideoActivityId: {type: mongoose.Schema.ObjectId, default: null},
    extraPointsFinishedVideo: {type: Number, default: 0},
    commonCountingSettings: { type: mongoose.Schema.Types.Mixed, default: null} //фестивальные доп балы
})

const Festivals = mongoose.model('festivals', festivalsSchema)

module.exports = Festivals
