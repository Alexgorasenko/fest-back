const service = require('../service');
const moment = require('moment');

const mod = async () => {
    try {
        const start = new Date("2024-05-14 16:30");
        console.log(start);
        const queries = await service.fetch({collection: 'activityreports', pipeline: [
            {$match: {
                //createdAt: {$gte: start},
                reportData: {$ne: null}
            }},
            {$project: {reportData: 1, queryId: 1}}
        ]})
        console.log(queries.length);

        const out = {}
        const wrongsAll = {}
        const unic = {}
        let count = 0;
        let countWithWrong = 0;
        let uniccount = 0;
        let allAttach = 0;
        for (let q of queries) {

            if (!unic[q.queryId]) {
                unic[q.queryId] = 1
                uniccount += 1;
            }

            for (let key in q.reportData) {
                if (key.includes("urls")) {
                    if (Array.isArray(q.reportData[key])) {

                        for (let l of q.reportData[key]) {
                            if (l.includes("undefined")) {
                                if (!out[q.queryId]) {
                                    out[q.queryId] = {
                                        wrongsAll: {}
                                    };
                                    countWithWrong += 1;
                                    //console.log(q.queryId);
                                }
                                if (!out[q.queryId].wrongsAll[q._id]) {
                                    out[q.queryId].wrongsAll[q._id] = 0;
                                }
                                out[q.queryId].wrongsAll[q._id] += 1;
                                //out[q.queryId] += 1;
                                count += 1;
                            }
                            allAttach += 1;
                        }
                    }
                }
            }
        }
        console.log('FINISHED uniccount',uniccount, countWithWrong, allAttach, count );

        return {count, countWithWrong}
    } catch (e) {
        console.log('SV patch query failed', e);
    }
}

//mod()
