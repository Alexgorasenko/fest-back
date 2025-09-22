const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { apply_activity_report } = require('../../../modules')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const res = await apply_activity_report({body: req.body, item: item, userObjId: userId, signer: req.signer})
        return res

    } catch (e) {
        console.log('userflow apply_activity_report failed', e);
        return {success: false, message: 'userflow apply_activity_report failed', errorStatus: 500}
    }
}
