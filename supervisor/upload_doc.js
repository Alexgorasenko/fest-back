const service = require('../service');
const { getObjId } = require('../utils')

const {upload_doc} = require('../modules');

const moment = require('moment');

module.exports = async (req, res) => {
    try {
        const userId = getObjId(req.signer.uid || req.signer._id)

        const uploadToServer = await upload_doc({
            body: req.body,
            file: req.files && req.files.file ? req.files.file : null,
            folder: 'publicdocs',
            userId,
            HOST: req.selfHost
        })
        if (uploadToServer.errorStatus) {
            res.status(uploadToServer.errorStatus).json(uploadToServer)
        } else {
            res.json(uploadToServer)
        }
    } catch (e) {
        console.log('upload attach failed', e);
        res.status(500).json({success: false, message: 'svr upload failed', errorStatus: 500})
        return {success: false, message: 'svr upload failed', errorStatus: 500}
    }
}
