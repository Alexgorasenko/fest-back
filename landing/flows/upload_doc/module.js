const { getObjId } = require('../../../utils')
const upload_doc = require('./upload_doc');

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid || req.signer._id)

        const uploadToServer = await upload_doc({
            body: req.body,
            file: req.files && req.files.file ? req.files.file : null,
            folder: 'docs',
            userId,
            HOST: req.selfHost
        })
        return uploadToServer
    } catch (e) {
        console.log('upload doc failed', e);

        return {success: false, message: 'upload doc failed', errorStatus: 500}
    }
}
