const service = require('../service')
const { commonCompose } = require('./tokens')
const sender = require('../mails/sender')

module.exports = async (req, res) => {
    const { email } = req.body

    const entry = await service.fetch({collection: 'publicusers', email: email, asEntry: true})

    if(!entry) {
        res.status(404).json({success: false, message: 'User with requested email not found'})
    } else {
        if(entry.blocked) {
            res.status(403).json({success: false, message: 'User access blocked by administrator'})
        } else {
            try {
                const { _id, createdAt, email } = entry
                const payload = { _id, createdAt, email, hash: entry.password }
                const token = commonCompose(payload)
                await service.update({collection: 'publicusers', _id: _id}, {recovery: token})
                if(process.env.INSTANCE && process.env.INSTANCE !== "development") {
                    const resp = await sender({
                        subject: 'Восстановление пароля',
                        reciever: email,
                        input: {
                            recoveryAccess: true,
                            link: req.isProdFront ? `https://fests.rfs.ru/account/restore?token=${token}` : `https://preprod-fests.rfs.ru/account/restore?token=${token}`
                        }
                    })
                }
                res.json({success: true})
            } catch (e) {
                console.log('recovery failed', e);
                res.status(500).json({success: false, message: 'Internal server error'})
            }
        }
    }
}
