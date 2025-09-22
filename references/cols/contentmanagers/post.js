const service = require('../../../service');
const sender = require('../../../mails/sender')
const { composePublicToken } = require('../../../utils')

module.exports = async (req) => {
    try {
        const {_id, ...body} = req.body;

        if (!body.name || !body.email || !body.email.trim()) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const manager = await service.fetch({collection: 'contentmanagers', email: body.email.trim(), asEntry: true});

        if (manager) {
            return {success: false, message: 'Пользователь уже существует', errorStatus: 400}
        }

        const data = await service.save({collection: 'contentmanagers'}, body);
        if (!data._id) {
            return {success: false, message: 'contentmanagers post failed', errorStatus: 500}
        }

        const entry = await service.fetch({collection: 'contentmanagers', _id: data._id});
        const initToken = composePublicToken(entry)
        await service.update({collection: 'contentmanagers', _id: data._id}, {token: initToken})


        if(process.env.INSTANCE === 'remote') {
            await sender({
                subject: 'Доступ к личному кабинету',
                reciever: entry.email,
                input: {
                    initSvr: true,
                    link: req.isProdFront ? `https://admin-fests.rfs.ru/complete?token=${initToken}` : `https://preprod-admin-fests.rfs.ru/complete?token=${initToken}`
                }
            })
        }

        return process.env.INSTANCE === 'remote' ? {success: true, data: entry} : {success: true, data: entry, token: initToken}

    } catch (e) {
        console.log('contentmanagers err', e);
        return {success: false, message: 'contentmanagers failed', errorStatus: 500}
    }
}
