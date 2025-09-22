const service = require('../service');
const moment = require('moment');
const { getObjId } = require('../utils')

const mod = async () => {
    try {
        console.log('START');
        const qcount = await service.count({collection: 'queries', pipeline:[
            {$match: {
                //status: "VALID",
                festivalId: getObjId("66e833adbfd784e7c849b7a5"),
                "nominations.description":"дети 2018 г.р. и старше"
            }},
            {$project: {
                _id: 1, nominations: 1
            }},
            //{$limit: 10}
        ]})
        console.log(qcount);
        return
        const queries = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                festivalId: getObjId("66e833adbfd784e7c849b7a5"),
                "nominations.description":"дети 2018 г.р. и старше"
            }},
            {$project: {_id: 1, nominations: 1}},

            {$limit: 1}
        ]})
        console.log(queries.length);

        for (let i=0; i<queries.length; i++) {
            console.log('i', i+1, queries.length);
            const q = queries[i]
            const ind = q.nominations.findIndex(n => n.description === "дети 2018 г.р. и старше");
            if (ind < 0) {
                console.log(q);
                continue;
            }
            const res = await service.update({collection: 'queries', _id: q._id}, {[`nominations.${ind}.description`]: "дети 2019 г.р. и старше"})
            if (i < 10) {
                console.log(q._id, q.nominations[ind]);
                console.log('res', res);
            }
        }

        console.log('FINISH');

        return true
    } catch (e) {
        console.log('SV patch query failed', e);
    }
}

//mod()
