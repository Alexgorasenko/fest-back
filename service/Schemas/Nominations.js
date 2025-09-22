const mongoose = require('mongoose')

const nominationsSchema = new mongoose.Schema({
    name: { type: String, default: null }, //наименование номинации
    description: { type: String, default: null }, //описание номинации
    option_description: { type: String, default: null }, //опциональное описание номинации
    active: { type: Boolean, default: true }, //активна ли номинация
    countStudents: {
        type: [Number],
        default: null
    },
    festivalId: {type: mongoose.Schema.ObjectId, default: null}, //идентификатор фестиваля
    sort: {type: Number, default: 0},
    //nominationtypes: {type: [mongoose.Schema.ObjectId], default: []}, //идентификаторы типов номинаций
    // educationLevels: {
    //     // type: mongoose.Schema.Types.Mixed,
    //     // default: {
    //     //     '65047fd5feaee11e6a2cd93e': {
    //     //         man: 0,
    //     //         woman: 0
    //     //     },
    //     //     "65047fe8feaee11e6a2cd93f": {
    //     //         man: 0,
    //     //         woman: 0
    //     //     },
    //     //     "65047ff1feaee11e6a2cd940": {
    //     //         man: 0,
    //     //         woman: 0
    //     //     },
    //     //     "65047ffffeaee11e6a2cd941": {
    //     //         man: 0,
    //     //         woman: 0
    //     //     }
    //     // },
    //     type: [mongoose.Schema.ObjectId],
    //     default: []
    // }, //уровни образования которые будут заполняться в заявке
})

// const educationLevels = {
//     '65047fd5feaee11e6a2cd93e': 'Дошкольники',
//     '65047fe8feaee11e6a2cd93f': '1-4 класс',
//     '65047ff1feaee11e6a2cd940': '5-9 класс',
//     '65047ffffeaee11e6a2cd941': '10-11 класс',
// }

const Nomination = mongoose.model('nominations', nominationsSchema)

module.exports = Nomination
