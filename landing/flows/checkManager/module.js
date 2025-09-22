const service = require('../../../service')

module.exports = async (req) => {
    const { token } = req.body

    if (!token) {
        return {success: false, message: `проверьте параметры`, errorStatus: 400}
    }

    const entry = await service.fetch({collection: 'contentmanagers', token: token, asEntry: true})
    if(entry) {
        return {success: true, email: entry.email}
    } else {
        return {success: false, message: `Ссылка устарела`}
    }
}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }
