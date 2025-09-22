const service = require('../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../utils')
const remap_activities = require('./remap_activities')
const moment = require('moment');

module.exports = async (item, signer, reqquery) => {
    try {
        // const userId = getObjId(signer.uid);
        //
        // if (!userId) {
        //     return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        // }

        const { nominationId } = reqquery;

        const nominationObjId = getObjId(nominationId);
        if (!nominationObjId) {
            return {success: false, message: 'проверьте параметр nominationId', errorStatus: 400}
        }
        const now = moment().format('YYYY.MM.DD')
        const match = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        const festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match},
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
            }}
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
                _id: getObjId(item),
                festivalId: festival._id,
                status: "VALID"
            }},
            {$project: {_id: 1, nominations: 1, director: 1, organizationQueryData: 1, contactPerson: 1 }}
        ], asEntry: true})

        if (!query) {
            return {success: false, message: 'валидная заявка в активный фестиваль не найдена', errorStatus: 400}
        }
        const querynom = query.nominations.find(n => n._id && n.handle && n._id.toString() === nominationId.toString());
        if (!querynom) {
            return {success: false, message: `номинация ${nominationId} ${nom.name} в заявке не выбиралась`, errorStatus: 400}
        }

        let nomination = querynom.name;
        if (querynom.nominationtype) {
            nomination += ` (${querynom.nominationtype.name})`
        }
        let descriptionForReports = festival.descriptionForReports || festival.titleGenetive || "Форма подведения итогов Всероссийского фестиваля «‎Футбол в школе»"

        const activitiesData = await service.fetch({collection: 'activities', pipeline: [
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
        let total = 0;
        let totalCountFinished = 0;
        const head = [
            {content: '№', width: 2},
            {content: 'Мероприятие', width: 25},
            {content: 'Дата проведения', width: 9}
        ]

        const studesCommonObj = {
            content: 'Количество обучающихся',
            width: 25,
            groups: []
        }

        const actsCommonObj = {
            content: 'Количество участников мероприятия',
            width: 25,
            groups: []
        }

        const queryStudesCommonObj = {
            width: 25,
            groupInnerWidth: "33.3",
            groups: []
        }
        const queryStudentsByLevel = {}
        const deflevelStudents = {}

        for (let level of querynom.levels) {

            const groupObj = {
                content: level.levelData.name,
                levelId: level.levelData._id,
                columns: [
                    {content: 'Всего'},
                    //{content: 'Девочки'}
                ]
            }
            actsCommonObj.groups.push(groupObj)

            studesCommonObj.groups.push({...groupObj, columns: [...groupObj.columns, {content: 'Девочки'}]});

            const wom = isNaN(+level.woman) ? 0 : +level.woman
            const man = isNaN(+level.man) ? 0 : +level.man

            queryStudesCommonObj.groups.push([{value: wom + man}, {value: wom}])

            queryStudentsByLevel[level.levelData._id] = {wom, man, all: wom + man};

            deflevelStudents[level.levelData._id] = [{value: 0}, {value: 0}];
        }

        head.push(studesCommonObj);
        head.push(actsCommonObj);
        head.push(
            {content: 'Баллы за проведение мероприятия', width: 10},
            {content: 'Доп. баллы', width: 5},
            {content: 'ВСЕГО', width: 4}
        );

        const reducedActs = {}

        const filtredActs = activitiesData.filter(act => !act.participants || !act.participants.nominations || !act.participants.nominations.length || !!act.participants.nominations.find(nid => nid.toString() === nominationId.toString()))

        const extras = []

        const activities = [];
        for (let cur of filtredActs) {

            const { report, countingCriterias, participants, name, sort, isExtra } = cur;
            const { sex } = participants
            const mapdQueryStudesCommonObj = sex === 'woman' ? {...queryStudesCommonObj, groups: queryStudesCommonObj.groups.map(gr => [gr[1]])} : queryStudesCommonObj
            const outAct = [
                {width: 2, value: totalCountFinished + 1},
                {width: 25, value: name},
                {width: 9, value: ''},
                mapdQueryStudesCommonObj,
            ]

            const actCommonObj = {
                width: 25,
                groupInnerWidth: "33.3",
                groups: []
            }

            let actScores = 0;

            if (report && report.reportData) {
                if (report.date) {
                    outAct.splice(2, 1, {width: 9, value: report.date})
                }
                let bonusScores = 0;
                let totalScores = 0;
                let activitiesScores = 0;
                let studCount = null;

                for (let critkey in report.reportData) {
                    const valcrit = report.reportData[critkey];
                    //console.log(report.reportData, critkey);
                    const splitedKeys = critkey.split('_');
                    const critIndex = splitedKeys[1];
                    const levelIndex = splitedKeys[3];
                    const crit = countingCriterias[critIndex];
                    if (!crit) {
                        //console.log('WRONG ACT', report );
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
                            // if (sex === 'woman') {
                            //     if (keySex !== 'boys') {
                            //         studCount[levelIndex] += adaptVal
                            //     }
                            // } else if (sex === 'man') {
                            //     if (keySex !== 'girls') {
                            //         studCount[levelIndex] += adaptVal
                            //     }
                            // }else {
                            //     studCount[levelIndex] += adaptVal
                            // }
                            studCount[levelIndex] += adaptVal
                            break;
                        case 'countTeams':
                            const adaptCount = isNaN(+valcrit) ? 0 : +valcrit
                            const interval = crit.intervals && crit.intervals.length ? crit.intervals.find(item => adaptCount >= +item.min && adaptCount <= (+item.max || 100000)) : null;

                            totalScores += interval ? +interval.points : 0
                            activitiesScores += interval ? +interval.points : 0
                            actScores += interval ? +interval.points : 0
                            break
                        case "video":
                            const valcritlen = valcrit && valcrit.length ? valcrit.filter(val => !!val).length : 0;
                            if (valcritlen) {
                                if (crit.pointsForEvery) {
                                    if (studCount && studCount[levelIndex]) {
                                        totalScores += valcritlen * crit.pointsForEvery
                                        if (crit.mandatory) {
                                            activitiesScores += valcritlen * crit.pointsForEvery
                                        } else {
                                            bonusScores += valcritlen * crit.pointsForEvery
                                        }
                                        actScores += valcritlen * crit.pointsForEvery
                                    }

                                } else {
                                    if (crit.intervals) {
                                        const interval = crit.intervals && crit.intervals.length ? crit.intervals.find(item => valcritlen >= +item.min && valcritlen <= (+item.max || 100000)) : null;

                                        totalScores += interval ? +interval.points : 0

                                        if (crit.mandatory) {
                                            activitiesScores += interval ? +interval.points : 0
                                        } else {
                                            bonusScores += interval ? +interval.points : 0
                                        }

                                        actScores +=  interval ? +interval.points : 0
                                    } else {
                                        totalScores += +crit.pointsForСompletion
                                        if (crit.mandatory) {
                                            activitiesScores += +crit.pointsForСompletion
                                        } else {
                                            bonusScores += +crit.pointsForСompletion
                                        }

                                        actScores += +crit.pointsForСompletion
                                    }
                                }
                            }
                            break;
                        case 'photo':
                        case 'publication':
                            const valcritlens = valcrit && valcrit.length ? valcrit.filter(val => !!val).length : 0;
                            if (valcritlens && !crit.mandatory) {
                                if (crit.pointsForEvery) {
                                    totalScores += valcritlens * crit.pointsForEvery
                                    bonusScores += valcritlens * crit.pointsForEvery
                                    actScores += valcritlens * crit.pointsForEvery
                                } else if (crit.pointsForСompletion) {
                                    totalScores += +crit.pointsForСompletion
                                    bonusScores += +crit.pointsForСompletion
                                    actScores += +crit.pointsForСompletion

                                }
                            }
                            break;
                        case 'pointsExtra':
                            const adaptExtra = isNaN(+valcrit) ? 0 : +valcrit
                            const inter = crit.intervals && crit.intervals.length ? crit.intervals.find(item => adaptExtra >= item.min && adaptExtra <= (item.max || 100000)) : null;

                            totalScores += inter ? +inter.points : 0
                            bonusScores += inter ? +inter.points : 0
                            actScores +=  inter ? +inter.points : 0
                            break
                    }

                }
                //if (studCount) {
                    // if (outAct._id.toString() === '65390eccf6b21ac5e036a890') {
                    //     console.log(studCount);
                    // }
                    for (let level of querynom.levels) {
                        if (studCount) {
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

                            actCommonObj.groups.push(
                                [{value: levelCount}] //,{value: wom}
                            )


                            totalScores += queryStuds ? Math.min((levelCount / queryStuds * 10), 10) : 0
                            activitiesScores += queryStuds ? Math.min((levelCount / queryStuds * 10), 10) : 0
                            actScores +=  queryStuds ? Math.min((levelCount / queryStuds * 10), 10) : 0


                        } else {
                            actsCommonObj.groups.push(
                                [{value: 0}] //,{value: 0}
                            )
                        }
                    }

                    // if (outAct._id.toString() === '65390eccf6b21ac5e036a890') {
                    //     console.log('actScores', actScores, 'studCount', studCount);
                    // }
                //}
                outAct.push(
                    actCommonObj,
                    {width: 10, value: +activitiesScores.toFixed(1) || '0', cellClass: 'value-cell'},
                    {width: 5, value: +bonusScores.toFixed(1) || '0', cellClass: 'value-cell'},
                    {width: 4, value: +totalScores.toFixed(1) || '0', cellClass: 'value-cell'}
                )
                total += +totalScores.toFixed(1) || 0;
                //console.log('totalScores', totalScores, 'total',total);
                //activities.push({...outAct, activityScore: actScores || null})
                if (actScores) {
                    if (isExtra && festival.finishedVideoActivityId && cur._id.toString() ===  festival.finishedVideoActivityId.toString()) {
                        extras.push({
                            label: name,
                            cells: [
                                {value: 0, width:52.5},
                                {value: +totalScores.toFixed(1) || '0', width: 26.5},
                                {value: +totalScores.toFixed(1) || '0', width:21}
                            ]
                        })
                    } else {
                        activities.push(outAct)
                        totalCountFinished += 1;
                    }
                }
            }
            //return acc
        }
        // , {
        //     "festivalId": festival._id,
        //     "queryId": query._id,
        //     "summary": {
        //         "activitiesReported": 0,
        //         "activitiesScores": 0,
        //         "bonusScores": 0,
        //         "totalScores": 0,
        //         "finishButtonEnabled": false
        //     },
        //     "activities": []
        // })
        // const extras = [
        //     {
        //         label: 'Итоговый ролик о проведении мероприятия',
        //         cells: [
        //             {value: 0, width: 41.6},
        //             {value: 10, width: 20.8},
        //             {value: 10, width: 37.5}
        //         ]
        //     },
        //     {
        //         label: 'Количество проведенных мероприятий',
        //         cells: [
        //             {value: 0, width: 41.6},
        //             {value: 10, width: 20.8},
        //             {value: 10, width: 37.5}
        //         ]
        //     }
        // ]
        if (totalCountFinished && festival.commonCountingSettings && festival.commonCountingSettings.totalCountFinished) {
            let val = 0;
            const inter = festival.commonCountingSettings.totalCountFinished.intervals.find(item => totalCountFinished >= +item.min && totalCountFinished <= (+item.max || 100000));

            extras.push({
                label: festival.commonCountingSettings.totalCountFinished.title,
                cells: [
                    {value: 0, width: 52.5},
                    {value: inter ? inter.points : '0', width: 26.5},
                    {value: inter ? inter.points : '0', width: 21}
                ]
            })

            total += inter ? +inter.points : 0
        }
        const { director, organizationQueryData, contactPerson} = query
        const signatures = {
            top: {
                position: "РУКОВОДИТЕЛЬ", //director && director.post ? director.post : '',
                orgName: organizationQueryData ? (organizationQueryData.fullName || ''): '',
                name: ''//director && director.fullname ? director.fullname : '',
            },
            bottom: {
                name: query.contactPerson ? query.contactPerson.fullname : ''
            }
        }
        return {
            success: true,
            data: remap_activities({ head, activities, extras, total: (total.toFixed(1) || 0), signatures, nomination, descriptionForReports: descriptionForReports })
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
