const service = require('../../../service');
const moment = require('moment');
const secret = "bridge"

module.exports = async (req, item) => {
    try {
        const { key, inn } = req.query;

        if (!key || key !== secret) {
            return {success: false, message: 'проверьте параметры', errorStatus: 401}
        }

        const now = moment().format('YYYY.MM.DD')

        const matchFest = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        let festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: matchFest},
            {$project: {_id: 1, dateStart: 1}}
        ], asEntry: true})

        if (!festival) {
            festival = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$sort: {_id: -1}},
                {$limit: 1},
                {$project: {_id: 1, dateStart: 1}}
            ], asEntry: true})
        }

        if (!festival) {
            return {success: false}
        }

        const preActFest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: {dateEnd: {$lt: festival.dateStart}}},
            {$sort: {dateEnd: -1}},
            {$project: {_id: 1}}
        ], asEntry: true})

        if (inn) {
            const query = await service.fetch({collection: 'queries', pipeline: [
                {$match: {
                    "organizationQueryData.inn": inn,
                    festivalId: festival._id,
                    status: "VALID"
                }},
                {$project: {_id: 1, nominations: 1}}
            ], asEntry: true})

            return {success: true, query: query, fid: festival._id, prefid: preActFest ? preActFest._id : null}
        }

        return {success: true, fid: festival._id, prefid: preActFest ? preActFest._id : null}


    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
