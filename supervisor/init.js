const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { query_pipeline, festival_pipeline } = require('../pipelines')
const moment = require('moment');

module.exports = async (req, res) => {
    const { roles } = req;
    res.json(roles)
    // if (!roles || (!roles.moderator && !roles.region_admin && !roles.rfu_admin && !roles.superadmin)) {
    //     res.status(401).json({success: false, msg: 'не найдены роли'})
    // }
    //
    // const {
    //     moderator,
    //     region_admin,
    //     rfu_admin,
    //     superadmin
    // } = roles;
    //
    // const queryModeration = moderator ? await service.fetch({collection: 'queries', pipeline: [
    //     {$match: {
    //         status: {$ne: 'DRAFT'}
    //     }},
    //     ...query_pipeline
    // ]}) : null
    //
    // let regionsQuery = null;
    // if (region_admin) {
    //     const {canEdit=[], canView=[]} = region_admin;
    //     const regions = await service.fetch({collection: 'regions', pipeline: [
    //         {$match: {
    //             kladr_id: {$in: [...canEdit, ...canView]},
    //             visible: true
    //         }},
    //         {$lookup: {
    //             from: 'queries',
    //             let: {rid: '$_id'},
    //             pipeline: [
    //                 {$match: {
    //                     $expr: {$eq: ['$$rid', '$regionId']},
    //                 }},
    //                 ...query_pipeline
    //             ]
    //         }}
    //     ]});
    //     regionsQuery = {
    //         canEdit: regions.filter(reg => canEdit.inclueds(reg.kladr_id)),
    //         canView: regions.filter(reg => canView.inclueds(reg.kladr_id))
    //     }
    // }
    //
    // res.json({success: true, data: {
    //     roles: roles,
    //     moderator: queryModeration,
    //     region_admin: regionsQuery,
    //     rfu_admin: rfu_admin,
    //     superadmin: superadmin,
    // }})
}
