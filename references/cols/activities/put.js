const service = require('../../../service');
module.exports = async (req, id) => {
    try {
        const {_id, ...patch} = req.body;

        const reportsCount = await service.count({collection: 'activityreports', activityId: id});
        if (patch.removeActivity) {
            if (reportsCount) {
                return {success: false, message: `В мероприятии ${reportsCount} отчетов, удаление запрещено`, errorStatus: 400}
            }
            const res = await service.delete({collection: 'activities', _id: id})
            return {success: true, data: res}
        }

        let entry = null

        if (reportsCount) {
            const { participants, countingCriterias, ...minPatch } = patch;
            //return {success: false, message: 'в данном мероприятии уже есть фестивали', errorStatus: 400}
            entry = await service.findOneAndUpdate({collection: 'activities', match: {_id: id}}, minPatch);
        } else {
            if (patch.countingCriterias) {
                if (!patch.countingCriterias.length) {
                    return {success: false, message: 'нет данных в countingCriterias', errorStatus: 400}
                }
                if (patch.countingCriterias.find(cr => !cr.label || !cr.label.trim())) {
                    return {success: false, message: 'в countingCriterias есть критерий с незаполненным label', errorStatus: 400}
                }
            }
            entry = await service.findOneAndUpdate({collection: 'activities', match: {_id: id}}, patch)
        }

        return {success: true, data: entry}
    } catch (e) {
        console.log('activities put', e);
        return {success: false, message: 'activities put failed', errorStatus: 500}
    }
}
