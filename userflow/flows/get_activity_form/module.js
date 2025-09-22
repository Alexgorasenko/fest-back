const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { getActForm } = require('../../../modules')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }

        const { festivalId, queryId, activityId, nominationId } = req.query;

        const objfestivalIdId = getObjId(festivalId);
        const objqueryId = getObjId(queryId);
        const objactivityId = getObjId(activityId);
        const objnominationId = getObjId(nominationId);

        if (!objqueryId || !objfestivalIdId || !objactivityId || !objnominationId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const form = await getActForm({
                //userId: userId,
                festivalId: objfestivalIdId,
                queryId: objqueryId,
                nominationId: objnominationId,
                activityId: objactivityId
            })

        return form

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
