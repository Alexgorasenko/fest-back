const service = require('../service');
const { getObjId, isEmptyOrNull, decodeToken } = require('../utils')
const { getActForm } = require('../modules')

const definePermsLevel = (entry, roles) => {
    if(roles.superadmin || roles.admin || roles.rfu_admin) {
        return 'full'
    } else {
        if(roles.region_admin && roles.region_admin.canEdit) {
            if(roles.region_admin.canEdit.includes(entry.organizationQueryData.address.region.kladr_id)) {
                return 'full'
            }
        }

        if(roles.region_admin && roles.region_admin.canView) {
            if(roles.region_admin.canView.includes(entry.organizationQueryData.address.region.kladr_id)) {
                return 'read'
            }
        }

        return null
    }
}

module.exports = async (req, res) => {
    const { id } = req.params
    const { superadmin, moderator } = req.roles
    const reportId = getObjId(id);

    if (!reportId) {
        res.status(400).json({success: false, message: 'Invalid id provided'})
        return {}
    }

    try {
        const report = await service.fetch({collection: 'activityreports', pipeline: [
            {$match: {_id: reportId}},
            {$project: {_id: 1, activityId: 1, nominationId: 1, queryId:1, festivalId: 1 }}
        ], asEntry: true})

        if (!report) {
            res.status(400).json({success: false, message: 'отчет не найден', errorStatus: 400})
            return {success: false, message: 'отчет не найден', errorStatus: 400}
        }

        const queryEntry = await service.fetch({collection: 'queries', _id: report.queryId})
        const perms = queryEntry ? definePermsLevel(queryEntry, req.roles) : null

        const form = await getActForm({
            //userId: userId,
            festivalId: report.festivalId,
            queryId: report.queryId,
            nominationId: report.nominationId,
            activityId: report.activityId
        })

        if (form.errorStatus) {
            res.status(form.errorStatus).json(form)
        } else {
            res.json({success: true, data: form, access: perms})
        }

    } catch (e) {
        console.log('userflow get_activities failed', e);
        res.status(500).json({success: false, message: 'userflow get_activities failed', errorStatus: 500})
        return {success: false, message: 'userflow get_activities failed', errorStatus: 500}
    }
}
