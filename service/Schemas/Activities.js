const mongoose = require('mongoose')
//мероприятия
const activitiesSchema = new mongoose.Schema({
    name: { type: String, default: '' }, //название мероприятия
    desc: { type: String, default: '' }, //описание мероприятия
    active: {type: Boolean, default: true},//активно ли мероприятие
    isExtra: {type: Boolean, default: false},//дополнительное ли мероприятие
    festivalId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор фестиваля
    participants: {
        type: mongoose.Schema.Types.Mixed,
        default: {
            educationLevels: [],
            sex: "all"
        }
    }, // данные связки
    sort: {type: Number, default: 1},
    countingCriterias: {
        type: mongoose.Schema.Types.Mixed,
        default: []
        /*{
            countStudents: {
                mandatory: false,
                max: 10,
            },
            countTeams: {
                mandatory: false,
                "intervals": [
                  {
                    "min": 3,
                    "max": 5,
                    "points": 3
                  },
                  {
                    "min": 6,
                    "max": 8,
                    "points": 6
                  },
                  {
                    "min": 9,
                    "max": null,
                    "points": 10
                  }
                ]
            },
            photo: {
                mandatory: false,
                min: 0,
                max: 0,
                minsize: 1,
                reportDescription: "",
                pointsForEvery: 0,
                pointsForСompletion: 0
            },
            video: {
                mandatory: false,
                min: 0,
                max: 0,
                min_time_sec: 0,
                max_time_sec: 0,
                format: "horizontal",
                reportDescription: "",
                pointsForEvery: 0,
                pointsForСompletion: 0
            },
            publication: {
                min: 0,
                max: 0
            },
        }*/
    }, // криитерии оценки
})
const Activities = mongoose.model('activities', activitiesSchema)

module.exports = Activities
