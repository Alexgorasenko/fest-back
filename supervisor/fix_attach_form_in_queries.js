const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { patchQuery } = require('../modules')
const sender = require('../mails/sender')

const moment = require('moment');

module.exports = async (req, res) => {
    try {
        const queries = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                attachmentFormId: null
            }},
            {$project: {_id: 1}},
            {$lookup: {
                from: 'attachments',
                let: {id: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$id', '$sampleId']},
                        sampleType: "queries"
                    }},
                    {$project: {_id: 1}},
                    {$sort: {_id: -1}}
                ],
                as: 'attachment'
            }},
            {$set: {
                attachment: {$arrayElemAt: ['$attachment', 0]}
            }},
            {$match: {
                attachment: {$ne: null, $exists: true}
            }},
        ]})
console.log(queries.length);
        const out = []
        for (let q of queries) {
            let queryUpd = await service.update({collection: 'queries', _id: q._id}, {attachmentFormId: q.attachment._id})
            out.push({_id: q._id, patch: {attachmentFormId: q.attachment._id}, queryUpd: queryUpd})
        }
        res.json(out)

    } catch (e) {
        console.log('SV patch query failed', e);
        res.status(500).json({success: false, message: 'SV patch query failed'})
        return {success: false, message: 'SV patch query failed', errorStatus: 500}
    }
}
