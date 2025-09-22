const moment = require('moment')
const service = require('../service')
//const xlsx = require('xlsx');
const xlsx = require('xlsx-js-style');
const { getObjId, sampleReducer } = require('../utils')

const { extractRegions } = require('./utils')

// const hasRegionAccess = (regionId, regions) => {
//     const matched = regions.find(r => r._id && r._id.toString() === regionId)
//     return matched ? matched.kladr_id : null
// }

module.exports = async (req, res) => {
    try {
        const { rfu_admin, superadmin, region_admin } = req.roles
        const { regionId, nominationId } = req.query;
        const actNomId = nominationId ? getObjId(nominationId) : regionId ? getObjId(regionId) : null
        if (!actNomId) {
            res.status(400).json({success: false, message: 'Check params'})
            return {}
        }

        const regions = await extractRegions(region_admin)
        let isRegionAdmin = null
        let kladrs = null;

        if (!rfu_admin && !superadmin ) {
            if (regions && regions.kladrs && regions.kladrs.length) {
                kladrs = regions.kladrs;
                isRegionAdmin = true;
            } else {
                res.status(403).json({success: false, message: 'Invalid role'})
                return {}
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
            {$project: {_id: 1, activities: 1}}
        ], asEntry: true})

        if (!festival) {
            res.status(400).json({success: false, message: 'активный фестиваль не найден'})
            return {}
        }
        const nom = await service.fetch({collection: 'nominations', pipeline: [
            {$match: {
                festivalId: festival._id,
                _id: actNomId
            }},
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
        ], asEntry: true});
        if (!nom || !nom.levels || !nom.levels.length) {
            res.status(400).json({success: false, message: 'в активном фестивале не корректно заполнена номинация ' + nominationId})
            return {}
        }
        // if (!noms || !noms.length || noms.find(nom => !nom.levels || !nom.levels.length)) {
        //     res.status(401).json({success: false, message: 'в активном фестивале не корректно заполнены номинации'})
        //     return {}
        // }



        // for (let nom of noms) {
        //     headersTable.push(`Участие в номинации "${nom.name.toLowerCase()}"`)
        //     for (let level of nom.levels) {
        //         headersTable.push(`Количество обучающихся (${level.name.toLowerCase()}) (укажите 0 если нет)`);
        //
        //         headersTable.push(`Из них девочек (${level.name.toLowerCase()}) (укажите 0 если нет)`);
        //
        //     }
        // }
        // res.json(headersTable)
        // return
        const queriesFilter = {
            festivalId: festival._id,
            status: "VALID",
            //finishedReports: {$ne: null},
            $and: [
                {"nominations._id": actNomId},
                {"nominations.handle": true}
            ]
            //_id: getObjId("6538a81ce3fea6ca674fdc9a")
        }

        if (isRegionAdmin) {
            queriesFilter['organizationQueryData.address.region.kladr_id'] = {$in: kladrs}
        }
        const queriesAll = await service.fetch({collection: 'queries', pipeline: [
            {$match: queriesFilter},
            {$project: {organizationQueryData: 1, regionId: 1, nominations: 1, director: 1, contactPerson: 1, attachmentReports: 1, finishedReports: 1}},
            {$lookup: {
                from: 'activityreports',
                let: {aid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$aid', '$queryId']},
                        nominationId: actNomId
                    }},
                    {$project: {reportData: 1, activityId: 1, nominationId: 1, date: 1}}
                ],
                as: 'reports'
            }},
            {$set: {
                reportsCount: {$size: '$reports'}
            }},
            {$match: {
                reportsCount: {$gt: 0}
            }},
            //{$limit: 5},

        ]})
        const queries = queriesAll.filter(q => {
            const n = q.nominations.find(nn => nn._id && nn._id.toString() === nom._id.toString());
            return n && n.handle //&& q.finishedReports && q.finishedReports[n._id]
        })
    //res.json(queries);
        const regsObj = await sampleReducer("regions", "kladr_id");
        const mapped = mapper(queries, nom, festival.activities, regsObj);
// res.json(mapped)
// return {}
        const workSheet = xlsx.utils.aoa_to_sheet(mapped);
        const workBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

        const out = xlsx.write(workBook, {type:'base64', bookType: 'xlsx'});
        res.writeHead(200, {
            'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'Content-Disposition': 'attachment; filename='+"Report"+'.xlsx'
        });
        res.end(new Buffer(out, 'base64'));
    } catch (e) {
        console.log('report failed', e);
        res.status(400).json({success: false, msg:"ошибка построения отчета"})
    } finally {

    }

}

const mapper = (queries, nom, activities, regsObj) => {
    const outdata = [];

    const headersTable = [
        "Название школы",
        "Ссылка на школу",
        "Страна",
        "Федеральный округ",
        "Субъект",
        "Город",
        "Почтовый адрес",
        "email",
        "ФИО ответственного лица",
    ];

    //const nomsReduced = {}
    const levelsReduced = {}
    const levelsData = [...nom.levels]
    // for (let cur of noms) {
    //     console.log(cur.name);
    //     headersTable.push("Скан-копия отчета в номинации " + cur.name.toLowerCase())
    //
    //     const {levels, ...nom} = cur;
    //     nomsReduced[cur._id] = nom;
    //     for (let l of levels) {
    //         console.log(l);
    //         levelsReduced[l._id] = l
    //         levelsData.push(l)
    //     }
    // }
    // console.log(cur.name);
    headersTable.push("Скан-копия отчета в номинации " + nom.name.toLowerCase())

    for (let l of nom.levels) {
        levelsReduced[l._id] = l
    }

    for (let act of activities) {
        headersTable.push(act.name + " дата проведения мероприятия")
        // for (let cur of noms) {
        //     const {levels, ...nom} = cur;
        //     for (let l of levels) {
        //         headersTable.push(`${act.name} количество участников (${l.name.toLowerCase()})`)
        //     }
        // };
        for (let crit of act.countingCriterias) {
            switch (crit.type) {
                case "countStudents":
                    for (let l of levelsData) {
                        headersTable.push(`${act.name} ${crit.reportDescription} (${l.name.toLowerCase()})`)
                    }
                    break;
                case "video":
                    if (crit.pointsForEvery) {
                        for (let l of levelsData) {
                            headersTable.push(`${act.name} ${crit.reportDescription} (${l.name.toLowerCase()})`)
                        }
                    } else {
                        headersTable.push(`${act.name} ${crit.reportDescription}`)
                        continue
                    }
                    break;
                case 'photo':
                case 'countTeams':
                case 'pointsExtra':
                case 'publication':
                    headersTable.push(`${act.name} ${crit.reportDescription}`)
                    break;
            }
        }
    };
    //return headersTable
outdata.push(headersTable)
    for (let query of queries) {
        const region = regsObj[query.organizationQueryData.address.region.kladr_id] || {}
        try {
            const handledNoms = query.nominations.filter(n => n.handle);
            const isColored = !!(handledNoms.length > 1);

            const out = [
                (query.organizationQueryData.name || query.organizationQueryData.fullName || ''),
                query.organizationQueryData.site,
                "Россия",
                region.federal_district,
                region.name,
                query.organizationQueryData.address.city.name,
                query.organizationQueryData.address.display,
                (query.director ? query.director.email : query.contactPerson ? query.contactPerson.email : ''),
                (query.contactPerson ? query.contactPerson.fullname : ''),
            ]

            if (query.attachmentReports && query.attachmentReports[nom._id]) {
                out.push(query.attachmentReports[nom._id])
            } else {
                out.push('отсутствует')
            }

            for (let act of activities) {
                const { countingCriterias, participants } = act;
                const { sex } = participants


                const report = query.reports.find(r => r.activityId && r.activityId.toString() === act._id.toString());

                if (report && report.reportData) {
                    out.push(report.date)

                    for (let ind = 0; ind < countingCriterias.length; ind ++) {
                        const crit = countingCriterias[ind];
                        let key = `criterias_${ind}_`;
                        switch (crit.type) {
                            case "countStudents":
                                for (let l of levelsData) {
                                    const critkey =  key + 'students_' + l._id;
                                    const valcrit = report.reportData[critkey];
                                    out.push(valcrit || 0)
                                }
                                break;
                            case 'countTeams':
                            case 'pointsExtra':
                                //const critkey = `criterias_${ind}_qty`;
                                const valcrit = report.reportData[key+'qty'];
                                out.push(valcrit || 0)
                                break;
                            case "video":
                                if (crit.pointsForEvery) {
                                    for (let l of levelsData) {
                                        const critkey = key + 'urls_' + l._id;
                                        const valcrit = report.reportData[critkey] && report.reportData[critkey].length ? report.reportData[critkey].filter(url => !!url && url.slice(0, 6).includes('https')).join('; ') : "";
                                        out.push(valcrit || "")
                                    }
                                } else {
                                    const critkey = `criterias_${ind}_urls`;
                                    const valcrit = report.reportData[critkey] && report.reportData[critkey].length ? report.reportData[critkey].filter(url => !!url && url.slice(0, 6).includes('https')).join('; ') : "";
                                    out.push(valcrit || "")
                                }
                                break;
                            case 'photo':
                            case 'publication':
                                const critkey = `criterias_${ind}_urls`;
                                const val = report.reportData[critkey] && report.reportData[critkey].length ? report.reportData[critkey].filter(url => !!url && url.slice(0, 6).includes('https')).join('; ') : "";
                                out.push(val || "")

                                break;
                        }
                    }
                } else {
                    out.push("")
                    for (let crit of act.countingCriterias) {
                        switch (crit.type) {
                            case "countStudents":
                                for (let l of levelsData) {
                                    out.push(0)
                                }
                                break;
                            case "video":
                                if (crit.pointsForEvery) {
                                    for (let l of levelsData) {
                                        out.push("")
                                    }
                                } else {
                                    out.push("")
                                    continue
                                }
                                break;
                            case 'photo':
                            case 'countTeams':
                            case 'pointsExtra':
                            case 'publication':
                                out.push("")
                                break;
                        }
                    }
                }

            };
            outdata.push(isColored ? out.map(r => ({v: r, t: "s", s: {fill: {fgColor: {rgb: "EEE8AA"}}}})) : out)
        } catch(e) {
            console.log('err', e);
            //return null
        }
    }//).filter(q => !!q)
    return outdata
}
