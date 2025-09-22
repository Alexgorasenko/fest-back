const service = require('../service');
const { getObjId } = require('../utils');
const moment = require('moment');
const { removeQuery } = require('../modules')

module.exports = async (req, res) => {
    const { superadmin, moderator } = req.roles
    try {
        const userObjId = getObjId(req.signer.uid)
        const queryId = getObjId(req.body.queryId)

        if (!userObjId) {
            res.status(401).json({success: false, message: 'проверьте авторизацию'})
            return null
        }

        if (!queryId) {
            res.status(401).json({success: false, message: 'проверьте параметры'})
            return null
        }

        const resp = await removeQuery(queryId, userObjId, req.signer)
        if (resp.errorStatus) {
            res.status(resp.errorStatus).json(resp)
        } else {
            res.json(resp)
        }
    } catch (e) {
        console.log(`remove query failed`, e);
        res.status(500).json({success: false, message: `remove query failed`, errorStatus: 500})
    }
}
