const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { patchQuery } = require('../../../modules')
const sender = require('../../../mails/sender')

const moment = require('moment');

module.exports = async (req, item) => {
    try {
        const userObjId = getObjId(req.signer.uid)
        const queryId = getObjId(item)
        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const query = await service.fetch({collection: 'queries', _id: queryId})
        if (!query) {
            return {success: false, message: `Заявка ${queryId} не найдена. проверьте параметры`, errorStatus: 400}
        }
        const result = await patchQuery({body: req.body, item, userObjId, signer: req.signer})
        if (req.signer.email && result.success && req.body.status && req.body.status === 'NEED_MODERATION' && query.status === 'DRAFT') {
            try {
                if(process.env.INSTANCE && process.env.INSTANCE !== "development") {
                    const resp = await sender({
                        subject: 'Заявка подана успешно',
                        reciever: req.signer.email,
                        input: {
                            createdQuery: true,
                            link: req.isProdFront ? `https://fests.rfs.ru/apps` : `https://preprod-fests.rfs.ru/apps`
                        }
                    })

                    console.log('resp user upd', resp, req.signer.email);
                }
            } catch (e) {
                console.log('recovery failed', e);
            }
        }
        return result

    } catch (e) {
        console.log('userflow update query failed', e);
        return {success: false, message: 'userflow update query failed', errorStatus: 500}
    }
}
