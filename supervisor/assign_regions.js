const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId

module.exports = async (req, res) => {
    const { roles, body } = req

    if(!roles || (!roles.rfu_admin && !roles.superadmin)) {
        res.status(403).json({success: false, message: 'Permission denied'})
    } else {
        const { supervisor, edit, view } = body
        if(!supervisor) {
            res.status(400).json({success: false, message: 'Supervisor value cannot be empty'})
        } else {
            if(!edit || !view) {
                res.status(400).json({success: false, message: 'Geo values cannot be empty'})
            } else {
                const entry = await service.fetch({collection: 'supervisors', _id: new ObjectId(supervisor)})
                if(!entry) {
                    res.status(404).json({success: false, message: 'Supervisor not found'})
                } else {
                    if(!entry.roles.region_admin) {
                        res.status(409).json({success: false, message: 'Wrong supervisor role'})
                    } else {
                        try {
                            await service.update({collection: 'supervisors', _id: entry._id}, {'roles.region_admin.canView': view, 'roles.region_admin.canEdit': edit})
                            res.json({success: false})
                        } catch (e) {
                            res.status(500).json({success: false, message: 'Internal server error'})
                        }
                    }
                }
            }
        }
    }
}
