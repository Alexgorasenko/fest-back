const paths = {
    create: require('./create'),
    signin: require('./signin'),
    verify: require('./verify'),
    recover: require('./recover'),
    recovery_access: require('./recovery_access')
}

module.exports = async (req, res) => {
    const { path } = req.params

    if (path && paths[path]) {
        await paths[path](req, res)
    } else {
        res.status(404).json({success: false, message: 'check rqst ' + path})
    }

    return
}
