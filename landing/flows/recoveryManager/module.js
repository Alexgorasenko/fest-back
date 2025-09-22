const service = require('../../../service')
const { commonCompose } = require('../../tokens')

module.exports = async (req) => {
    const { email: emailIn } = req.body
    const email = emailIn ? emailIn.trim().toLowerCase() : "";

    if (!email) {
        //res.status(400).json({success: false, message: `Проверьте параметры`})
        return {success: false, message: `Проверьте параметры`, errorStatus: 400}
    }

    const entry = await service.fetch({collection: 'contentmanagers', email: email, asEntry: true})

    if(entry) {
        const { _id, createdAt, email, hashPwd } = entry
        //if (validatePwd(password, hashPwd)) {
        const tokenToSend = commonCompose({_id, createdAt, email, hashPwd})
        await service.update({collection: 'contentmanagers', _id: entry._id}, {recovery: tokenToSend})

        if(process.env.INSTANCE === 'remote') {
            await sender({
                subject: 'Восстановление пароля',
                reciever: email,
                input: {
                    recoveryAccess: true,
                    link: req.isProdFront ? `https://admin-fests.rfs.ru/restore?token=${tokenToSend}` : `https://preprod-admin-fests.rfs.ru/restore?token=${tokenToSend}`
                }
            })
        }

        return process.env.INSTANCE === 'remote' ? {success: true} : {success: true, token: tokenToSend}

    } else {
        return {success: false,errorStatus: 400, message: `проверьте параметры`}
    }
}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }
