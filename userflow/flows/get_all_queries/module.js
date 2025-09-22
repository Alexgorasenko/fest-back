const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'
const moment = require('moment');

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid)

        const queries = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                userId: userId,
                archived: false
            }},
            {$lookup: {
                from: 'organizations',
                let: {oid: '$organizationId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$oid', '$_id']}
                    }}
                ],
                as: 'organization'
            }},
            {$lookup: {
                from: 'attachments',
                let: {id: '$_id'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$id', '$sampleId']}}},
                ],
                as: 'attachments'
            }},
            {$lookup: {
                from: 'festivals',
                let: {oid: '$festivalId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$oid', '$_id']}
                    }}
                ],
                as: 'festival'
            }},
            {$lookup: {
                from: 'regions',
                let: {rid: '$regionId'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$rid', '$_id']}}},
                ],
                as: 'region'
            }},
            {$set: {
                festival: {'$arrayElemAt': ['$festival', 0]},
                organization: {'$arrayElemAt': ['$organization', 0]},
                region: {'$arrayElemAt': ['$region', 0]}
            }}
        ]})


        return {success: true, data: queries.map(q => {
            const {festival, ...query} = q;
            if (festival) {
                const dateStart = festival.dateStart && isCorrectFormat(festival.dateStart, outformat) ? moment(festival.dateStart, outformat).format(informat) : "";
                const dateEnd = festival.dateEnd && isCorrectFormat(festival.dateEnd, outformat) ? moment(festival.dateEnd, outformat).format(informat) : "";

                return {...query, festival: {...festival, dateStart: dateStart, dateEnd: dateEnd}}

            } else {
                return {...query, festival: null}
            }
        })}
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

const isCorrectFormat = (dateString, format) => {
    return moment(dateString, format, true).isValid()
}
