const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../../../utils')
const { getActQuery } = require('../../../modules')
const moment = require('moment');

module.exports = async (req) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const now = moment().format('YYYY.MM.DD')
        const match = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        let festival = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match},
            {$project: {_id: 1}}
        ], asEntry: true})

        if (!festival) {
            festival = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$sort: {_id: -1}},
                {$limit: 1},
                {$project: {_id: 1}}
            ], asEntry: true})
            //return {success: false, message: 'активный фестиваль не найден', errorStatus: 400}
        }

        const festquery = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                userId: userId,
                status:"VALID",
                festivalId: festival._id
            }},
            {$lookup: {
                from: "regions",
                localfield: "regionId",
                foreignField: "_id",
                as: "region"
            }},
            {$set: {
                region: {'$arrayElemAt': ['$region', 0]},
            }}
        ], asEntry: true})
        if (!festquery) {
            return {success: false, message: `для пользователя ${userId} не найдена заявка в активный фестиваль`, errorStatus: 400}
        }
        const { region } = festquery;

        if (!region) {
            return {success: false, message: `в заявке ${festquery._id} не найден регион`, errorStatus: 400}
        }

        const allQueries = await service.fetch({collection: 'queries', pipeline: [
           {$match: {
               festivalId: festival._id,
               status:"VALID"
               //"organizationQueryData.address.region.federal_district": с;
           }},
           {$project: {_id: 1, "organizationQueryData.address.region": 1}}
        ]})

        const districtQueries = allQueries.filter(q => q.organizationQueryData.address && q.organizationQueryData.address.region && q.organizationQueryData.address.region.federal_district && q.organizationQueryData.address.region.federal_district === region.federal_district )

        const regionQueries = districtQueries.filter(q => q.organizationQueryData.address.region.kladr_id && q.organizationQueryData.address.region.kladr_id === region.kladr_id )

        const userActQueriesCount = await service.count({collection: 'activityreports', pipeline: [
            {$match: {
                userId: userId,
                festivalId: festival._id
            }}
        ]})

        return {
            success: true,
            data: {
                userActQueriesCount: userActQueriesCount,
                allQueries: allQueries.length,
                districtQueries: districtQueries.length,
                regionQueries: regionQueries.length,
            }
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
