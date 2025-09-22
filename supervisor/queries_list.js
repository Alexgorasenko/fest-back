const moment = require('moment')
const service = require('../service')
const statuses = ['NEED_MODERATION', 'NOT_VALID', 'VALID', 'ARCHIVED']
const { extractRegions } = require('./utils')

const URGENT_MINUTES_EDGE = 360 //время в минутах. если от регламентированного времени на обработку заявки осталось меньше - заявка помечается как горящая

module.exports = async (req, res) => {
    const { status } = req.query
    const { moderator, superadmin, region_admin, rfu_admin } = req.roles

    const regions = await extractRegions(region_admin)

    if(moderator || superadmin || regions || rfu_admin) {

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

        const targetStatus = statuses[parseInt(status)]
        const raw = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                festivalId: festival._id,
                status: targetStatus,
                'organizationQueryData.address.region.kladr_id': regions ? {$in: regions.kladrs} : {$ne: null}
            }},
            {$sort: {deliveryToModerated: 1, _id: 1}}
        ]})

        const mapped = mapper(raw)
        res.json(mapped.filter(q => q && q._id))
    } else {
        res.status(403).json({success: false, message: 'Invalid role'})
    }
}

const mapper = arr => {
    const isUrgent = datetime => {
        if(!datetime) {
            return true
        }
        const edge = moment(datetime).add(24, 'hours')
        const now = moment()
        const estimated = edge.diff(now, 'minutes')

        return estimated < URGENT_MINUTES_EDGE
    }

    return arr.map(query => {
        try {
            return {
                handledAt: query.handledAt ? moment(query.handledAt).format('YYYY-MM-DD HH:mm') : moment().format('YYYY-MM-DD HH:mm'),
                applicantName: query.organizationQueryData.name ? query.organizationQueryData.name : query.organizationQueryData.fullName,
                datetime: query.deliveryToModerated ? moment(query.deliveryToModerated).format('YYYY-MM-DD HH:mm') : moment().format('YYYY-MM-DD HH:mm'),
                _id: query._id,
                inn: query.organizationQueryData.inn,
                urgent: isUrgent(query.deliveryToModerated),
                regionName: query.organizationQueryData.address.region.name,
                attachmentFormId: query.attachmentFormId
            }
        } catch(e) {
            return null
        }
    })
}
