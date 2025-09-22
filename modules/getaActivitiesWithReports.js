const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);

        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }

        const { nominationId } = req.query;
        const nominationObjId = getObjId(nominationId);
        if (!nominationObjId) {
            return {success: false, message: 'проверьте параметр nominationId', errorStatus: 400}
        }

        const now = moment().format('YYYY.MM.DD')

        const festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: {
                dateStart: {$lte: now},
                dateEnd: {$gte: now}
            }},
            {$lookup: {
                from: 'nominations',
                let: {fid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$festivalId', '$$fid']}
                    }},
                    {$sort: {sort: 1}},
                    {$project: {name: 1, educationLevels: 1, sort: 1, description: 1, nominationtypes: 1, countStudents: 1}},
                    {$lookup: {
                        from: 'educationlevels',
                        let: {nid: '$_id'},
                        pipeline: [
                            {$match: {
                                $expr: {$eq: ['$nominationId', '$$nid']}
                            }},
                            {$project: {nominationId: 0}},
                            {$sort: {sort: 1}}
                        ],
                        as: 'educationLevels'
                    }},
                ],
                as: 'nominations'
            }},
            {$project: {_id: 1, minCountFinishedReports: 1, nominations: 1, commonCountingSettings: 1}}
        ], asEntry: true})
        if (!festival) {
            return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        const nom = festival.nominations.find(n => n._id && n._id.toString() === nominationId.toString());
        if (!nom) {
            return {success: false, message: `номинация ${nominationId} в фестивале не найдена`, errorStatus: 400}
        }

        const query = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                userId: userId,
                festivalId: festival._id,
                status: "VALID"
            }},
            {$project: {_id: 1, nominations: 1}}
        ], asEntry: true})

        if (!query) {
            return {success: false, message: 'валидная заявка в активный фестиваль не найдена', errorStatus: 400}
        }
        const querynom = query.nominations.find(n => n._id && n.handle && n._id.toString() === nominationId.toString());
        if (!querynom) {
            return {success: false, message: `номинация ${nominationId} ${nom.name} в заявке не выбиралась`, errorStatus: 400}
        }

        const activities = await service.fetch({collection: 'activities', pipeline: [
            {$match: {
                festivalId: festival._id,
                active: {$ne: false}
            }},
            {$sort: {sort: 1}},
            {$lookup: {
                from: 'activityreports',
                let: {aid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$aid', '$activityId']},
                        queryId: query._id,
                        nominationId: nominationObjId
                    }},
                    // {$lookup: {
                    //     from: 'nominations',
                    //     let: {nid: '$nominationId'},
                    //     pipeline: [
                    //         {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
                    //     ],
                    //     as: 'nomination'
                    // }},
                    // {$set: {
                    //     nomination: {'$arrayElemAt': ['$nomination', 0]},
                    // }}
                ],
                as: 'report'
            }},
            {$set: {
                report: {'$arrayElemAt': ['$report', 0]},
            }}
        ]})
        const reducedActs = activities.filter(act => !act.participants || !act.participants.nominations || !act.participants.nominations.length || !!act.participants.nominations.find(nid => nid.toString() === nominationId.toString())).reduce((acc, cur) => {
            const { report, countingCriterias, participants, name } = cur;
            const { sex } = participants

            const outAct = {
                "_id": cur._id,
                "name": name,
                "activityScore": null
            }
            let actScores = 0;

            if (report && report.reportData) {
                acc.summary.activitiesReported += 1;
                acc.summary.finishButtonEnabled = acc.summary.activitiesReported >= (festival.minCountFinishedReports || 2);

                let bonusScores = 0;
                let totalScores = 0;
                let studCount = null;

                for (let critkey in report.reportData) {
                    const valcrit = report.reportData[critkey];
                    const splitedKeys = critkey.split('_');
                    const critIndex = splitedKeys[1];
                    const levelIndex = splitedKeys[3];
                    const crit = countingCriterias[critIndex];
                    if (!crit) {
                        console.log('WRONG ACT', report );
                        continue
                    }
                    switch (crit.type) {
                        case "countStudents":
                            const adaptVal = isNaN(+valcrit) ? 0 : +valcrit
                            const keySex = splitedKeys[2];
                            if (!studCount) {
                                studCount = {}
                            }
                            if (!studCount[levelIndex]) {
                                studCount[levelIndex] = 0
                            }
                            if (sex === 'woman') {
                                if (keySex !== 'boys') {
                                    studCount[levelIndex] += adaptVal
                                }
                            } else if (sex === 'man') {
                                if (keySex !== 'girls') {
                                    studCount[levelIndex] += adaptVal
                                }
                            }else {
                                studCount[levelIndex] += adaptVal
                            }
                            break;
                        case 'countTeams':
                            const adaptCount = isNaN(+valcrit) ? 0 : +valcrit
                            const interval = crit.intervals.find(item => adaptCount >= item.min && adaptCount <= (item.max || 100000));

                            acc.summary.totalScores += interval ? interval.points : 0
                            acc.summary.activitiesScores += interval ? interval.points : 0
                            actScores += interval ? interval.points : 0
                        case "video":
                            const valcritlen = valcrit.length;
                            const summarykey = crit.mandatory ? "activitiesScores" : "bonusScores"
                            if (valcritlen) {
                                if (crit.pointsForEvery) {
                                    acc.summary.totalScores += valcritlen * crit.pointsForEvery
                                    acc.summary[summarykey] += valcritlen * crit.pointsForEvery
                                    actScores += valcritlen * crit.pointsForEvery
                                } else {
                                    if (crit.intervals) {
                                        const interval = crit.intervals.find(item => valcritlen >= item.min && valcritlen <= (item.max || 100000));

                                        acc.summary.totalScores += interval ? interval.points : 0
                                        acc.summary[summarykey] += interval ? interval.points : 0
                                        actScores +=  interval ? interval.points : 0
                                    } else {
                                        acc.summary.totalScores += crit.pointsForСompletion
                                        acc.summary[summarykey] += crit.pointsForСompletion
                                        actScores += crit.pointsForСompletion
                                    }
                                }
                            }
                            break;
                        case 'photo':
                        case 'publication':
                            const valcritlens = valcrit.length;
                            if (valcritlens && !crit.mandatory) {
                                if (crit.pointsForEvery) {
                                    acc.summary.totalScores += valcritlens * crit.pointsForEvery
                                    acc.summary.bonusScores += valcritlens * crit.pointsForEvery
                                    actScores += valcritlens * crit.pointsForEvery
                                } else if (crit.pointsForСompletion) {
                                    acc.summary.totalScores += crit.pointsForСompletion
                                    acc.summary.bonusScores += crit.pointsForСompletion
                                    actScores += crit.pointsForСompletion

                                }
                            }
                            break;
                        case 'pointsExtra':
                            const adaptExtra = isNaN(+valcrit) ? 0 : +valcrit
                            const inter = crit.intervals.find(item => adaptExtra >= item.min && adaptExtra <= (item.max || 100000));

                            acc.summary.totalScores += inter ? inter.points : 0
                            acc.summary.bonusScores += inter ? inter.points : 0
                            actScores +=  inter ? inter.points : 0

                    }

                }
                if (studCount) {
                    // if (outAct._id.toString() === '65390eccf6b21ac5e036a890') {
                    //     console.log(studCount);
                    // }
                    for (let level of querynom.levels) {
                        let queryStuds = 0;
                        const levelCount = studCount[level._id] || 0;
                        const wom = isNaN(+level.woman) ? 0 : +level.woman
                        const man = isNaN(+level.man) ? 0 : +level.man
                        if (sex === 'woman') {
                            queryStuds += wom
                        } else if (sex === 'man') {
                            queryStuds += man
                        } else {
                            queryStuds += (man + wom)
                        }
                        acc.summary.totalScores += queryStuds ? Math.round(levelCount / queryStuds * 10) : 0
                        acc.summary.activitiesScores += queryStuds ? Math.round(levelCount / queryStuds * 10) : 0
                        actScores +=  queryStuds ? Math.round(levelCount / queryStuds * 10) : 0
                    }

                    // if (outAct._id.toString() === '65390eccf6b21ac5e036a890') {
                    //     console.log('actScores', actScores, 'studCount', studCount);
                    // }
                }
            }
            acc.activities.push({...outAct, activityScore: actScores || null})
            return acc
        }, {
            "festivalId": festival._id,
            "queryId": query._id,
            "summary": {
                "activitiesReported": 0,
                "activitiesScores": 0,
                "bonusScores": 0,
                "totalScores": 0,
                "finishButtonEnabled": false
            },
            "activities": []
        })
        return {
            success: true,
            data: reducedActs
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
