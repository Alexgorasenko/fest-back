const service = require('../service');
const { getObjId, sampleReducer } = require('../utils')
const { settings_pipeline, festival_pipeline } = require('../pipelines')
const moment = require('moment');

module.exports = async (match) => {
    try {
        const query = await service.fetch({collection: 'activityreports', pipeline: [
            {$match: match},
            {$lookup: {
                from: 'festsettings',
                let: {fid: '$festivalId', aid: '$activityId'},
                pipeline: [
                    {$match: {
                        $expr: {$and: [
                            {$eq: ['$$aid', '$sampleId']},
                            {$eq: ['$$fid', '$festivalId']}
                        ]}
                    }},
                ],
                as: 'setting'
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
                setting: {'$arrayElemAt': ['$setting', 0]},
                activity: {'$arrayElemAt': ['$activity', 0]},
            }}
        ], asEntry: true})

        if (!query) {
            return {success: false, message: 'заявка не найдена', errorStatus: 400}
        }
console.log(query);
        if (!query.setting) {
            return {success: false, message: 'для заявки не найдены настройки', errorStatus: 400}
        }

        const countingsRed = await sampleReducer("countings")
        const criteriasRed = await sampleReducer("criterias")

        const {data, ...settingInfo} = query.setting;

        let patchedData = {};

        for (let key in data) {
            switch (true) {
                case (['common', 'main', 'mandatory', 'additional'].includes(key)):
                    patchedData[key] = data[key].map(obj => {
                        const mapd = {};
                        for (let k in obj) {
                            mapd[k] = obj[k];
                            if (k === '_id') {
                                mapd.criteria = criteriasRed[obj[k]]
                            } else if (k === 'countingId') {
                                mapd.counting = countingsRed[obj[k]]
                            }
                        }
                        return mapd
                    })
                    break
                default:
                    patchedData[key] = data[key]
                    break
            }
        }

        settingInfo.data = patchedData

        return {success: true, data: {...query, setting: settingInfo }}
    } catch (e) {
        console.log('mod getActQuery failed', e);
        return {success: false, message: 'mod getActQuery failed', errorStatus: 500}
    }
}
