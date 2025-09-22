const service = require('../../../service');
const { getObjId } = require('../../../utils')
const { removeAttach } = require('../../../modules')

module.exports = async (req, item) => {
    try {
        if (!item) {
            return {success: false, message: 'check params', errorStatus: 400}
        }
        const userId = getObjId(req.signer.uid)

        const resp = await removeAttach(item);
        return resp
    } catch (e) {
        console.log('upload attach failed', e);
        return {success: false, message: 'removing file failed', errorStatus: 500}
    }
}
