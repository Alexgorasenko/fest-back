const service = require('../service')
const { extractRegions } = require('./utils')

module.exports = async (req, res) => {
    const { roles } = req

    if(!roles) {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    } else {

        try {
            const data = await getPublicDocs()
            res.json(data ? {success: true, data: data} : {success: false})
        } catch (e) {
            console.log('err getting docs', e);
            res.status(500).json({success: false, msg: 'ошибка получения данных'})
        }
    }
}

const getPublicDocs = async (isSecond=false) => {

    let alldocs = await service.fetch({collection: 'publicdocs', pipeline: [
        {$match: {}},
        {$lookup: {
            from: 'attachments',
            localField: 'policy.policyFileId',
            foreignField: '_id',
            as: 'policyFile'
        }},
        {$lookup: {
            from: 'attachments',
            localField: 'persData.persDataFileId',
            foreignField: '_id',
            as: 'persDataFile'
        }},
        {$lookup: {
            from: 'attachments',
            localField: 'userMsg.userMsgFileId',
            foreignField: '_id',
            as: 'userMsgFile'
        }},
        {$lookup: {
            from: 'attachments',
            localField: 'mainInfoFileId',
            foreignField: '_id',
            as: 'mainInfoFile'
        }},
        {$lookup: {
            from: 'attachments',
            localField: 'certificateFileId',
            foreignField: '_id',
            as: 'certificateFile'
        }},
        {$set: {
            policyFile: {'$arrayElemAt': ['$policyFile', 0]},
            persDataFile: {'$arrayElemAt': ['$persDataFile', 0]},
            userMsgFile: {'$arrayElemAt': ['$userMsgFile', 0]},
            mainInfoFile: {'$arrayElemAt': ['$mainInfoFile', 0]},
            certificateFile: {'$arrayElemAt': ['$certificateFile', 0]},
        }}
    ], asEntry: true})
    if (!alldocs && !isSecond) {
        const cr = await service.save({collection: 'publicdocs'}, {});
        alldocs = await getPublicDocs(true)
    }
    return alldocs
}
