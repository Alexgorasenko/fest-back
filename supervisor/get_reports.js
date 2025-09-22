const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const moment = require('moment');
const {extractRegions} = require("./utils");

module.exports = async (req, res) => {
    try {
        const { region_admin, superadmin, rfu_admin } = req.roles
        const { limit=30, page=0, activityId, nominationId } = req.query

        const regions = await extractRegions(region_admin)

        if (!superadmin && !rfu_admin && region_admin && !regions) {
            res.status(401).json({success: false, message: 'проверьте доступные регионы', errorStatus: 401})
            return {}
        }

        if (activityId && nominationId) {
            const objActId = getObjId(activityId);
            const nomOnId = getObjId(nominationId)
            if (!objActId) {
                res.status(400).json({success: false, message: 'проверьте activityId', errorStatus: 400})
                return {}
            }
            if (!nomOnId) {
                res.status(400).json({success: false, message: 'проверьте nominationId', errorStatus: 400})
                return {}
            }

            if (!superadmin && !rfu_admin && regions) {
                // const queries = await service.fetch({collection: 'queries', pipeline: [
                //     {$match: {
                //         status: "VALID",
                //         "organizationQueryData.address.region.kladr_id":{$in: regions}
                //     }}
                // ]})

                const reports = await service.fetch({collection: 'activityreports', pipeline: [
                    {$match: {
                        activityId:  objActId,
                        nominationId: nomOnId
                    }},
                    {$sort: {_id: -1}},
                    {$lookup: {
                        from: 'queries',
                        let: {aid: '$queryId'},
                        pipeline: [
                            {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                            {$project: {"organizationQueryData.name": 1, "organizationQueryData.fullName": 1, "organizationQueryData.inn": 1, "organizationQueryData.address": 1}}
                        ],
                        as: 'query'
                    }},
                    {$set: {
                        query: {'$arrayElemAt': ['$query', 0]},
                    }},
                    {$match: {
                        "query.organizationQueryData.address.region.kladr_id":{$in: regions.kladrs}
                    }}
                ]})

                res.json({
                    success: true,
                    data: reports
                })

            } else {
                const reports = await service.fetch({collection: 'activityreports', pipeline: [
                    {$match: {
                        activityId:  objActId,
                        nominationId: nomOnId
                    }},
                    {$sort: {_id: -1}},
                    {$skip: page * limit},
                    {$limit: +limit},
                    {$lookup: {
                        from: 'queries',
                        let: {aid: '$queryId'},
                        pipeline: [
                            {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                            {$project: {"organizationQueryData.name": 1, "organizationQueryData.fullName": 1, "organizationQueryData.inn": 1, "organizationQueryData.address": 1}}
                        ],
                        as: 'query'
                    }},
                    {$set: {
                        query: {'$arrayElemAt': ['$query', 0]},
                    }}
                ]})
                res.json({
                    success: true,
                    data: reports
                })
            }


            return {
                success: true
            }

        }
        const now = moment().format('YYYY.MM.DD')
        const matchFest = {$or: [{
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }, {}]}
        const festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$sort: {_id: -1}},
            {$project: {_id: 1}},
            {$lookup: {
                from: 'nominations',
                let: {fid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$festivalId', '$$fid']}
                    }},
                    {$project: {name: 1, desc: 1, sort: 1}},
                    {$sort: {sort: 1}},
                ],
                as: 'nominations'
            }},
            {$lookup: {
                from: 'activities',
                let: {fid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$fid', '$festivalId']},
                    }},
                    {$project: {name: 1, desc: 1, sort: 1, participants: 1}},
                    {$sort: {sort: 1}},
                ],
                as: 'activities'
            }}
        ], asEntry: true})

        if (!festival) {
            res.status(400).json({success: false, message: 'активный фестиваль не найден', errorStatus: 400})
            return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        if (!festival.nominations || !festival.nominations.length) {
            res.status(400).json({success: false, message: 'номинации не найдены', errorStatus: 400})
            return {success: false, message: 'номинации не найдены', errorStatus: 400}
        }

        if (!festival.activities || !festival.activities.length) {
            res.status(400).json({success: false, message: 'мероприятия не найдены', errorStatus: 400})
            return {success: false, message: 'мероприятия не найдены', errorStatus: 400}
        }

        const match = {
            festivalId: festival._id
        }

        let allReport = 0;
        const outData = [];
        let queries = null;

        if (!superadmin && !rfu_admin && regions) {
            queries = await service.fetch({collection: 'queries', pipeline: [
                {$match: {
                    status: "VALID",
                    "organizationQueryData.address.region.kladr_id":{$in: regions.kladrs},
                    ...match
                }},
                {$sort: {_id: -1}},
                {$project: {_id: 1}}
            ]});

            if (!queries || !queries.length) {
                res.status(400).json({success: false, message: 'валидные заявки для доступных регионов не найдены', errorStatus: 400})
                return {success: false, message: 'валидные заявки для доступных регионов не найдены', errorStatus: 400}
            }
        }

        const filterQueries = queries && queries.length ? {
            queryId: {$in: queries.map(q => q._id)}
        } : {}

        for (let nom of festival.nominations) {
            let nomReport = 0;
            const filtred = festival.activities.filter(act => !act.participants || !act.participants.nominations || !act.participants.nominations.length || !!act.participants.nominations.find(nid => nid.toString() === nom._id.toString()))

            const mapedAct = []

            for (let act of filtred) {
                const filter = {
                    activityId:  act._id,
                    nominationId: nom._id,
                    ...filterQueries
                }
                const reportsCount = await service.count({collection: 'activityreports', pipeline: [
                    {$match: filter},
                    {$sort: {_id: 1}}
                ]});

                nomReport += reportsCount;
                allReport += reportsCount;
                const totalPages =  Math.ceil(reportsCount / limit);

                const reports = await service.fetch({collection: 'activityreports', pipeline: [
                    {$match: filter},
                    {$sort: {_id: -1}},
                    {$limit: +limit},
                    {$lookup: {
                        from: 'queries',
                        let: {aid: '$queryId'},
                        pipeline: [
                            {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                            {$project: {"organizationQueryData.name": 1, "organizationQueryData.fullName": 1,}}
                        ],
                        as: 'query'
                    }},
                    {$set: {
                        query: {'$arrayElemAt': ['$query', 0]},
                    }},
                    {$project: {_id: 1,query: 1,activityId: 1, nominationId: 1}}
                ]})

                mapedAct.push({
                    activity: act,
                    reportsCount: reportsCount,
                    totalPages: totalPages,
                    reports: reports,
                })
            }
            outData.push({
                activities: mapedAct,
                nomData: nom,
                reportsCount: nomReport
            })
        }

        // if (region_admin && region_admin.canView && region_admin.canView.length) {
        //     match.regionId = {$in: region_admin.canView.map(id => getObjId(id))}
        // }
        res.json({
            success: true,
            data: {
                list: outData,
                allReport: allReport,
                limit: limit
            }
        })

        return {
            success: true,
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        res.status(500).json({success: false, message: 'svr get_reports failed', errorStatus: 500})
        return {success: false, message: 'svr get_reports failed', errorStatus: 500}
    }
}
