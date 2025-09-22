const service = require('../service');
const moment = require('moment');

const mod = async () => {
    try {
        const start = new Date("2024-05-14 16:30");
        console.log(start);
        const queries = await service.fetch({collection: 'activityreports', pipeline: [
            {$match: {
                createdAt: {$gte: start},
                reportData: {$ne: null}
            }},
            {$project: {reportData: 1}}
        ]})
        console.log(queries.length);

        const out = []
        let count = 0;
        for (let q of queries) {
            const reportData = {};
            let needsave = false;

            for (let key in q.reportData) {
                if (key.includes("urls")) {
                    if (Array.isArray(q.reportData[key])) {

                        const patched = [];
                        for (let l of q.reportData[key]) {
                            if (!l.includes("api-fests.rfs.ru") || l.includes("undefined")) {
                                patched.push(l)

                            } else {
                                patched.push(l.replace("https://api-fests.rfs.ru", "https://s3.megafon.cloud/fstbe2-fs"))
                                needsave = true
                            }
                        }
                        reportData[key] = patched;
                    } else {
                        reportData[key] = q.reportData[key]
                    }
                } else {
                    reportData[key] = q.reportData[key]
                }
            }
            if (needsave) {
                // if (count < 5) {
                //     console.log('patch', q._id, reportData);
                //     console.log('base', q.reportData);
                // }
                let queryUpd = await service.update({collection: 'activityreports', _id: q._id}, {reportData: reportData})

                count += 1;
            }


        }
        console.log('FINISHED',count);

        return out
    } catch (e) {
        console.log('SV patch query failed', e);
    }
}

//mod()
