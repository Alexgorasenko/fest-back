const moment = require('moment')
const service = require('../service')
//const xlsx = require('xlsx');
const xlsx = require('xlsx-js-style');

const { getObjId } = require('../utils')

const { extractRegions } = require('./utils')

const hasRegionAccess = (regionId, regions) => {
    const matched = regions.find(r => r._id && r._id.toString() === regionId)
    return matched ? matched.kladr_id : null
}

module.exports = async (req, res) => {
    const { rfu_admin, superadmin, region_admin } = req.roles
    const { regionId, nominationId } = req.query;
    const regionObjId = regionId ? getObjId(regionId) : null

    if (!regionObjId) {
        res.status(400).json({success: false, message: 'Check params'})
        return {}
    }
    const region = await service.fetch({collection: 'regions', _id: regionObjId})

    if (!region) {
        res.status(400).json({success: false, message: 'region Check params'})
        return {}
    }

    const regions = await extractRegions(region_admin)
    const isRegionAdmin = regions && regions.kladrs && regions.kladrs.length
    const requestedKladr = isRegionAdmin ? hasRegionAccess(regionId, regions.ids) : null


    if (!rfu_admin && !superadmin && !isRegionAdmin && !requestedKladr) {
        res.status(403).json({success: false, message: 'Invalid role'})
        return {}
    }
    const now = moment().format('YYYY.MM.DD')
    const matchFest = {$or: [{
        dateStart: {$lte: now},
        dateEnd: {$gte: now}
    }, {}]}
    const festival = await service.fetch({collection: 'festivals', pipeline: [
        {$match: matchFest},
        {$sort: {_id: -1}},
        {$lookup: {
            from: 'activities',
            let: {fid: '$_id'},
            pipeline: [
                {$match: {
                    $expr: {$eq: ['$festivalId', '$$fid']}
                }},
                {$sort: {sort: 1}}
            ],
            as: 'activities'
        }},
        //{$project: {_id: 1, activities: 1}}
    ], asEntry: true})

    if (!festival) {
        res.status(400).json({success: false, message: 'активный фестиваль не найден'})
        return {}
    }

    const noms = await service.fetch({collection: 'nominations', pipeline: [
        {$match: {festivalId: festival._id}},
        {$sort: {sort: -1}},
        {$lookup: {
            from: 'educationlevels',
            let: {nid: '$_id'},
            pipeline: [
                {$match: {
                    $expr: {$eq: ['$nominationId', '$$nid']}
                }},
                {$sort: {sort: 1}}
            ],
            as: 'levels'
        }},
    ]});

    if (!noms || !noms.length || noms.find(nom => !nom.levels || !nom.levels.length)) {
        res.status(400).json({success: false, message: 'в активном фестивале не корректно заполнены номинации'})
        return {}
    }
    const queriesFull = await service.fetch({collection: 'queries', pipeline: [
        {$match: {
            festivalId: festival._id,
            status: "VALID",
            finishedReports: {$ne: null},
            'organizationQueryData.address.region.kladr_id': region.kladr_id
        }},
        {$project: {organizationQueryData: 1, regionId: 1, nominations: 1, director: 1, contactPerson: 1, attachmentReports: 1, finishedReports: 1}},
        {$lookup: {
            from: 'activityreports',
            let: {aid: '$_id'},
            pipeline: [
                {$match: {
                    $expr: {$eq: ['$$aid', '$queryId']},
                    nominationId: {$in: noms.map(n => n._id)}
                }},
                {$project: {reportData: 1, activityId: 1, nominationId: 1, date: 1}}
            ],
            as: 'reports'
        }},
        // {$set: {
        //     reportsCount: {$size: '$reports'}
        // }},
        // {$match: {
        //     reportsCount: {$gt: 0}
        // }},
        //{$limit: 5},
    ]})
    //res.json(queries);
    const queries = queriesFull.map(({reports, ...q}) => {
        const filtred = reports.filter(r => r.nominationId && q.finishedReports[r.nominationId]);
        return filtred.length ? {...q, reports: filtred} : null
    }).filter(q => !!q)

    if (!queries || !queries.length) {
        res.status(400).json({success: false, message: 'валидные заявки для региона не найдены'})
        return {}
    }
//console.log(queries.find(q => q.organizationQueryData.inn === "2210004492"));
    const actsObj = festival.activities.reduce((acc, cur) => {
        if (cur._id && !acc[cur._id]) {
            acc[cur._id] = cur;
        }
        return acc
    }, {})

    const mapped = mapper(queries, noms, actsObj)

//     res.json(mapped);
// return
    const workBook = xlsx.utils.book_new();

    const workSheet = xlsx.utils.aoa_to_sheet(mapped);
    xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

    const out = xlsx.write(workBook, {type:'base64', bookType: 'xlsx'});

    res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=*'+"Report"+'*.xlsx'
    });
    res.end(new Buffer(out, 'base64'));

}

const mapper = (queries, noms, actsObj) => {
    const outdata = [];
    const mappedNoms = noms.map((n) => {
        const {nominationtypes, countStudents, ...nomination} = n;

        let patchedData = {...nomination};
        const mapdTypes = []
        if (countStudents && countStudents.length) {
            const sorted =  countStudents.sort((a, b) => a - b);
            for (let i = 0; i < sorted.length; i++) {
                const val = sorted[i];
                const prev = sorted[i-1]

                if (i === 0) {
                    mapdTypes.push({
                        "name": `менее ${val} учеников`,
                        "key": "0_" + val.toString()
                    })
                }

                if (prev && val) {
                    mapdTypes.push({
                        "name": `от ${prev} до ${val} учеников`,
                        "key": `${prev}_${val}`
                    })
                }

                if (i === sorted.length - 1) {
                    mapdTypes.push({
                        "name": `более ${val} учеников`,
                        "key": `${val}_10000000`
                    })
                }

            }
        }
        patchedData.nominationtypes = mapdTypes;
        return patchedData//{...setting, data: patchedData}
    })

    const headersTables = {};
    const reducedData = {}

    for (let nom of mappedNoms) {

        if (nom.nominationtypes && nom.nominationtypes.length) {
            for (let t of nom.nominationtypes) {
                let key = nom._id.toString();

                if (t.key) {
                    key += "_" + t.key;
                }

                if (!reducedData[key]) {
                    reducedData[key] = []
                    headersTables[key] = ["Место", `Номинация "${nom.name}" (${t.name})`, "Адрес",	"Количество  проведенных мероприятий", "Количество  участников мероприятий", "Баллы"]
                }
            }
        } else {
            if (!reducedData[nom._id]) {
                reducedData[nom._id] = []
                headersTables[nom._id] = ["Место", `Номинация "${nom.name}"`, "Адрес",	"Количество  проведенных мероприятий", "Количество  участников мероприятий", "Баллы"]
            }
        }

    }
    //const reducedQueries = queries.reduce((acc, query) => {
    for (let query of queries) {
        try {
            const { nominations, organizationQueryData, attachmentReports, finishedReports} = query;

            const handledNoms = nominations.filter(n => n._id && n.handle && finishedReports[n._id]);

            for (let nom of handledNoms) {
                const out = [
                    (organizationQueryData.name || organizationQueryData.fullName),
                    organizationQueryData.address.display,
                ]

                let key = nom._id.toString();
                //const mapedNom = mappedNoms.find(n => n._id.toString() === key);

                if (nom.nominationtype && nom.nominationtype.countStudents && nom.nominationtype.countStudents.min !== "undefined" && nom.nominationtype.countStudents.max !== "undefined") {
                    key += `_${nom.nominationtype.countStudents.min}_${Math.min(nom.nominationtype.countStudents.max, 10000000)}`
                }
                // if (attachmentReports && attachmentReports[nom._id]) {
                //     return acc
                // }
                // if (organizationQueryData.inn === "2210004492") {
                //     console.log('key', key, out);
                //     console.log('mapedNom', mapedNom);
                //     console.log(reducedData[key]);
                // }
                const reports = query.reports.filter(r => r.nominationId && r.nominationId.toString() === nom._id.toString());

                if (!reports.length) {
                    continue
                }
                let countReports = 0;
                let countStudents = 0;
                let countPoints = 0;

                for (report of reports) {
                    const act = actsObj[report.activityId];
                    // console.log(report, 'act', act);

                    if (!act || !report.reportData) {
                        continue
                    }
                    let reportPoints = 0;
                    let reportStudents = 0;
                    let studCount = null;

                    const { countingCriterias, participants, isExtra } = act;
                    const { sex } = participants

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

                                studCount[levelIndex] += adaptVal
                                break;
                            case 'countTeams':
                                const adaptCount = isNaN(+valcrit) ? 0 : +valcrit
                                const interval = crit.intervals && crit.intervals.length ? crit.intervals.find(item => adaptCount >= +item.min && adaptCount <= (+item.max || 100000)) : null;

                                reportPoints += interval ? +interval.points : 0
                                break
                            case "video":
                                const valcritlen = valcrit && valcrit.length ? valcrit.filter(val => !!val).length : 0;
                                if (valcritlen) {
                                    if (crit.pointsForEvery) {
                                        if (studCount && studCount[levelIndex]) {
                                            reportPoints += valcritlen * crit.pointsForEvery
                                        }
                                    } else {
                                        if (crit.intervals) {
                                            const interval = crit.intervals && crit.intervals.length ? crit.intervals.find(item => valcritlen >= +item.min && valcritlen <= (+item.max || 100000)) : null;

                                            reportPoints += interval ? +interval.points : 0

                                        } else {
                                            reportPoints += +crit.pointsForСompletion
                                        }
                                    }
                                }
                                break;
                            case 'photo':
                            case 'publication':
                                const valcritlens = valcrit && valcrit.length ? valcrit.filter(val => !!val).length : 0;
                                if (valcritlens && !crit.mandatory) {
                                    if (crit.pointsForEvery) {
                                        reportPoints += valcritlens * crit.pointsForEvery
                                    } else if (crit.pointsForСompletion) {
                                        reportPoints += +crit.pointsForСompletion
                                    }
                                }
                                break;
                            case 'pointsExtra':
                                const adaptExtra = isNaN(+valcrit) ? 0 : +valcrit
                                const inter = crit.intervals && crit.intervals.length ? crit.intervals.find(item => adaptExtra >= +item.min && adaptExtra <= (+item.max || 100000)) : null;

                                reportPoints += inter ? +inter.points : 0
                                break
                        }

                    }

                    for (let level of nom.levels) {
                        if (studCount) {
                            const levelCount = studCount[level._id] || 0;
                            reportStudents += levelCount;
                            let queryStuds = 0;
                            const wom = isNaN(+level.woman) ? 0 : +level.woman
                            const man = isNaN(+level.man) ? 0 : +level.man
                            if (sex === 'woman') {
                                queryStuds += wom
                            } else if (sex === 'man') {
                                queryStuds += man
                            } else {
                                queryStuds += (man + wom)
                            }
                            reportPoints += queryStuds ? Math.min((levelCount / queryStuds * 10), 10) : 0

                        }
                    }

                    if (reportPoints) {
                        countPoints += +reportPoints.toFixed(1) || 0;
                        if (!isExtra) {
                            countReports += 1;
                            countStudents += reportStudents;
                        }
                    } else {
                        continue
                    }
                }

                reducedData[key].push([...out, countReports, countStudents, countPoints, !!(handledNoms.length > 1)])
            }

        } catch(e) {
            console.log('err', e);
            //return null
        }
        //return acc
    } //, reducedData)

    let maxindex = 0
    const allheaders = []
    for (let key in reducedData) {

        reducedData[key] = reducedData[key].sort((a, b) => b[4] - a[4])
        if (reducedData[key].length > maxindex) {
            maxindex = reducedData[key].length;
        }
        allheaders.push(...headersTables[key])
    }

    outdata.push(allheaders)

    for (let key in reducedData) {
        for (let ind=0; ind < maxindex; ind++) {
            if (!outdata[ind+1]) {
                outdata[ind+1] = [];
            }
            //console.log(reducedData[key][ind]);
            if (reducedData[key][ind]) {
                const row = [(ind+1), ...reducedData[key][ind].slice(0, 5)]
                if (reducedData[key][ind][5]) {
                    outdata[ind+1].push(...row.map(r => ({v: r, t: "s", s: {fill: {fgColor: {rgb: "EEE8AA"}}}})))
                } else {
                    outdata[ind+1].push(...row)
                }
            } else {
                outdata[ind+1].push("", "", "", "","","")
            }
        }
    }

    return outdata
    //return reducedData

}
