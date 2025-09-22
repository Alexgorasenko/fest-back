const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { apply_activity_report } = require('../modules')

module.exports = async (req, res) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const { id } = req.params

        const result = await apply_activity_report({body: req.body, item: id, userObjId: userId, signer: req.signer})
        if (result.errorStatus) {
            res.status(result.errorStatus).json(result)
        } else {
            res.json(result)
        }
    } catch (e) {
        console.log('userflow apply_activity_report failed', e);
        return {success: false, message: 'userflow apply_activity_report failed', errorStatus: 500}
    }
}
