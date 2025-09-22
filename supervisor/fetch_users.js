const service = require('../service')

module.exports = async (req, res) => {
    const { id } = req.params
    const { roles } = req

    if(!roles.superadmin && !roles.rfu_admin) {
        res.status(403).send({error: true, message: 'Not enough permissions'})
    } else {
        const args = {
            public: {
                collection: 'publicusers',
                pipeline: [
                    {$project: {_id: 1, email: 1, createdAt: 1, verified: 1, name: 1, blocked: 1}}
                ]
            },
            moderators: {
                collection: 'supervisors',
                pipeline: [
                    {$match: {
                        'roles.moderator': true,
                        deactivated: {$ne: true}
                    }},
                    {$project: {_id: 1, email: 1, createdAt: 1, verified: 1, blocked: 1, name: 1, roles: 1}}
                ]
            },
            regions: {
                collection: 'supervisors',
                pipeline: [
                    {$match: {
                        'roles.region_admin': {$ne: null},
                        deactivated: {$ne: true},
                        $or: [
                            {'roles.region_admin.canView': {$ne: null, $ne: []}},
                            {'roles.region_admin.canEdit': {$ne: null, $ne: []}}
                        ]
                    }},
                    {$project: {_id: 1, email: 1, createdAt: 1, verified: 1, blocked: 1, name: 1, roles: 1}}
                ]
            },
            admins: {
                collection: 'supervisors',
                pipeline: [
                    {$match: {
                        'roles.rfu_admin': true,
                        deactivated: {$ne: true}
                    }},
                    {$project: {_id: 1, email: 1, createdAt: 1, verified: 1, blocked: 1, name: 1, roles: 1}}
                ]
            },
            managers: {
                collection: 'contentmanagers',
                pipeline: [
                    {$match: {
                        deactivated: {$ne: true}
                    }}
                ]
            }
        }

        if(args[id]) {
            try {
                const output = await service.fetch(args[id])
                res.json(output)
            } catch(e) {
                console.log(e)
                res.status(500).send({error: true, message: 'Interval server error'})
            }
        } else {
            res.status(400).send({error: true, message: 'Unknown user type'})
        }
    }
}
