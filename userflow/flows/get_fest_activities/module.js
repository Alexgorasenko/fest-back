const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { getFestFullData } = require('../../../modules')
const moment = require('moment');

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const now = moment().format('YYYY.MM.DD')
        const matchFest = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        const festivalData = await getFestFullData(matchFest);


        return festivalData && festivalData.data && festivalData.data.activities ? {
            success: true,
            data:  festivalData.data.activities
        } :  festivalData

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
