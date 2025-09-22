const moment = require('moment')
const service = require('../service')
//const xlsx = require('xlsx');
const xlsx = require('xlsx-js-style');
const { getObjId } = require('../utils')

module.exports = async (req, res) => {
    const { rfu_admin, superadmin } = req.roles

    if (!rfu_admin && !superadmin) {
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

    const regionsData = await service.fetch({collection: 'queries', pipeline: [
        {$match: {
            festivalId: festival._id,
            finishedReports: {$ne: null},
            status: "VALID",
            //'organizationQueryData.address.region.kladr_id': region.kladr_id
        }},
        {$project: {organizationQueryData: 1, regionId: 1, nominations: 1, finishedReports: 1}},
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
        {$group: {
            _id: '$organizationQueryData.address.region.kladr_id',
            //queriesCount: { $sum: 1 },
            // reportsUploaded: {
            //     $cond: {if: { $gt: [ "$reportsCount", 0 ] }, then: {$sum: 1}, else: {$sum: 0} }
            // },
            //reportsCountTotal: { $sum: "$reportsCount"},
            queries: { $push: "$$ROOT" }
        }},
        {$lookup: {
            from: 'regions',
            let: {kladr_id: '$_id'},
            pipeline: [
                {$match: {
                    $expr: {$eq: ['$$kladr_id', '$kladr_id']},
                }},
                {$project: {name: 1}}
            ],
            as: 'region'
        }},
        {$set: {
            region: {'$arrayElemAt': ['$region', 0]}
        }},
        {$set: {
            name: '$region.name'
        }},
        {$project: {region: 0}}
        //{$sort: {'region.name': 1}}
    ]});
    // const sortedQueries = queries.sort((a, b) => a.region.name.toLowerCase() > b.region.name.toLowerCase() ? 1 : -1)

    const mapedRegionsData = regionsData.map(({queries, ...reg}) => {
        const mapedQueries = [];
        let queriesCount = 0;
        let reportsCountTotal = 0;

        for (let {reports, ...q} of queries) {
            if (q.finishedReports && typeof(q.finishedReports === "object")) {
                for (let nid in q.finishedReports) {
                    if (q.finishedReports[nid]) {
                        queriesCount += 1;
                    }
                }
                const filtredReports = reports.filter(r => r.nominationId && q.finishedReports[r.nominationId]);
                const reportsCount = filtredReports.length;
                reportsCountTotal += reportsCount;
                const mq = {...q, reports: filtredReports, reportsCount: reportsCount}
                mapedQueries.push(mq)
            }
        }

        return {...reg, queries: mapedQueries, reportsCountTotal: reportsCountTotal, queriesCount: queriesCount}
    })

    // res.json(regionsData[0]);
    // return
    const actsObj = festival.activities.reduce((acc, cur) => {
        if (cur._id && !acc[cur._id]) {
            acc[cur._id] = cur;
        }
        return acc
    }, {})
    const mapped = mapper(mapedRegionsData, noms, actsObj, festival.commonCountingSettings)

// res.json(mapped)
// return
    const workSheet = xlsx.utils.aoa_to_sheet(mapped);
    const workBook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

    const out = xlsx.write(workBook, {type:'base64', bookType: 'xlsx'});

    res.writeHead(200, {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename=*'+"Report"+'*.xlsx'
    });
    res.end(new Buffer(out, 'base64'));

}

const mapper = (regionsData, noms, actsObj, commonCountingSettings ) => {
    const outdata = [];
    const festTotalCountFinished = commonCountingSettings ? commonCountingSettings.totalCountFinished : null;

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
    const reducedNomsData = {}
    const points = {}

    for (let nom of mappedNoms) {
        if (nom.nominationtypes && nom.nominationtypes.length) {
            for (let t of nom.nominationtypes) {
                let key = nom._id.toString();

                if (t.key) {
                    key += "_" + t.key;
                }

                if (!reducedNomsData[key]) {
                    reducedNomsData[key] = []
                    points[key] = []
                    headersTables[key] = [`Победитель в номинации "${nom.name}" (${t.name})`, "Адрес", "Баллы", "Место"]
                }
            }
        } else {
            if (!reducedNomsData[nom._id]) {
                reducedNomsData[nom._id] = []
                points[nom._id] = []

                headersTables[nom._id] = [`Победитель в номинации "${nom.name}"`, "Адрес", "Баллы", "Место"]
            }
        }
    }
    //const reducedQueries = queries.reduce((acc, query) => {
    const outData = [];

    for (let i = 0; i < regionsData.length; i++) {
        const region = regionsData[i];
        let reportsUploaded = 0;
        let studentsCount = 0;
        const mapedData = [region.name, region.queriesCount];
        const regionNomsData = JSON.parse(JSON.stringify(reducedNomsData));

        for (let query of region.queries) {
            try {
                const { nominations, organizationQueryData, attachmentReports, reportsCount} = query;
                if (reportsCount === 0) {
                    continue
                }
                reportsUploaded += 1;

                const handledNoms = nominations.filter(n => n.handle);
                const isColored = !!(handledNoms.length > 1);

                for (let nom of handledNoms) {
                    const out = [
                        organizationQueryData.name,
                        organizationQueryData.address.display,
                    ]

                    let key = nom._id.toString();

                    if (nom.nominationtype && nom.nominationtype.countStudents && nom.nominationtype.countStudents.min !== "undefined" && nom.nominationtype.countStudents.max !== "undefined") {
                        key += `_${nom.nominationtype.countStudents.min}_${nom.nominationtype.countStudents.max}`
                    }
                    // if (attachmentReports && attachmentReports[nom._id]) {
                    //     return acc
                    // }

                    const reports = query.reports.filter(r => r.nominationId && r.nominationId.toString() === nom._id.toString());

                    if (!reports.length) {
                        continue
                    }
                    let countReports = 0;
                    let countStudents = 0;
                    let countPoints = 0;
                    let totalCountFinished = 0;

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
                                                const interval = crit.intervals.length ? crit.intervals.find(item => valcritlen >= +item.min && valcritlen <= (+item.max || 100000)) : null;

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
                                studentsCount += levelCount;
                            }
                        }

                        if (reportPoints) {
                            countPoints += +reportPoints.toFixed(1) || 0;
                            countReports += 1;
                        }
                    }
                    if (countPoints) {
                        if (countReports && festTotalCountFinished && festTotalCountFinished.intervals && festTotalCountFinished.intervals.length) {
                            const inter = festTotalCountFinished.intervals.find(item => countReports >= +item.min && countReports <= (+item.max || 100000));
                            countPoints += inter ? +inter.points : 0
                        }

                        regionNomsData[key].push([...out, countPoints, isColored]) //, !!(handledNoms.length > 1)
                    }
                }

            } catch(e) {
                console.log('err', e);
                //return null
            }
            //return acc
        }

        mapedData.push(reportsUploaded, region.reportsCountTotal, studentsCount);

        for (let key in regionNomsData) {
            const champ = regionNomsData[key].sort((a, b) => a[2] - b[2])[0];
            if (champ) {
                if (!points[key].includes(champ[2])) {
                    points[key].push(champ[2])
                }
                regionNomsData[key] = champ
            } else {
                regionNomsData[key] = null
            }
        }

        mapedData.push(regionNomsData)
        outData.push(mapedData)
    } //, reducedData)
    const allheaders = [
        "№",
        "Субъект",
        "Количество учреждений участников",
        "Загрузили отчеты",
        "Количество проведенных мероприятий",
        "Количество участий в мероприятии"
    ]

    for (let key in headersTables) {
        allheaders.push(...headersTables[key])
    }

    const reducedOut = outData.reduce((acc, cur) => {
        const regionNomsData = cur[5]
        const out = cur.slice(0, 5);

        for (let key in headersTables) {
            const champ = regionNomsData[key]

            const places = points[key].sort((a, b) => b - a);

            if (champ) {
                const isColored = champ[3]
                const place = places.findIndex(a => a === champ[2]);
                const ch = champ.slice(0, 3);
                const row = isColored ? [...ch, (place+1)].map(r => ({v: r, t: "s", s: {fill: {fgColor: {rgb: "EEE8AA"}}}})) : [...ch, (place+1)]

                out.push(...row)
            } else {
                out.push("","","","")
            }
        }
        acc.push(out)
        return acc;
    }, []).sort((a, b) => a[0] && b[0] && a[0].toLowerCase() > b[0].toLowerCase() ? 1 : -1).map((cur, ind) => ([ind+1, ...cur]))

    return [allheaders, ...reducedOut]
}
