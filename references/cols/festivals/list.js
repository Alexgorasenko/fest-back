const service = require('../../../service');
const moment = require('moment');

const { settings_pipeline } = require('../../../pipelines')
const { getFestFullData, getFestPreloadData } = require('../../../modules')
const outformat = 'YYYY.MM.DD'
const informat = 'DD.MM.YYYY'

module.exports = async (req, id) => {
    try {

        const list = await service.fetch({collection: 'festivals', pipeline: [
            {$match: {}},
            {$lookup: {
                from: 'queries',
                let: {fid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$fid', '$festivalId']},
                        status: "VALID"
                    }},
                    {$limit: 1},
                    {$project: {_id: 1}},
                ],
                as: 'query'
            }},
            {$set: {
                query: {'$arrayElemAt': ['$query', 0]},
            }}
            //...settings_pipeline
        ]});
        //const entry = await getFestFullData({_id: id})
        return {success: true, data: list.map(f => {
            const {query, ...entry} = f;
            const dateStart = entry.dateStart && isCorrectFormat(entry.dateStart, outformat) ? moment(entry.dateStart, outformat).format(informat) : "";
            const dateEnd = entry.dateEnd && isCorrectFormat(entry.dateEnd, outformat) ? moment(entry.dateEnd, outformat).format(informat) : "";

            return {...entry, dateStart: dateStart, dateEnd: dateEnd, deletionIsAllowed: !query}
        })}

    } catch (e) {
        console.log('ref festivals', e);
        return {success: false, message: 'ref festivals failed', errorStatus: 500}
    }
}

const isCorrectFormat = (dateString, format) => {
    return moment(dateString, format, true).isValid()
}
