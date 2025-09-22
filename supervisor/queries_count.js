const service = require('../service')
const statuses = ['NEED_MODERATION', 'NOT_VALID', 'VALID', 'ARCHIVED']
const { extractRegions } = require('./utils')
const moment = require('moment')

module.exports = async (req, res) => {
    const output = []

    const { region_admin } = req.roles

    const regions = await extractRegions(region_admin)
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
        res.status(400).json({success: false, message: 'активный фестиваль не найден', errorStatus: 400})
        return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
    }

    for(let status of statuses) {
        const qty = await service.count({
            collection: 'queries',
            pipeline: [
                {$match: {
                    festivalId: festival._id,
                    status: status,
                    'organizationQueryData.address.region.kladr_id': regions ? {$in: regions.kladrs} : {$ne: null}
                }}
            ]
        })
        output.push(qty)
    }

    res.json(output)
}
