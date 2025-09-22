const service = require('../../../service');
const { getObjId } = require('../../../utils');
const moment = require('moment');
const { removeQuery } = require('../../../modules')

module.exports = async (req, item) => {
    try {
        const userObjId = req.signer ? getObjId(req.signer.uid) : null
        const queryId = getObjId(req.body.queryId)

        if (!userObjId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const resp = await removeQuery(queryId, null, req.signer)
        return resp
    } catch (e) {
        console.log(`remove query failed ${item}`, e);
        return {success: false, message: `remove query failed ${item}`, errorStatus: 500}
    }
}
