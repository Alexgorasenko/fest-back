const fs = require('fs')
const files = fs.readdirSync(__dirname)

module.exports = files.reduce((acc, f) => {
    if(f !== 'index.js' ) {
        acc[f.replace('.js', '')] = require(__dirname+'/'+f)
    }

    return acc
}, {})
