const service = require('../../service')
const moment = require('moment');

const mod = async () => {

    try {
        const now = moment().format('YYYY.MM.DD');
        const match = {
            dateStart: {$lte: now},
            dateEnd: {$gte: now}
        }
        let fest = await service.fetch({collection: 'festivals', pipeline: [
            {$match: match}
        ], asEntry: true})

        let partic = await service.fetch({collection: 'landingparticipants', pipeline: [
            {$match: {}}
        ], asEntry: true})

        if (!fest) {
            //return {success: false, message: 'Активный фестиваль не найден', errorStatus: 400}
            console.log('Активный фестиваль не найден')
            fest = await service.fetch({collection: 'festivals', pipeline: [
                {$match: {}},
                {$sort: {_id: -1}},
                {$limit: 1}
            ], asEntry: true})
        }

        const festId = fest._id;

        const queriesCount = await service.count({
            collection: 'queries',
            status: 'VALID',
            festivalId: festId
        })

        const rawReports = await service.fetch({
            collection: 'activityreports',
            pipeline: [
                {$match: {festivalId:festId}},
            ]
        })

        const totalReported = rawReports.length;

        let childrenParticipiedQty = 0;

        for(let report of rawReports) {
            if (report.reportData) {
                for(let rkey in report.reportData) {
                    if((rkey.includes('students')) && report.reportData[rkey]) {
                        const v = parseInt(report.reportData[rkey])
                        if(!isNaN(v)) {
                            childrenParticipiedQty += v
                        }
                    }
                }
            }
        }
        const particBody = {
            childrenParticipiedQty,
            queriesCount,
            totalReported
        }
        if (partic) {
            await service.update({collection: 'landingparticipants', _id: partic._id}, particBody)
        } else {
            const cr = await service.save({collection: 'landingparticipants'}, particBody)
            partic = {_id: cr._id}
        }
        console.log(particBody);
        return {
            success: true,
            data: {...particBody, _id: partic._id}
        }

    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

//mod()

module.exports = mod
