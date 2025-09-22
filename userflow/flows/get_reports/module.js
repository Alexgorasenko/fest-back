const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
//const { getActForm } = require('../../../modules')
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
        let festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$project: {_id: 1}}
        ], asEntry: true})

        if (!festival) {
            festival = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$sort: {_id: -1}},
                {$limit: 1},
                {$project: {_id: 1}}
            ], asEntry: true})
            //return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        if (item) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
            // const form = await getActForm({
            //         userId: userId,
            //         festivalId: festival._id,
            //         _id: item
            //     })
            //
            // return form
        } else {
            const reports = await service.fetch({collection: 'activityreports', pipeline: [
                {$match: {
                    userId: userId,
                    festivalId: festival._id
                }},
                {$lookup: {
                    from: 'activities',
                    let: {aid: '$activityId'},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                    ],
                    as: 'activity'
                }},
                {$set: {
                    activity: {'$arrayElemAt': ['$activity', 0]},
                }}
            ]})

            return {
                success: true,
                data: reports
            }
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
