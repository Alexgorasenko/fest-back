const service = require('../service');
const moment = require('moment');

const mod = async () => {
    try {
        const qcount = await service.count({collection: 'queries', status: "VALID",
        finishedReports:{$ne: null},
        attachmentReports: null})
        console.log(qcount);
        return
        const queries = await service.fetch({collection: 'queries', pipeline: [
            {$match: {
                status: "VALID",
                finishedReports:{$ne: null},
                attachmentReports: null
            }},
            {$project: {_id: 1, finishedReports: 1, userId: 1}},
            {$lookup: {
                from: 'attachments',
                let: {uid: '$userId'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$$uid', '$userId']},
                        sampleId: null
                    }},
                    {$sort: {_id: -1}}
                ],
                as: 'attachment'
            }},
            {$set: {
                attachment: {$arrayElemAt: ['$attachment', 0]}
            }},
            //{$limit: 10}
        ]})
        console.log(queries.length);
        const out = []
        /*
        let moreOneFinished = 0;
        for (let q of queries) {
            const noms = Object.keys(q.finishedReports)

            if (noms.length > 1) {
                moreOneFinished += 1;
                const attachs = await service.fetch({collection: 'attachments', userId: q.userId, sampleId: null})
                const countAttach = attachs.length
                console.log(countAttach, attachs.map(att => 'https://s3.megafon.cloud/fstbe2-fs/'+att.path));
            }
        }
*/
let moreOneFinished = 0;
let wrong = 0;
        for (let i=0; i<queries.length; i++) {
            const q = queries[i]
            if (q.attachment) {
                const noms = Object.keys(q.finishedReports)
                const patch = {
                    attachmentReports: {}
                }

                //
                // out.push({_id: q._id, patch: {attachmentFormId: q.attachment._id}, queryUpd: queryUpd})

                if (noms.length > 1) {
                    moreOneFinished += 1;
                    const attachs = await service.fetch({collection: 'attachments', userId: q.userId, sampleId: null})
                    if (attachs.length) {
                        let ind = 0;
                        for (let nomId in q.finishedReports) {
                            patch.attachmentReports[nomId] = attachs[ind] ? 'https://s3.megafon.cloud/fstbe2-fs/' + attachs[ind].path : "";
                            ind += 1;
                        }
                        if (attachs.length === 2) {
                            let queryUpd = await service.update({collection: 'queries', _id: q._id}, patch)
                        } else {
                            console.log(q._id, attachs.map(att => 'https://s3.megafon.cloud/fstbe2-fs/'+att.path), JSON.stringify(patch));
                        }
                    }


                } else {
                    patch.attachmentReports[noms[0]]= 'https://s3.megafon.cloud/fstbe2-fs/'+q.attachment.path;

                    let queryUpd = await service.update({collection: 'queries', _id: q._id}, patch)
                    // if (i > 0 && i < 10) {
                    //     console.log(q._id, patch, queryUpd);
                    // }
                }


            } else {
                wrong += 1;
            }
        }

        console.log('FINISHED',moreOneFinished, wrong);

        return out
    } catch (e) {
        console.log('SV patch query failed', e);
    }
}

//mod()
