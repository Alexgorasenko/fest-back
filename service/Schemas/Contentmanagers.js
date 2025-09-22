const mongoose = require('mongoose')

const contentmanagersSchema = new mongoose.Schema({
    name: { type: String, default: null },
    email: { type: String, default: null },
    hashPwd: { type: String, default: null },
    verified: { type: Boolean, default: false },
    token: { type: String, default: null },
    blocked: { type: Boolean, default: false },
    deactivated: { type: Boolean, default: false },
    recovery: { type: String, default: null},
    createdAt: {type: Date, default: Date.now}
})

const Contentmanagers = mongoose.model('contentmanagers', contentmanagersSchema)

module.exports = Contentmanagers
