const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { query_pipeline, festival_pipeline } = require('../pipelines')
const moment = require('moment');
const searchApiOrgs = require('./searchApiOrgs')
const logger = require('../logger');

module.exports = async ({body, item, userObjId, signer}) => {
    try {
        const queryId = getObjId(item)

        const {_id, userId, festivalId, organizationApiData, nominations, ...patchQuery} = body;

        const { organizationQueryData } = patchQuery;

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }

        const query = await getQuery({mongoFilter: {_id: queryId}})

        if (!query) {
            return {success: false, message: 'Заявка не найдена', errorStatus: 400}
        }
        if (query.archived) {
            return {success: false, message: 'Заявка удалена', errorStatus: 400}
        }

        if (!query.festival) {
            return {success: false, message: 'Фестиваль в заявке не активен', errorStatus: 400}
        }
        if(organizationQueryData) {
            if (
                organizationQueryData.inn &&
                organizationQueryData.inn.length > 4 &&
                (!query.organizationQueryData || organizationQueryData.inn !== query.organizationQueryData.inn)
            ) {

                const existedQuery = await service.fetch({collection: 'queries', pipeline: [
                    {$match: {
                        "organizationQueryData.inn": organizationQueryData.inn,
                        festivalId: query.festivalId,
                        archived: false
                    }},
                    {$project: {_id: 1}}
                ], asEntry: true});

                if((organizationQueryData.inn.toString() !== '3904040429') && existedQuery && existedQuery._id.toString() !== item.toString()) {
                    return {success: false, message: `для организации с инн ${organizationQueryData.inn} уже есть заявка в данный фестиваль ${existedQuery._id}`, errorStatus: 400}
                }

                if (!organizationApiData) {
                    let orgData = await service.fetch({collection: 'organizations', pipeline: [
                        {$match: {
                            inn: organizationQueryData.inn
                        }}
                    ], asEntry: true});

                    if (!orgData) {
                        const apiOrgData = await gerApiOrg(organizationQueryData.inn);
                        if (apiOrgData) {
                            const orgBody = {
                                ...apiOrgData,
                                userId: userObjId,
                                apiFullBody: apiOrgData
                            }

                            const org = await service.save({collection: 'organizations'}, orgBody)

                            if (!org || !org._id) {
                                return {success: false, message: 'Нe удалось создать организацию для заявки', errorStatus: 500}
                            }
                            orgData = {...orgBody, _id: org._id}
                        }
                    }
                    if (orgData && orgData._id && !patchQuery.organizationId && (!query.organizationId ||  query.organizationId.toString() !== orgData._id.toString())) {
                        patchQuery.organizationId = orgData._id;
                    }
                }
            }

            /*if(!query.regionId && !patchQuery.regionId && organizationQueryData.address && organizationQueryData.address.region && organizationQueryData.address.region.kladr_id) {

                const regionManual = await service.fetch({collection: 'regions', pipeline: [
                    {$match: {
                        kladr_id: organizationQueryData.address.region.kladr_id
                    }}
                ], asEntry: true});
                if (!regionManual) {

                }
                patchQuery.regionId = regionManual._id
            }*/
        }

        if (organizationApiData && organizationApiData.inn) {
            let orgData = await service.fetch({collection: 'organizations', pipeline: [
                {$match: {
                    inn: organizationApiData.inn
                }}
            ], asEntry: true});

            if (!orgData) {
                const orgBody = {
                    ...organizationApiData,
                    userId: userObjId,
                    apiFullBody: organizationApiData
                }
                if (organizationApiData.address && organizationApiData.address.region && organizationApiData.address.region.kladr_id) {
                    const kladr_id = organizationApiData.address.region.kladr_id;
                    const region = await service.fetch({collection: 'regions', pipeline: [
                        {$match: {
                            kladr_id: kladr_id
                        }}
                    ], asEntry: true});
                    if (!region) {
                        return {success: false, message: `Регион по ${kladr_id} не найден`, errorStatus: 400}
                    }
                    orgBody.regionId = region._id;
                }
                const org = await service.save({collection: 'organizations'}, orgBody)
                if (!org || !org._id) {
                    return {success: false, message: 'Нe удалось создать организацию для заявки', errorStatus: 500}
                }
                orgData = {...orgBody, _id: org._id}
            }

            const existedQuery = await service.fetch({collection: 'queries', pipeline: [
                {$match: {
                    organizationId: orgData._id,
                    festivalId: query.festivalId,
                    archived: false
                }},
                {$project: {_id: 1}}
            ], asEntry: true});

            if((organizationQueryData.inn.toString() !== '3904040429') && existedQuery && existedQuery._id.toString() !== item.toString()) {
                return {success: false, message: `для организации с инн ${organizationApiData.inn} уже есть заявка в данный фестиваль ${existedQuery._id}`, errorStatus: 400}
            }
/*
            if (!patchQuery.regionId || patchQuery.regionId.toString() !==  orgData.regionId.toString() || !query.regionId || query.regionId.toString() !==  orgData.regionId.toString() ) {
                patchQuery.regionId = orgData.regionId;
            }
            */
            patchQuery.organizationId = orgData._id;
        }

        if (nominations && nominations.length) {
            patchQuery.nominations = nominations.map(nom => ({
                ...nom,
                _id: getObjId(nom._id),
                //nominationtypeId: getObjId(nom.nominationtypeId),
                levels: nom.levels.map(l => ({
                    ...l,
                    _id: getObjId(l._id),
                }))
            }))
        }

        if (patchQuery.status && patchQuery.status === 'NEED_MODERATION' && query.status === 'DRAFT'){
            patchQuery.deliveryToModerated = moment().utc(false).toDate();
        }
        let queryUpd = await service.update({collection: 'queries', _id: queryId}, patchQuery)

        await logger({
            action: "put",
            collection: "queries",
            id: item || "",
            authorCollection: signer.collection || 'supervisors',
            authorId: signer._id,
            author: signer.email || "no_mail",
            patch: patchQuery
        })
        return {success: true}
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

const getQuery = async ({mongoFilter}) => {
    try {
        const now = moment().format('YYYY.MM.DD')

        const data = await service.fetch({collection: 'queries', pipeline: [
           {$match: mongoFilter},
           {$lookup: {
               from: 'festivals',
               let: {fid: '$festivalId'},
               pipeline: [
                   {$match: {
                       $expr: {$eq: ['$$fid', '$_id']},
                       dateStart: {$lte: now},
                       dateEnd: {$gte: now}
                   }},
               ],
               as: 'festival'
           }},
           {$set: {
               festival: {'$arrayElemAt': ['$festival', 0]}
           }}
       ], asEntry: true})

       return data
    } catch (e) {
        console.log('getQuery failed', e);
        return null
    }
}

const gerApiOrg = async (inn) => {
    try {
        const apiOrgData = await searchApiOrgs(inn)

        if (apiOrgData.success && apiOrgData.data) {
            const orgData = apiOrgData.data.find(org => org.inn === inn);

            if (orgData && orgData.address && orgData.address.region && orgData.address.region.kladr_id) {

                const kladr_id = orgData.address.region.kladr_id;

                const region = await service.fetch({collection: 'regions', pipeline: [
                    {$match: {
                        kladr_id: kladr_id
                    }}
                ], asEntry: true});

                if (!region) {
                    //return {success: false, message: `Регион по ${kladr_id} не найден`, errorStatus: 400}
                    console.log('REGION NOT FOUND BY KLADR', kladr_id);
                    return null
                }
                orgData.regionId = region._id;

                return orgData
            }
        }
        return null
    } catch (e) {
        console.log('gerApiOrg failed', e);
        return null
    }
}
