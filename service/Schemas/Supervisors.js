const mongoose = require('mongoose')
//const uniqueValidator = require('mongoose-unique-validator');

const supervisorsSchema = new mongoose.Schema({
    name: { type: String, default: null },
    email: { type: String, default: null, unique: true },
    createdAt: { type: Number, default: null },
    password: { type: String, default: null },
    verified: { type: Boolean, default: false },
    token: { type: String, default: null },
    blocked: { type: Boolean, default: false },
    recovery: { type: String, default: null},
    deactivated: { type: Boolean, default: false },
    roles: { type: mongoose.Schema.Types.Mixed, default: {
        moderator: false,
        region_admin: null,
        rfu_admin: false,
        superadmin: false
    }}
})
//supervisorsSchema.plugin(uniqueValidator, { message: 'Ошибка, элемент с таким {PATH} уже существует.' });

const Supervisors = mongoose.model('supervisors', supervisorsSchema)

module.exports = Supervisors
