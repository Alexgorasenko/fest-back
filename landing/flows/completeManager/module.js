const service = require('../../../service')
const { commonCompose } = require('../../tokens')

module.exports = async (req) => {
    const { verify, password } = req.body;

    if (!verify || !password) {
        return {success: false, message: `проверьте параметры`, errorStatus: 400}
    }

    const entry = await service.fetch({collection: 'contentmanagers', token: verify, asEntry: true})
    if(entry) {
        await service.update(
            {
                collection: 'contentmanagers',
                _id: entry._id
            },
            {token: null, verified: true, hashPwd: password}
        )

        const tokenToSend = commonCompose({
            _id: entry._id,
            createdAt: entry.createdAt,
            email: entry.email,
            hashPwd: password
        })

        return {success: true, token: tokenToSend}
    } else {
        return {success: false,errorStatus: 400, message: `токен просрочен`}
    }
}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }
