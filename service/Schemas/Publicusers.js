const mongoose = require('mongoose')
//const uniqueValidator = require('mongoose-unique-validator');

const publicusersSchema = new mongoose.Schema({
    name: { type: String, default: null },
    email: { type: String, default: null, unique: true },
    createdAt: { type: Number, default: null },
    password: { type: String, default: null },
    verified: { type: Boolean, default: false },
    blocked: { type: Boolean, default: false },
    recovery: { type: String, default: null},
    createCounter: {type: Number, default: 1}
})

//publicusersSchema.plugin(uniqueValidator, { message: 'Ошибка, элемент с таким {PATH} уже существует.' });

const Publicusers = mongoose.model('publicusers', publicusersSchema)

module.exports = Publicusers
