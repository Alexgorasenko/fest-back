const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { getActQuery } = require('../modules')
const moment = require('moment');

module.exports = async (req, res) => {
    try {
        const { region_admin, superadmin } = req.roles
        const { limit=30, page=0 } = req.query

        const { id } = req.params
        const now = moment().format('YYYY.MM.DD')
        const matchFest = {$or: [{
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }, {}]}
        const festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$sort: {_id: -1}},
            {$project: {_id: 1}}
        ], asEntry: true})

        if (!festival) {
            return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        if (id) {

            const query = await getActQuery({
                    festivalId: festival._id,
                    _id: id
                })

            return query
        } else {

            const match = {
                festivalId: festival._id
            }

            if (region_admin && region_admin.canView && region_admin.canView.length) {
                match.regionId = {$in: region_admin.canView.map(id => getObjId(id))}
            }

            const queriesCount = await service.count({collection: 'activityreports', pipeline: [
                {$match: match},
            ]})

            const totalPages =  Math.ceil(queriesCount / limit)
            const queries = await service.fetch({collection: 'activityreports', pipeline: [
                {$match: match},
                {$sort: {_id: -1}},
                {$skip: page * limit},
                {$limit: +limit},
                {$lookup: {
                    from: 'activities',
                    let: {aid: '$activityId'},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                    ],
                    as: 'activity'
                }},
                {$lookup: {
                    from: 'queries',
                    let: {aid: '$queryId'},
                    pipeline: [
                        {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                        {$project: {organizationQueryData: 1}}
                    ],
                    as: 'query'
                }},
                {$set: {
                    activity: {'$arrayElemAt': ['$activity', 0]},
                    query: {'$arrayElemAt': ['$query', 0]},
                }}
            ]})

            return {
                success: true,
                data: {
                    list: queries,
                    count: queriesCount,
                    totalPages: totalPages,
                    currentPage: +page + 1
                }
            }
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
