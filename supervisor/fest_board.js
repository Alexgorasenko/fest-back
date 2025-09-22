const service = require('../service');
const { getObjId, sampleReducer } = require('../utils')
const moment = require('moment')
const axios = require('axios')
const {  extractRegions } = require('./utils')

module.exports = async (req, res) => {
    try {
        const { rfu_admin, superadmin, region_admin } = req.roles
        //console.log(req.roles, req.signer);
        const regions = region_admin ? await extractRegions(region_admin) : null;
console.log(regions);
        if (!rfu_admin && !superadmin && (!region_admin || !regions)) {
            res.status(403).json({success: false, message: 'Для вашей роли отчет не доступен', errorStatus: 403})
            return {success: false, message: 'Для вашей роли отчет не доступен', errorStatus: 403}
        }
console.log(`${req.TEACHER_BE_URL}svr/fest_board?key=bridge`);
        const repordData = await axios.get(`${req.TEACHER_BE_URL}svr/fest_board?key=bridge`);
//console.log('repordData TEACHER_BE_URL', repordData.data);
        if (!repordData || !repordData.data || !repordData.data.success || !repordData.data.data) {
            res.status(400).json(repordData)
            return {success: false, message: 'данные не найдены', errorStatus: 400}
        }
        const now = moment().format('YYYY.MM.DD')

        const match = {$or: [{
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }, {}]}

        const fest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match},
            {$sort: {
                _id: -1
            }},
            {$limit: 1}
        ], asEntry: true})

        const festId = fest ? fest._id : null;
        if (!festId) {
            res.status(400).json({success: false, message: 'данные не найдены', errorStatus: 400})
            return {success: false, message: 'данные не найдены', errorStatus: 400}
        }

        const mainData = repordData.data.data;

        if (rfu_admin || superadmin) {

            const festQueries = await service.fetch({
                collection: 'queries',
                pipeline: [
                    {$match: {
                        status: 'VALID',
                        festivalId: festId,
                        //finishedReports: {$ne: null},
                        'organizationQueryData.address.region.kladr_id': {$nin: [null, ""]}
                    }}
                ]
            })

            const mergedData = mergeFestWithTeach({teachData: mainData, festQueries})
            res.json({
                success: true,
                data: mergedData
            })
            return {}
        } else if (region_admin && regions) {

            const festQueries = await service.fetch({
                collection: 'queries',
                pipeline: [
                    {$match: {
                        status: 'VALID',
                        festivalId: festId,
                        //finishedReports: {$ne: null},
                        'organizationQueryData.address.region.kladr_id': {$in: regions.kladrs}
                    }},
                    {$project: {organizationQueryData: 1}}
                ]
            })

            const mergedData = mergeFestWithTeach({teachData: mainData, festQueries, regions})
            res.json({
                success: true,
                data: mergedData
            })

            return {}
        }


        res.json({
            success: false,
        })
        return {}

    } catch (e) {
        console.log('userflow fest board failed', e.response);
        if (e.response && e.response.data && e.response.data.errorStatus) {
            res.status(e.response.data.errorStatus).json(e.response.data)
        } else {
            res.status(500).json({success: false, message: 'svr fest board failed', errorStatus: 400})
        }
        return {success: false, message: 'userflow fest board failed', errorStatus: 500}
    }
}

const mergeFestWithTeach = ({teachData, festQueries, regions}) => {
    let countActFest = 0;

    const reducedByRegAndInnFestQueries = festQueries.reduce((acc, cur) => {
        const { organizationQueryData } = cur;
        if (organizationQueryData) {
            const { inn, address } = organizationQueryData;
            if (inn && !acc.byInn[inn]) {
                acc.byInn[inn] = 1;
            }
            if (address && address.kladr_id) {
                if (!acc.byReg[address.kladr_id]) {
                    acc.byReg[address.kladr_id] = 0;
                }
                acc.byReg[address.kladr_id] += 1;
            }
        }
        return acc
    }, {byInn: {}, byReg: {}})

    const { byInn, byReg } = reducedByRegAndInnFestQueries;

    if (regions) {

        const mapedData = regions.ids.reduce((acc, cur) => {
            const reg = teachData.byRegs.find(r => r.kladr_id === cur.kladr_id);

            if (reg) {
                //console.log(reg.orgs.length)
                let regCountActFest = 0;

                const mappedOrgs = []
                for (let org of reg.orgs) {
                    const foundInActFest = !!byInn[org.inn];
                    if (foundInActFest) {
                        countActFest += 1;
                        regCountActFest += 1;
                    }
                    mappedOrgs.push({...org, foundInActFest: foundInActFest})
                }

                acc.byRegs.push({...reg, orgs: mappedOrgs, countActFest: regCountActFest})
                acc.countProject += reg.countProject;
                acc.countActFest += regCountActFest;
                acc.countPrevMagnit += reg.countPrevMagnit;
                acc.countActMagnit += reg.countActMagnit;
            } else {
                acc.byRegs.push({
                    countProject: 0,
                    countActFest: 0,
                    countPrevMagnit: 0,
                    countActMagnit: 0,
                    kladr_id: cur.kladr_id,
                    regName: cur.name,
                    orgs: []
                })
            }
            return acc
        }, {
            countProject: 0,
            countActFest: 0,
            countPrevMagnit: 0,
            countActMagnit: 0,
            byRegs: []
        })

        return mapedData
    } else {
        const mergedRegs = [];
        for (let reg of teachData.byRegs) {
            let regCountActFest = 0;
            const mappedOrgs = []

            for (let org of reg.orgs) {
                const foundInActFest = !!byInn[org.inn];
                if (foundInActFest) {
                    //countActFest += 1;
                    regCountActFest += 1;
                }
                mappedOrgs.push({...org, foundInActFest: foundInActFest})
            }

            mergedRegs.push({...reg, orgs: mappedOrgs, countActFest: regCountActFest})

            countActFest += regCountActFest;
        }

        return {...teachData, byRegs: mergedRegs, countActFest: countActFest}
    }
}
