const moment = require('moment')
const service = require('../service')
//const xlsx = require('xlsx');
const xlsx = require('xlsx-js-style');

const { sampleReducer } = require('../utils')

const { extractRegions } = require('./utils')

const hasRegionAccess = (regionId, regions) => {
    const matched = regions.find(r => r._id && r._id.toString() === regionId)
    return matched ? matched.kladr_id : null
}

module.exports = async (req, res) => {
    const { rfu_admin, superadmin, region_admin } = req.roles
    const { regionId } = req.query

    const regions = await extractRegions(region_admin);

    const isRegionAdmin = regions && regions.kladrs && regions.kladrs.length
    const requestedKladr = isRegionAdmin ? hasRegionAccess(regionId, regions.ids) : null

    if(rfu_admin || superadmin || isRegionAdmin) {
        if(!rfu_admin && !superadmin && !regionId) {
            res.status(400).send({error: true, message: 'Region ID parameter is required for this role'})
        } else {
            if(!isRegionAdmin || requestedKladr) {

                const headersTable = [
                    "Номер заявки",
                    "Название школы",
                    "Полное название школы",
                    "Ссылка на школу",
                    "Страна",
                    "Федеральный округ",
                    "Субъект",
                    "Город",
                    "Почтовый адрес",
                    "email",
                    "Официальный сайт",
                    "ИНН",
                    "КПП",
                    "ОГРН",
                    "ФИО ответственного лица",
                    "E-mail ответственного лица",
                    "Контактный телефон ответственного лица",
                    "ФИО руководителя образовательной организации",
                    "E-mail руководителя образовательной организации",
                    "Телефон руководителя образовательной организаци",
                    "Количество обучающихся, принявших участие в фестивале",
                    "Статус заявки",
                ];

                // const subs = [
                //     'Участие в номинации "Дошкольное образование"',
                //     "Количество обучающихся (дошкольники) (укажите 0 если нет)",
                //     "Из них девочек (дошкольники)  (укажите 0 если нет)",
                //     "Количество обучающихся (1-4 классы)",
                //     "Из них девочек (1-4 классы)",
                //     "Количество обучающихся (5-9 классы)",
                //     "Из них девочек (5-9 классы)",
                //     "Количество обучающихся (10-11 классы)",
                //     "Из них девочек (10-11 классы)",
                // ]
                const now = moment().format('YYYY.MM.DD')
                const matchFest = {$or: [{
                    dateStart: {$lte: now},
                    dateEnd: {$gte: now}
                }, {}]}
                const festival = await service.fetch({collection: 'festivals', pipeline: [
                    {$match: matchFest},
                    {$sort: {_id: -1}},
                    {$project: {_id: 1}}
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

                for (let nom of noms) {
                    headersTable.push(`Скан таблицы подсчета баллов "${nom.name.toLowerCase()}"`)
                    headersTable.push(`Участие в номинации "${nom.name.toLowerCase()}"`)
                    for (let level of nom.levels) {
                        headersTable.push(`Количество обучающихся (${level.name.toLowerCase()}) (укажите 0 если нет)`);

                        headersTable.push(`Из них девочек (${level.name.toLowerCase()}) (укажите 0 если нет)`);

                    }
                }

                // res.json(headersTable)
                // return
                const festqueries = await service.fetch({collection: 'queries', pipeline: [
                    {$match: {
                        //status: {$ne: "DRAFT"}, //$in: ["VALID", "NOT_VALID"]
                        festivalId: festival._id,
                        'organizationQueryData.address.region.kladr_id': requestedKladr ? {$eq: requestedKladr} : {$ne: null}
                    }},
                    {$project: {organizationQueryData: 1,finishedReports: 1, regionId: 1, contactPerson: 1, director: 1, nominations: 1, attachmentReports: 1, attachmentFormId: 1, status: 1}},
                    {$sort: {status: -1}}
                    //{$limit: 10},

                    // {$set: {
                    //     region: {'$arrayElemAt': ['$region', 0]},
                    // }}
                ]})

                const regsObj = await sampleReducer("regions", "kladr_id");

                const mapped = mapper(festqueries, noms, regsObj);
                const output = [headersTable, ...mapped];
                // res.json(output)
                // return
                const workSheet = xlsx.utils.aoa_to_sheet(output);
                const workBook = xlsx.utils.book_new();
                xlsx.utils.book_append_sheet(workBook, workSheet, 'Sheet 1');

                const out = xlsx.write(workBook, {type:'base64', bookType: 'xlsx'});

                res.writeHead(200, {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    'Content-Disposition': 'attachment; filename=*'+"Report"+'*.xlsx'
                });
                res.end(new Buffer(out, 'base64'));
            } else {
                res.status(403).send({error: true, message: 'Not enough permissions for requested region ID'})
            }
        }
    } else {
        res.status(403).json({success: false, message: 'Invalid role'})
    }
}

const mapper = (queries, noms, regionsObj) => {
    const statuses = {
        "VALID": "валидная",
        "NOT_VALID": "невалидная",
        "ARCHIVED": "архивная",
        "DRAFT": "черновик"
    }
    return queries.map((query, ind) => {
        try {
            const region = regionsObj[query.organizationQueryData.address.region.kladr_id] || {};

            const handledNoms = query.nominations.filter(n => n.handle);
            const isColored = !!(handledNoms.length > 1);
            const shortName = query.organizationQueryData.name || query.organizationQueryData.fullName;
            const out = [
                ind+1,
                shortName,
                query.organizationQueryData.fullName,
                query.organizationQueryData.site,
                "Россия",
                (region.federal_district || ""),
                (region.name || ""),
                query.organizationQueryData.address.city.name,
                query.organizationQueryData.address.display,
                (query.director ? query.director.email : ''),
                query.organizationQueryData.site,
                query.organizationQueryData.inn,
                query.organizationQueryData.kpp,
                query.organizationQueryData.ogrn,
                (query.contactPerson ? query.contactPerson.fullname : ''),
                (query.contactPerson ? query.contactPerson.email : ''),
                (query.contactPerson ? query.contactPerson.phone : ''),
                (query.director ? query.director.fullname : ''),
                (query.director ? query.director.email : ''),
                (query.director ? query.director.phone : ''),
            ]
            /*,
            !!preschool,
            !!school,

            allpre,
            wpre,
            ...reduced.levels, */
            let allStudents = 0;

            const reducedCounts = [statuses[query.status] || ""];

            for (let nom of noms ) {
                if (query.attachmentReports && query.attachmentReports[nom._id]) {
                    reducedCounts.push(query.attachmentReports[nom._id])
                } else {
                    reducedCounts.push('отсутствует')
                }

                const querynom = query.nominations.find(n => n.handle && n._id && n._id.toString() === nom._id.toString());
                if (querynom) {
                    reducedCounts.push('ДА')
                    for (let level of nom.levels) {

                        const queryLevel = querynom.levels.find(l => l._id.toString() === level._id.toString());
                        if (queryLevel) {
                            const lwoman = isNaN(+queryLevel.woman) ? 0 : +queryLevel.woman
                            const lman = isNaN(+queryLevel.man) ? 0 : +queryLevel.man

                            const all = lwoman + lman
                            allStudents += all;

                            reducedCounts.push(all, lwoman)
                        } else {
                            reducedCounts.push(0, 0)
                        }
                    }
                } else {
                    reducedCounts.push('НЕТ')
                    for (let level of nom.levels) {
                        reducedCounts.push(0, 0)
                    }
                }
            }

            // const preschool = query.nominations.find(n => n.handle && n.name && n.name.toLowerCase().includes("дошкольное"));
            // const school = query.nominations.find(n => n.handle && n.name && n.name.toLowerCase().includes("общее"))
            //
            // const allpre = preschool ? +preschool.woman + +preschool.man : 0;
            // const wpre = preschool ? +preschool.woman : 0;
            //
            //
            // const reduced = school && school.levels && school.levels.length ? school.levels.reduce((ac, cur) => {
            //     ac.levels.push(+cur.man + +cur.woman, +cur.woman );
            //     ac.all += +cur.man + +cur.woman
            //     return ac
            // }, {levels: [], all: 0}) : [0, 0, 0, 0, 0, 0]
            out.push(allStudents, ...reducedCounts)
            return isColored ? out.map(r => ({v: r, t: "s", s: {fill: {fgColor: {rgb: "EEE8AA"}}}})) : out
        } catch(e) {
            console.log('err', e);
            return null
        }
    }).filter(q => !!q)
}
