const axios = require('axios')
const service = require('./service')
const { searchApiOrgs } = require('./modules');

module.exports = async (req, res) => {
    const { sample } = req.params
    const { q } = req.query

    try {
        if(samples[sample]) {
            const output = await samples[sample](q)
            res.json(output)
        } else {
            res.status(404).json({success: false, message: 'Unknown search sample'})
        }
    } catch(e) {
        console.log(e)
        res.status(500).json({success: false, message: 'Internal server error'})
    }
}

const samples = {
    regions: async () => {
        const raw = await service.fetch({collection: 'regions', pipeline: [
            {$match: {visible: true}},
            {$sort: {kladr_id: 1}},
            {$project: {__v: 0, visible: 0, _id: 0}}
        ]})

        return raw
    },
    inn: async q => {
        const result = await searchApiOrgs(q)
        return result
    }
}
