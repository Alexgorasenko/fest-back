const service = require('../service')
const { commonCompose } = require('./tokens')
const sender = require('../mails/sender')

module.exports = async (req, res) => {
    const { email: emailIn } = req.body

    if (!emailIn) {
        res.status(400).json({success: false, message: `Проверьте параметры`})
        return {}
    }
    const email = emailIn.trim().toLowerCase();

    const entry = await service.fetch({collection: 'publicusers', email: email, asEntry: true})
    let svr = await service.fetch({collection: 'supervisors', email: email, asEntry: true})

    if(!entry && !svr) {
        res.status(404).json({success: false, message: 'Пользователь не найден'})
        return {}
    }

    const payload = entry ? { _id: entry._id, createdAt: entry.createdAt, email, hash: entry.password } : { _id: svr._id, createdAt: svr.createdAt, email, hash: svr.password }

    const token = commonCompose(payload)

    if(!entry) {
        if(svr.blocked) {
            res.status(403).json({success: false, message: 'Пользователь заблокирован'})
            return {}
        }
        await service.update({collection: 'supervisors', _id: svr._id}, {recovery: token})
    } else {
        if(entry.blocked) {
            res.status(403).json({success: false, message: 'Пользователь заблокирован'})
            return {}
        } else {
            await service.update({collection: 'publicusers', _id: entry._id}, {recovery: token})
            if (svr) {
                await service.update({collection: 'supervisors', _id: svr._id}, {recovery: token})
            }
        }
    }

    if (process.env.INSTANCE && process.env.INSTANCE !== 'development') {
        try {
            const resp = await sender({
                subject: 'Восстановление пароля',
                reciever: email,
                input: {
                    recoveryAccess: true,
                    link: req.isProdFront ? `https://fests.rfs.ru/auth/recovery?token=${token}` : `https://preprod-fests.rfs.ru/auth/recovery?token=${token}`
                }
            })
            res.json({success: true})

        } catch (e) {
            console.log('catch sending', e);
            res.status(500).json({success: false, message: `ошибка отправки письма на почту ${email}`})
            return {}

        }
    } else {
        res.json({success: true})
    }

}
