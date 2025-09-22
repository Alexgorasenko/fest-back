const fs = require('fs')
const path = require('path')
const hbs = require('hbs')
const getterViewData = require('./getters')
const tplDir = fs.readdirSync(__dirname+'/views')
for(let dir of tplDir) {
    const prtDir = fs.readdirSync(__dirname+'/views/'+dir+'/partials')
    for(let prt of prtDir) {
        hbs.registerPartial(`${dir}_${prt.replace('.hbs','')}_partial`, fs.readFileSync(`${__dirname}/views/${dir}/partials/${prt}`).toString())
    }
}

module.exports = async (req, res) => {
    const { view, id } = req.params
    if (view && getterViewData[view]) {

        const data = await getterViewData[view](id, req.signer, req.query)
        if (data && data.success !== false && data.data) {
            res.render(`${__dirname}/views/${view}/root.hbs`, data.data)
        } else {
            res.status(400).json(data)
        }
    } else {
        res.status(401).json({success: false, msg: 'view not found'})
    }
}
