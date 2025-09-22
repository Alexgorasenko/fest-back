const service = require('../service')
const { extractRegions } = require('./utils')
const moment = require('moment');

module.exports = async (req, res) => {
    const { roles } = req

    if(!roles) {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    } else {
        const now = moment().format('YYYY.MM.DD');
        const matchFest = {$or: [{
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }, {}]}
        const actFest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$sort: {_id: -1}},
            {$lookup: {
                from: 'nominations',
                let: {fid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$festivalId', '$$fid']}
                    }},
                    {$sort: {sort: 1}},
                    {$project: {_id: 1, name: 1}}
                ],
                as: 'nominations'
            }},
            {$project: {_id: 1, nominations: 1}}
        ], asEntry: true})
console.log(actFest);
        if (!actFest) {
            res.status(400).send({error: true, message: 'Активный фестиваль не найден'})
            return {success: false, message: 'Активный фестиваль не найден', errorStatus: 400}
        }

        if(roles.superadmin || roles.rfu_admin) {
            const allregs = await service.fetch({collection: 'regions', pipeline: [
                {$match: {}},
                {$sort: {name: 1}}
            ]})

            res.json([
                {
                    name: 'Свод заявок',
                    source: 'svr/report_queries',
                },
                {
                    name: 'Отчет по мероприятиям',
                    options: actFest.nominations.map(nom => (
                        {value: nom._id, label: nom.name, key: 'nominationId'}
                    )),
                    source: 'svr/report_activities'
                },
                {
                    name: 'Итоговый протокол субъекта',
                    options: allregs.map(reg => (
                        {value: reg._id, label: reg.name, key: 'regionId'}
                    )),
                    source: 'svr/report_subject'
                },
                {
                    name: 'Итоговый отчет по стране',
                    source: 'svr/report_country'
                },
                {
                    name: 'Email адреса участников',
                    source: 'svr/report_emails'
                }
            ])
        } else {
            const regions = await extractRegions(roles.region_admin)
            if(regions) {
                const options = regions.ids.map(reg => (
                    {value: reg._id, label: reg.name, key: 'regionId'}
                ))

                const output = [
                    {
                        name: 'Свод заявок',
                        options,
                        source: 'svr/report_queries',
                        addon: 'regionId'
                    },
                    {
                        name: 'Отчет по мероприятиям',
                        options: actFest.nominations.map(nom => (
                            {value: nom._id, label: nom.name, key: 'nominationId'}
                        )),
                        source: 'svr/report_activities'
                    },
                    {
                        name: 'Итоговый протокол субъекта',
                        options,
                        source: 'svr/report_subject'
                    }
                ]

                res.json(output)
            } else {
                res.status(404).send({error: true, message: 'No available samples'})
            }
        }
    }
}
