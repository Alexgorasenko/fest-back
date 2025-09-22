const moment = require('moment')
const service = require('../service')
const xlsx = require('xlsx');

const { extractRegions } = require('./utils')

const hasRegionAccess = (regionId, regions) => {
    const matched = regions.find(r => r._id && r._id.toString() === regionId)
    return matched ? matched.kladr_id : null
}

module.exports = async (req, res) => {
    const { rfu_admin, superadmin, region_admin } = req.roles
    const { regionId } = req.query

    const regions = await extractRegions(region_admin)
    const isRegionAdmin = regions && regions.kladrs && regions.kladrs.length
    const requestedKladr = isRegionAdmin ? hasRegionAccess(regionId, regions.ids) : null
    const now = moment().format('YYYY.MM.DD')
    const matchFest = {$or: [{
        dateStart: {$lte: now},
        dateEnd: {$gte: now}
    }, {}]}
    if(rfu_admin || superadmin || isRegionAdmin) {
        if(!rfu_admin && !superadmin && !regionId) {
            res.status(400).send({error: true, message: 'Region ID parameter is required for this role'})
        } else {
            if(!isRegionAdmin || requestedKladr) {

                const headersTable = [
                    "ФИО ответственного лица",
                    "E-mail ответственного лица",
                    "Название школы",
                ];
/*"Контактный телефон ответственного лица",
"ФИО руководителя образовательной организации",
"E-mail руководителя образовательной организации",
"Телефон руководителя образовательной организаци",
"Скан таблицы подсчета баллов",
"Количество обучающихся, принявших участие в фестивале",*/

                const festival = await service.fetch({collection: 'festivals', pipeline: [
                    {$match: matchFest},
                    {$sort: {_id: -1}},
                    {$project: {_id: 1}}
                ], asEntry: true})

                if (!festival) {
                    res.status(400).json({success: false, message: 'активный фестиваль не найден'})
                    return {}
                }

                const festqueries = await service.fetch({collection: 'queries', pipeline: [
                    {$match: {
                        status:"VALID",
                        festivalId: festival._id,
                        'organizationQueryData.address.region.kladr_id': requestedKladr ? {$eq: requestedKladr} : {$ne: null}
                    }},
                    {$project: { regionId: 1, contactPerson: 1, director: 1, 'organizationQueryData.fullName': 1}}
                    //{$limit: 10},

                    // {$set: {
                    //     region: {'$arrayElemAt': ['$region', 0]},
                    // }}
                ]})

                const mapped = mapper(festqueries);
                const output = [headersTable, ...mapped];

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

const mapper = (queries) => {

    return queries.map((query, ind) => {
        try {

            const out = [
                (query.contactPerson ? query.contactPerson.fullname : ''),
                (query.contactPerson ? query.contactPerson.email : ''),
                // query.contactPerson.phone,
                // query.director.fullname,
                // query.director.email,
                // query.director.phone,
                query.organizationQueryData.fullName,
            ]

            return out
        } catch(e) {
            console.log('err', e);
            return null
        }
    }).filter(q => !!q)
}
