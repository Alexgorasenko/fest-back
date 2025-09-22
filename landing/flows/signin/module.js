//const bcrypt = require('bcrypt')
const service = require('../../../service')
const { commonCompose } = require('../../tokens')

const SALT_ROUNDS = 10

module.exports = async (req) => {
    const { email, password } = req.body

    const entry = await service.fetch({collection: 'contentmanagers', email: email, asEntry: true})
    if(entry) {
        const { _id, createdAt, email, hashPwd, deactivated, blocked, verified } = entry

        if (deactivated || blocked || (verified !== undefined && !verified)) {
            return {success: false, errorStatus: 401, message: `Учетная запись невалидна`}
        }

        if (password === hashPwd) {
            const tokenToSend = commonCompose({_id, createdAt, email, hashPwd})

            return {success: true, token: tokenToSend}
        } else {
            return {success: false,errorStatus: 401, message: `Неверный логин или пароль`}
        }
    } else {
        return {success: false,errorStatus: 401, message: `Неверный логин или пароль`}
    }
}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }
