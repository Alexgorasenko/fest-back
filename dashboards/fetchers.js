const service = require('../service')

module.exports = {
    public: async (festId, email) => {
        const userEntry = await service.fetch({collection: 'publicusers', email: email, asEntry: true})
        if(userEntry) {
            const query = await service.fetch({
                collection: 'queries',
                pipeline: [
                    {$match: {
                        festivalId: festId,
                        userId: userEntry._id,
                        status: "VALID"
                    }}
                ],
                asEntry: true
            })
            const acts = await service.fetch({
                collection: 'activities',
                pipeline: [
                    {$match: {
                        isExtra: true,
                        festivalId: festId,
                    }},
                    {$project: {_id: 1}}
                ]
            })

            if(query && query.organizationQueryData && query.organizationQueryData.address) {
                const { kladr_id } = query.organizationQueryData.address.region

                if(kladr_id) {
                    const totalQueries = await service.count({collection: 'queries', festivalId: festId, status: {$in: ['VALID', 'NOT_VALID']}})
                    const neighbourQueries = await service.count({collection: 'queries', festivalId: festId, status: {$in: ['VALID', 'NOT_VALID']}, 'organizationQueryData.address.region.kladr_id': kladr_id})
                    // const actualNominations = query.nominations.map((n, i) => n.handle ? i : null).reduce((acc, ni) => {
                    //     if(ni !== null) {
                    //         acc[`nominations.${ni}.handle`] = true
                    //     }
                    //     return acc
                    // }, {})
                    const totalValidQueries = await service.fetch({
                        collection: 'queries',
                        pipeline: [
                            {$match: {
                                status: 'VALID',
                                //'organizationQueryData.address.region.kladr_id': kladr_id,
                                festivalId: festId,
                            }},
                            {$project: {_id: 1, 'organizationQueryData.address.region.kladr_id': 1, nominations: 1}},
                            {$set: {
                                kladr_id: '$organizationQueryData.address.region.kladr_id'
                            }},
                            {$project: {_id: 1, kladr_id: 1, nominations: 1}}
                        ]
                    })

                    const totalValid = totalValidQueries.length;

                    const neighbourParticipantsIds = totalValidQueries.filter(q => q['kladr_id'] === kladr_id).map(q => q._id);

                    const neighbourValid = neighbourParticipantsIds.length;

                    const totalActivities = await service.count({collection: 'activityreports', activityId: {$nin: acts.map(act => act._id)}})

                    const neighbourActivities = await service.count({
                        collection: 'activityreports',
                        festivalId: festId,
                        queryId: {$in: neighbourParticipantsIds},
                        activityId: {$nin: acts.map(act => act._id)}
                    })

                    /*const totalValid = await service.count({collection: 'queries', festivalId: festId, status: 'VALID'}) //...actualNominations,
                    const neighbourValid = await service.count({
                        //...actualNominations,
                        collection: 'queries',
                        festivalId: festId,
                        status: 'VALID',
                        'organizationQueryData.address.region.kladr_id': kladr_id
                    })

                    const totalActivities = await service.count({collection: 'activityreports', activityId: {$nin: acts.map(act => act._id)}})
                    const neighbourParticipants = await service.fetch({
                        collection: 'queries',
                        pipeline: [
                            {$match: {
                                status: 'VALID',
                                'organizationQueryData.address.region.kladr_id': kladr_id,
                                festivalId: festId,
                            }},
                            {$project: {_id: 1}}
                        ]
                    })

                    const neighbourActivities = await service.count({
                        collection: 'activityreports',
                        festivalId: festId,
                        queryId: {$in: neighbourParticipants.map(np => np._id)},
                        activityId: {$nin: acts.map(act => act._id)}
                    });*/
                    const handledNoms = query.nominations.filter(n => n.handle);
                    const mapednoms = [];

                    for (let nom of handledNoms) {
                        // const filter = {
                        //     festivalId: festId,
                        //     status: 'VALID',
                        //     $and: [
                        //         {"nominations._id": nom._id},
                        //         {"nominations.handle": true}
                        //     ]
                        // }

                        const totalValidNomQueries = totalValidQueries.filter(q => {
                            const n = q.nominations.find(nn => nn._id && nn._id.toString() === nom._id.toString());
                            return n && n.handle
                        })

                        const totalValidNom = totalValidNomQueries.length;

                        const neighbourValidNomQueries = totalValidNomQueries.filter(q => q['kladr_id'] === kladr_id);
                        const neighbourValidNom = neighbourValidNomQueries.length;

                        const totalActivitiesNom = await service.count({collection: 'activityreports', activityId: {$nin: acts.map(act => act._id)}, nominationId: nom._id})

                        const neighbourActivitiesNom = await service.count({
                            collection: 'activityreports',
                            activityId: {$nin: acts.map(act => act._id)},
                            nominationId: nom._id,
                            festivalId: festId,
                            queryId: {$in: neighbourValidNomQueries.map(np => np._id)}
                        });

                        mapednoms.push({
                            name: nom.name,
                            sort: nom.sort,
                            totalValid: totalValidNom,
                            neighbourValid: neighbourValidNom,
                            totalActivities: totalActivitiesNom,
                            neighbourActivities: neighbourActivitiesNom
                        })
                    }
                    /*"totalQueries": 5923,
                       "neighbourQueries": 75,
                       "totalValid": 5629,
                       "neighbourValid": 74,
                       "totalActivities": 411,
                       "neighbourActivities": 1,
                       "nomnations": [
                           {
                               "name": "Общее образование",
                               "sort": 1,
                               "totalValid": 5628,
                               "neighbourValid": 74,
                               "totalActivities": 321,
                               "neighbourActivities": 1
                           },
                           {
                               "name": "Дошкольное образование",
                               "sort": 2,
                               "totalValid": 5628,
                               "neighbourValid": 74,
                               "totalActivities": 83,
                               "neighbourActivities": 0
                           }
                       ]*/
                    return {
                        totalQueries,
                        neighbourQueries,
                        totalValid,
                        neighbourValid,
                        totalActivities,
                        neighbourActivities,
                        nominations: mapednoms
                    }
                }
            } else {
                return {success: false, message: `Валидная заявка в фестиваль не найдена`, errorStatus: 400}
            }
        } else {
            return {success: false, message: `Пользователь не найден`, errorStatus: 401}
        }
    },
    supervisor: async (festId, email) => {
        const svrEntry = await service.fetch({collection: 'supervisors', email: email, asEntry: true})
        const kladrs = (svrEntry.roles.superadmin || svrEntry.roles.rfu_admin) ? null : svrEntry.roles.region_admin ? svrEntry.roles.region_admin.canView.concat(svrEntry.roles.region_admin.canEdit) : null
        const regions = await service.fetch({collection: 'regions', kladr_id: kladrs ? {$in: kladrs} : {$ne: null}})

        const regionsObj = regions.reduce((acc, reg) => {
            if(!acc[reg.kladr_id]) {
                acc[reg.kladr_id] = {
                    region: reg.name,
                    acceptedQueries: 0,
                    byNomination: {}
                }
            }

            return acc
        }, {})
        const rawQueries = await service.fetch({
            collection: 'queries',
            pipeline: [
                {$match: {
                    status: 'VALID',
                    festivalId: festId,
                    //finishedReports: {$ne: null},
                    'organizationQueryData.address.region.kladr_id': kladrs ? {$in: kladrs} : {$nin: [null, ""]}
                }}
            ]
        })
        const totalsQueries = {
            totalAccepted: 0,
            byNomination: {}
        }

        const queries = Object.entries(rawQueries.reduce((acc, query) => {
            if(query.organizationQueryData) {

                const { kladr_id } = query.organizationQueryData.address.region

                totalsQueries.totalAccepted += 1;
                if(acc[kladr_id]) {
                    acc[kladr_id].acceptedQueries ++

                    for(let nom of query.nominations.filter(n => n.handle)) {
                        //if (query.finishedReports[nom._id]) {
                            const nominationKey = nom.nominationtype ? `${nom.name}_${nom.nominationtype.name}` : nom.description ? `${nom.name}_${nom.description}` : `${nom.name}`;

                            if(typeof(acc[kladr_id].byNomination[nominationKey]) === 'undefined') {
                                acc[kladr_id].byNomination[nominationKey] = 0
                            }

                            if(typeof(totalsQueries.byNomination[nominationKey]) === 'undefined') {
                                totalsQueries.byNomination[nominationKey] = 0
                            }

                            totalsQueries.byNomination[nominationKey] ++
                            acc[kladr_id].byNomination[nominationKey] ++
                        //}
                    }
                    return acc
                }

            }

            return acc
        }, {...regionsObj})).map(e => ({...e[1], kladr_id: e[0]}))

        const queryIds = kladrs ? rawQueries.map(q => q._id) : null

const repMatch = queryIds ? { queryId: {$in: queryIds}} : {festivalId:festId}

        const rawReports = await service.fetch({
            collection: 'activityreports',
            pipeline: [
                {$match: repMatch},
                {$group: {
                    _id: '$queryId',
                    reports: {$push: '$$ROOT'}
                }},
                {$lookup: {
                    from: 'queries',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'queryData'
                }},
                {$unwind: {
                    path: '$queryData',
                    preserveNullAndEmptyArrays: true
                }}
            ]
        })

        const totalsActivities = {
            totalReported: 0,
            reportedRanges: {},
            byNomination: {},
            totalFinishedParticipants: 0,
            confirmedMinActivitiesQty: 0,
            confirmedMinActivities: {},
            childrenParticipiedQty: 0,
            childrenParticipied: {}
        }
        const reportedRangesObj = {}

        const activitiesObj = regions.reduce((acc, reg) => {
            if(!acc[reg.kladr_id]) {
                acc[reg.kladr_id] = {
                    region: reg.name,
                    totalActivities: 0,
                    byNomination: {},
                    finishedParticipants: 0,
                    finishedParticipantsByNomination: {}
                }
            }

            return acc
        }, {})

        const actsCount = await service.count({collection: 'activities', festivalId: festId })
        const ranges = [[1,2],[3,5],[6,10],[11,15],[16, (actsCount || 19)]]
        const activities = Object.entries(rawReports.reduce((acc, query) => {
            if(query && query.queryData && query.reports && query.reports.length) {
                const { finishedReports, organizationQueryData } = query.queryData;
                const isFinished = finishedReports && typeof(finishedReports) === "object";
                totalsActivities.totalReported += query.reports.length
/*
                for(let report of query.reports.filter(r => r.reportData)) {
                    for(let rkey in report.reportData) {
                        if((rkey.includes('students')) && report.reportData[rkey]) {
                            const v = parseInt(report.reportData[rkey])
                            if(!isNaN(v)) {
                                totalsActivities.childrenParticipiedQty += v
                            }
                        }
                    }
                }
*/

                const { kladr_id } = organizationQueryData.address.region
                const finishedQueryReports = isFinished ? query.reports.filter(r => r.nominationId && !!finishedReports[r.nominationId]) : []
                //const range = ranges.find(r => query.reports.length >= r[0] && query.reports.length <= r[1])
                // if(range) {
                //     const rangeKey = range.join('_')
                //     if(!totalsActivities.reportedRanges[rangeKey]) {
                //         totalsActivities.reportedRanges[rangeKey] = 0
                //     }
                //
                //     totalsActivities.reportedRanges[rangeKey] ++
                // }
                // if (query.reports.length && !range) {
                //     console.log("not range", query.reports.length);
                // }

                const splitted = query.reports.length ? query.reports.reduce((acc, cur) => {
                    //if (finishedReports[cur.nominationId]) {
                        if (!acc[cur.nominationId]) {
                            acc[cur.nominationId] = 0
                        }
                        acc[cur.nominationId] += 1;
                        //totalsActivities.totalReported += 1
                    //}

                    return acc
                }, {}) : null

                if (splitted) {
                    for (let nid in splitted) {
                        const val = splitted[nid];
                        const rng = ranges.find(r => val >= r[0] && val <= r[1]);

                        if (rng) {
                            const rangeKey = rng.join('_')
                            if(!reportedRangesObj[rangeKey]) {
                                reportedRangesObj[rangeKey] = 0
                            }

                            reportedRangesObj[rangeKey] ++
                        }
                    }
                }

                if(acc[kladr_id]) {
                    acc[kladr_id].totalActivities += query.reports.length

                    for(let nom of query.queryData.nominations.filter(n => n.handle)) {
                        const filtredReports = query.reports.filter(r => r.nominationId && r.nominationId.toString() === nom._id.toString() && r.reportData)

                        const finishedReportsData = isFinished ? filtredReports.filter(r => finishedReports[r.nominationId]) : []

                        const nominationKey = nom.nominationtype ? `${nom.name}_${nom.nominationtype.name}` : nom.description ? `${nom.name}_${nom.description}` : `${nom.name}`;

                        if(typeof(totalsActivities.byNomination[nominationKey]) === 'undefined') {
                            totalsActivities.byNomination[nominationKey] = 0
                            totalsActivities.childrenParticipied[nominationKey] = 0
                        }

                        if(typeof(acc[kladr_id].byNomination[nominationKey]) === 'undefined') {
                            acc[kladr_id].byNomination[nominationKey] = 0
                            acc[kladr_id].finishedParticipantsByNomination[nominationKey] = 0
                        }

                        totalsActivities.byNomination[nominationKey] += filtredReports.length
                        acc[kladr_id].byNomination[nominationKey] += filtredReports.length

                        if(filtredReports.length) {
                            for(let report of filtredReports) {
                                for(let rkey in report.reportData) {
                                    if((rkey.includes('students')) && report.reportData[rkey]) {
                                        const v = parseInt(report.reportData[rkey])
                                        if(!isNaN(v)) {
                                            totalsActivities.childrenParticipied[nominationKey] += v
                                            totalsActivities.childrenParticipiedQty += v
                                        }
                                    }
                                }
                            }

                            if(filtredReports.length > 2) {
                                totalsActivities.confirmedMinActivitiesQty ++

                                if(typeof(totalsActivities.confirmedMinActivities[nominationKey]) === 'undefined') {
                                    totalsActivities.confirmedMinActivities[nominationKey] = {qty: 0, byRegion: {}}
                                }

                                totalsActivities.confirmedMinActivities[nominationKey].qty ++
                                if(typeof(totalsActivities.confirmedMinActivities[nominationKey].byRegion[regionsObj[kladr_id].region]) === 'undefined') {
                                    totalsActivities.confirmedMinActivities[nominationKey].byRegion[regionsObj[kladr_id].region] = 0
                                }

                                totalsActivities.confirmedMinActivities[nominationKey].byRegion[regionsObj[kladr_id].region] ++
                            }

                            if (finishedReportsData.length) {
                                totalsActivities.totalFinishedParticipants ++
                                acc[kladr_id].finishedParticipants ++
                                acc[kladr_id].finishedParticipantsByNomination[nominationKey] ++
                            }
                        }

                    }

                }
            }

            return acc
        }, {...activitiesObj})).map(e => ({...e[1], kladr_id: e[0]}))

        const countAverages = (regions, queries) => {
            return regions.map(r => {
                const queriesItem = queries.find(q => q.kladr_id === r.kladr_id)
                return {
                    ...r,
                    averageActivities: queriesItem && queriesItem.acceptedQueries ? r.totalActivities/queriesItem.acceptedQueries : 0
                }
            })
        }
        const reportedRanges = {};
        const rngsKeys = Object.keys(reportedRangesObj).sort();
        for (let rng of rngsKeys) {
            reportedRanges[rng] = reportedRangesObj[rng]
        }
        return {
            activities: {
                ...totalsActivities,
                reportedRanges: reportedRanges,
                averageActivities: totalsActivities.totalReported/totalsQueries.totalAccepted,
                regions: countAverages(activities, queries).sort((a, b) => b.totalActivities - a.totalActivities)
            },
            queries: {...totalsQueries, regions: queries.sort((a, b) => b.acceptedQueries - a.acceptedQueries)}
        }
    }
}
