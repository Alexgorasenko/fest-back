const service = require('../service')
const moment = require('moment')

const isRegionAdmin = roles => {
    try {
        const { canView, canEdit } = roles.region_admin
        return canView && canEdit && canView.concat(canEdit).length
    } catch (e) {
        return false
    }
}

module.exports = async (req, res) => {
    const { roles } = req
    if(roles.superadmin || roles.rfu_admin) {
        try {
            const publics = await service.count({collection: 'publicusers'})
            const managers = await service.count({collection: 'contentmanagers', deactivated: {$ne: true}})

            const svrs = await service.fetch({collection: 'supervisors', roles: {$ne: null}, deactivated: {$ne: true}})

            const moders = svrs.filter(s => s.roles.moderator).length
            const regions = svrs.filter(s => isRegionAdmin(s.roles)).length
            const admins = svrs.filter(s => s.roles.rfu_admin).length

            res.json([publics, moders, regions, admins, managers])
        } catch (e) {
            console.log(e)
            res.status(500).send({error: true, message: 'Internal server error'})
        }
    } else {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    }
}
