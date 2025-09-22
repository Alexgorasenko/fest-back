const service = require('../../../service')

module.exports = async (req) => {
    const { password, recovery_token } = req.body

    if (!password || !recovery_token) {
        //res.status(400).json({success: false, message: `Проверьте параметры`})
        return {success: false, message: `Проверьте параметры`, errorStatus: 400}
    }

    const entry = await service.fetch({collection: 'contentmanagers', recovery: recovery_token, asEntry: true})

    if(entry) {
        await service.update({collection: 'contentmanagers', _id: entry._id}, {recovery: null, hashPwd: password})

        return {success: true}

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
