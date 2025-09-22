const { decomposeToken } = require('../user/tokens')
const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId
const fetchers = require('./fetchers')
const moment = require('moment');

module.exports = async (req, res) => {
    const { path } = req.params
    const { authorization } = req.headers

    if(!authorization) {
        res.status(401).json({error: true, message: 'Unauthorized'})
    } else {
        const decomposed = decomposeToken(authorization)
        if(decomposed) {
            const role = await fetchUserRole(decomposed)

            if(!role) {
                res.status(404).json({error: true, message: 'No matching role for user'})
            } else {
                const now = moment().format('YYYY.MM.DD')

                const match = {$or: [{
                    dateStart: {$lte: now},
                    dateEnd: {$gte: now}
                }, {}]}

                const fest = await service.fetch({collection: 'festivals', pipeline: [
                    {$match: match},
                    {$sort: {
                        _id: -1
                    }},
                    {$limit: 1}
                ], asEntry: true})

                if(fest) {
                    try {
                        const data = await fetchers[role](fest._id, decomposed.email)
                        if(data) {
                            if (data.errorStatus) {
                                res.status(data.errorStatus).json(data)
                            } else {
                                res.json(data)
                            }
                        } else {
                            res.status(409).json({error: true, message: 'Method error'})
                        }
                    } catch(e) {
                        console.log(e)
                        res.status(500).json({error: true, message: 'Internal server error'})
                    }
                } else {
                    res.status(404).json({error: true, message: 'Active festival not found'})
                }
            }
        } else {
            res.status(401).json({error: true, message: 'Unauthorized'})
        }
    }
}

const fetchUserRole = async obj => {
    if (obj.roles) {
        if (obj.email) {
            const svrEntry = await service.fetch({collection: 'supervisors', email: obj.email, asEntry: true})
            if(svrEntry) {
                return 'supervisor'
            }
        }
    } else {
        if (obj._id) {
            const publicEntry = await service.fetch({collection: 'publicusers', _id: obj._id, asEntry: true})
            if(publicEntry) {
                return 'public'
            }
            const svrEntry = await service.fetch({collection: 'supervisors', _id: obj._id, asEntry: true})
            if(svrEntry) {
                return 'supervisor'
            }
        } else if (obj.email) {
            const svrEntry = await service.fetch({collection: 'supervisors', email: obj.email, asEntry: true})
            if(svrEntry) {
                return 'supervisor'
            }
        }
    }
    return null
    // if(publicEntry) {
    //     return 'public'
    // } else {
    //     const svrEntry = await service.fetch({collection: 'supervisors', email: obj.email, asEntry: true})
    //     if(svrEntry) {
    //         return 'supervisor'
    //     } else {
    //         return null
    //     }
    // }
}
