const service = require('../service')

module.exports = async (req, res) => {
    const { token } = req.body

    if(!token) {
        res.status(400).send({error: true, message: 'Missing token'})
    } else {
        const entry = await service.fetch({collection: 'supervisors', token: token, asEntry: true})
        if(entry) {
            res.json({success: true, email: entry.email})
        } else {
            res.status(404).send({error: true, message: 'User not found'})
        }
    }
}
