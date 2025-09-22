const service = require('../../../service');
const { getObjId } = require('../../../utils')
const logger = require('../../../logger');

module.exports = async (req) => {
    try {
        const data = req.body;
        if (!data || !data.length) {
            return {success: false, message: 'check body', errorStatus: 400}
        }
        const existed = data.filter(n => n && !!n._id);
        const notexisted = data.filter(n => n && !n._id);

        const festId = getObjId(data[0].festivalId);

        if (!festId) {
            return {success: false, message: 'check festivalId in first', errorStatus: 400}
        }

        const noms = await service.fetch({collection: 'nominations', pipeline: [
            {$match: {
                festivalId: festId
            }},
            {$lookup: {
                from: 'educationlevels',
                localField: '_id',
                foreignField: 'nominationId',
                as: 'levels'
            }},
            {$sort: {sort: 1}}
        ]});

        for (let nom of noms) {
            const dataNom = existed.find(n => n._id && n._id.toString() === nom._id.toString());
            if (!dataNom || data[0].deleteAll) {
                await service.delete({collection: 'nominations', _id: nom._id});
                await logger({
                    action: 'delete',
                    collection: "nominations",
                    id: nom._id,
                    authorCollection: 'supervisors',
                    authorId: req.signer._id,
                    author: req.signer.email || "no_mail"
                })
                if (nom.levels &&nom.levels.length) {
                    for (let level of nom.levels) {
                        await service.delete({collection: 'educationlevels', _id: level._id});
                        await logger({
                            action: 'delete',
                            collection: "educationlevels",
                            id: level._id,
                            authorCollection: 'supervisors',
                            authorId: req.signer._id,
                            author: req.signer.email || "no_mail"
                        })
                    }
                }
            } else {
                const {levels, _id, ...patch} = dataNom;
                await service.update({collection: 'nominations', _id: _id}, patch);

                if (levels && levels.length){

                    if (nom.levels && nom.levels.length) {
                        for (let level of nom.levels) {
                            const dataLevel = levels.find(l => l._id && l._id.toString() === level._id.toString());
                            if (!dataLevel) {
                                await service.delete({collection: 'educationlevels', _id: level._id});
                                await logger({
                                    action: 'delete',
                                    collection: "educationlevels",
                                    id: level._id,
                                    authorCollection: 'supervisors',
                                    authorId: req.signer._id,
                                    author: req.signer.email || "no_mail"
                                })
                            }
                        }
                    }

                    for (let level of levels) {
                        if (!level.nominationId) {
                            level.nominationId = nom._id;
                        }
                        let lid = ""
                        if (level._id) {
                            const {_id, ...patchLevel} = level
                            await service.update({collection: 'educationlevels', _id: _id}, patchLevel);
                        } else {
                            const l = await service.save({collection: 'educationlevels'}, {
                                ...level
                            });
                            lid = l._id || ""
                        }
                        await logger({
                            action: level._id ? 'put' : 'post',
                            collection: "educationlevels",
                            id: level._id ? level._id : lid,
                            authorCollection: 'supervisors',
                            authorId: req.signer._id,
                            author: req.signer.email || "no_mail",
                            patch: level
                        })
                    }
                } else {
                    if (nom.levels && nom.levels.length) {
                        for (let level of nom.levels) {
                            await service.delete({collection: 'educationlevels', _id: level._id});
                            await logger({
                                action: 'delete',
                                collection: "educationlevels",
                                id: level._id,
                                authorCollection: 'supervisors',
                                authorId: req.signer._id,
                                author: req.signer.email || "no_mail"
                            })
                        }
                    }
                }
            }
        }

        if (notexisted.length) {
            for (let creat of notexisted) {
                const {levels, ...body} = creat;

                const created = await service.save({collection: 'nominations'}, body);
                if (!created._id) {
                    return {success: false, message: 'nominations post failed', errorStatus: 500}
                }
                if (levels && levels.length) {
                    for (let level of levels) {
                        const l = await service.save({collection: 'educationlevels'}, {
                            ...level,
                            nominationId: created._id
                        });
                        await logger({
                            action: 'post',
                            collection: "educationlevels",
                            id: l._id || "",
                            authorCollection: 'supervisors',
                            authorId: req.signer._id,
                            author: req.signer.email || "no_mail",
                            patch: level
                        })
                    }
                }
            }
        }

        const list = await service.fetch({collection: 'nominations', pipeline: [
            {$match: {
                festivalId: festId
            }},
            {$lookup: {
                from: 'educationlevels',
                localField: '_id',
                foreignField: 'nominationId',
                as: 'levels'
            }},
        ]});
        return {success: true, data: list}
    } catch (e) {
        console.log('nominations', e);
        return {success: false, message: 'nominations', errorStatus: 500}
    }
}
