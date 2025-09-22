const service = require('../../../service');
const moment = require('moment');

module.exports = async (req, item) => {
    try {
        if (!item) {
            return {success: false, 'message': 'check params', errorStatus: 400}
        }
        const now = moment().format('YYYY.MM.DD')

        const organization = await service.fetch({collection: 'organizations', pipeline: [
            {$match: {
                'requisites.inn': item
            }},
            {$lookup: {
                from: 'queries',
                let: {oid: '$_id'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$oid', '$organizationId']}}},
                    {$lookup: {
                        from: 'festivals',
                        let: {fid: '$festivalId'},
                        pipeline: [
                            {$match: {
                                $expr: {$eq: ['$$fid', '$_id']},
                                dateStart: {$lte: now},
                                dateEnd: {$gte: now}
                            }},
                            {$project: {_id: 1, name: 1, active: 1}}
                        ],
                        as: 'festival'
                    }},
                    {$set: {
                        festival: {'$arrayElemAt': ['$festival', 0]}
                    }}
                ],
                as: 'query'
            }},
            {$set: {
                query: {'$arrayElemAt': ['$query', 0]}
            }}
        ], asEntry: true})
        if (!organization || !organization.query || organization.query.archived || !organization.query.verified || !organization.query.festival  ) {
            return {success: false}
        }

        return {success: true}
    } catch (e) {
        console.log('userflow get by inn', e);
        return {success: false, message: 'userflow check query failed', errorStatus: 500}
    }
}
