const fs = require('fs')
const path = require('path')
const hbs = require('hbs')

const tplDir = fs.readdirSync(__dirname+'/views/partials')
for(let prt of tplDir) {
    hbs.registerPartial(`${prt.replace('.hbs','')}_partial`, fs.readFileSync(`${__dirname}/views/partials/${prt}`).toString())
}

module.exports = async (req, res) => {
    const { subject } = req.params

    const data = {subject: subject}
    res.render(`${__dirname}/views/root.hbs`, data)
}
