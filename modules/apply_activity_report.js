const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { query_pipeline, festival_pipeline } = require('../pipelines')
const getActForm = require('./getActForm')
const logger = require('../logger');

const moment = require('moment');

module.exports = async ({body, item, userObjId, signer}) => {
    try {
        const actReportId = getObjId(item)

        if (item && !actReportId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        if (actReportId) {
            const actquery = await getReport({mongoFilter: {_id: actReportId}})
            if (!actquery) {
                return {success: false, message: `заявка в мероприятие по ${item} не найдена`, errorStatus: 400}
            }

            if (!actquery.festival) {
                return {success: false, message: 'не найден активный фестиваль в заявке в мероприятие', errorStatus: 400}
            }
            const {_id, userId, festivalId, activityId, queryId, nominationId, ...patchReport} = body;
// console.log(date);
//             if (date && date.includes('/')) {
//                 patchReport.date = moment(date, 'DD/MM/YYYY').utc(true).toDate()
//                 console.log(patchReport.date);
//             }
            let queryUpd = await service.update({collection: 'activityreports', _id: actReportId}, patchReport)

            await logger({
                action: "put",
                collection: "activityreports",
                id: item || "",
                authorCollection: signer.collection || 'supervisors',
                authorId: signer._id,
                author: signer.email || "no_mail",
                patch: body
            })

            return {success: true, queryUpd: queryUpd}

        } else {
            const {_id, ...bodyQuery} = body;
            // if (date && date.includes('/')) {
            //     bodyQuery.date = moment(date, 'DD/MM/YYYY').utc().toDate()
            // }
            const { userId, festivalId, activityId, queryId, reportData, regionId, nominationId } = bodyQuery

            const festOdjId = getObjId(festivalId)
            const actObjId = getObjId(activityId)
            const queryObjId = getObjId(queryId)
            const nominationObjId = getObjId(nominationId)

            if (!festOdjId || !actObjId || !userObjId || !reportData || !nominationObjId) {
                return {success: false, message: 'проверьте параметры', errorStatus: 400}
            }

            const now = moment().format('YYYY.MM.DD')

            const userquery = await service.fetch({
                collection: 'queries',
                pipeline: [
                    {$match: queryObjId ? {_id: queryObjId, status: {$in: ["VALID", "ARCHIVED"]}} : {userId: userObjId, festivalId: festOdjId, status: {$in: ["VALID", "ARCHIVED"]}}},
                    {$lookup: {
                        from: 'festivals',
                        let: {fid: '$festivalId'},
                        pipeline: [
                            {$match: {
                                $expr: {$eq: ['$$fid', '$_id']},
                                dateStart: {$lte: now},
                                dateEnd: {$gte: now}
                            }},
                        ],
                        as: 'festival'
                    }},
                    {$set: {
                        festival: {'$arrayElemAt': ['$festival', 0]}
                    }}
                ],
                asEntry: true
            });

            if (!userquery) {
                return {success: false, message: `проверенная заявка в мероприятие для узера ${userObjId} не найдена`, errorStatus: 400}
            }

            if (!userquery.festivalId || userquery.festivalId.toString() !== festivalId) {
                return {success: false, message: `фестиваль из проверенной заявки  ${userquery._id} не совпадает с фестивалем в параметрах`, errorStatus: 400}
            }

            if (!userquery.festival) {
                return {success: false, message: `не найден активный фестиваль в заявке в фестиваль`, errorStatus: 400}
            }

            const actreport = await getReport({mongoFilter: {userId: userObjId, festivalId: festOdjId, activityId: actObjId, nominationId: nominationObjId}, checkOnly: true})

            if (actreport) {
                return {success: false, message: `Пользователь ${userObjId} уже подавал заявку в ${actreport._id} в мероприятие ${actObjId}`, errorStatus: 400}
            }

            if (!regionId) {
                bodyQuery.regionId = userquery.regionId
                if (!bodyQuery.regionId) {
                    const reg = userquery.organizationQueryData && userquery.organizationQueryData.address && userquery.organizationQueryData.address.kladr_id ? await service.fetch({collection: 'regions', kladr_id: userquery.organizationQueryData.address.kladr_id, asEntry: true}) : null;

                    bodyQuery.regionId = reg ? reg._id : null;
                }
            }

            if (!bodyQuery.userId) {
                bodyQuery.userId = userObjId
            }
            let saved = await service.save({collection: 'activityreports'}, bodyQuery)


            if (saved && saved._id) {
                const rep = await getActForm(bodyQuery)

                await logger({
                    action: "post",
                    collection: "activityreports",
                    id: saved._id || "",
                    authorCollection: signer.collection || 'supervisors',
                    authorId: signer._id,
                    author: signer.email || "no_mail",
                    patch: body
                })

                return rep
            } else {
                return {success: false, message: 'apply report failed', errorStatus: 500}
            }
        }
    } catch (e) {
        console.log('apply report failed', e);
        return {success: false, message: 'apply report failed', errorStatus: 500}
    }
}

const getReport = async ({mongoFilter, checkOnly=false}) => {
    try {
        const now = moment().format('YYYY.MM.DD')

        const pipeline = checkOnly ? [
            {$match: mongoFilter},
            {$project: {_id: 1}}
        ] : [
            {$match: mongoFilter},
            {$lookup: {
                from: 'festivals',
                let: {fid: '$festivalId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$fid', '$_id']},
                        dateStart: {$lte: now},
                        dateEnd: {$gte: now}
                    }},
                ],
                as: 'festival'
            }},
            {$lookup: {
                from: 'queries',
                let: {fid: '$queryId'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$fid', '$_id']}}},
                ],
                as: 'query'
            }},
            {$set: {
                festival: {'$arrayElemAt': ['$festival', 0]},
                query: {'$arrayElemAt': ['$query', 0]}
            }}
        ]
        const data = await service.fetch({collection: 'activityreports', pipeline: pipeline, asEntry: true})

       return data
    } catch (e) {
        console.log('getReport failed', e);
        return null
    }
}
