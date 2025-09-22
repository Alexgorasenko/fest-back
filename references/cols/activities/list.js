const service = require('../../../service');
const { getObjId } = require('../../../utils')

module.exports = async (req) => {
    try {
        const { festivalId } = req.query;
        const filter = {};
        if (festivalId) {
            if (getObjId(festivalId)) {
                filter.festivalId = getObjId(festivalId)
            } else {
                return {success: false, message: 'check params', errorStatus: 400}
            }
        }

        const list = await service.fetch({collection: 'activities', pipeline: [
            {$match: filter},
            {$lookup: {
                from: 'activityreports',
                let: {aid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$aid', '$activityId']},
                    }},
                    {$limit: 1},
                    {$project: {_id: 1}},
                ],
                as: 'report'
            }},
            {$set: {
                report: {'$arrayElemAt': ['$report', 0]},
            }},
            {$sort: {sort: 1}}
        ]});

        return {success: true, data: list.map(f => {
            const {report, ...act} = f;
            return {...act, deletionIsAllowed: !report}
        })}
    } catch (e) {
        console.log('activities ', e);
        return {success: false, message: 'activities list failed', errorStatus: 500}
    }
}
