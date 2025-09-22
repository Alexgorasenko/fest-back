const service = require('../../service');
const { getObjId, isEmptyOrNull } = require('../../utils')
const { getQueryForm } = require('../../modules');
const moment = require('moment');

module.exports = async (item) => {
    try {
        const now = moment().format('YYYY.MM.DD');
        const queryId = getObjId(item)

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const form = await getQueryForm(queryId)
        return form
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}
