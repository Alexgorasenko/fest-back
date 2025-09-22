//const bcrypt = require('bcrypt')
const service = require('../service')
const { commonCompose } = require('./tokens')
const { hashPwd, validatePwd } = require('../utils');

//const SALT_ROUNDS = 10

module.exports = async (req, res) => {
    const { email: emailIn, password } = req.body
    console.log(req.body);
    if (!emailIn || !password) {
        res.status(400).json({success: false, message: `Проверьте параметры`})
        return {}
    }
    const email = emailIn.trim().toLowerCase();
    let entry = await service.fetch({collection: 'publicusers', email: email, asEntry: true});
    let svr = await service.fetch({collection: 'supervisors', email: email, asEntry: true})
    let tokenOut = null;

    const out = {}
    if(svr) {
        if(!svr.verified) {
            svr.token = null
        } else {
            if(svr.blocked) {
                svr.token = null
            } else {
                const valid = await validatePwd(password, svr.password)
                if(valid) {
                    const {region_admin, ...restRoles} = svr.roles
                    const tknPayload = {email: svr.email, stamp: svr.createdAt, roles: restRoles, _id: svr._id}
                    const token = commonCompose(tknPayload)
                    svr.token = token;
                } else {
                    svr.token = null
                }
            }
        }
        delete svr.password;
        delete svr._id;

        out.svr = svr;
    } else {
        out.svr = null
    }
    if(entry) {
        if(!entry.verified) {
            //res.status(409).json({success: false, message: `Почта ${email} не подтверждена`})
            entry.token = null;
        } else {
            const valid = await validatePwd(password, entry.password)

            if(valid) {
                const tokenToSend = commonCompose({
                    _id: entry._id,
                    createdAt: entry.createdAt,
                    email,
                    hash: entry.password
                })
                entry.token = tokenToSend;
                tokenOut = tokenToSend
                //res.status(200).json({token: tokenToSend})
            } else {
                entry.token = null;
                //res.status(401).json({success: false, message: `Неверный логин или пароль`})
            }
        }
        delete entry.password;
        delete entry.requisites;
        delete entry._id;
        out.user = entry;
    } else {
        out.user = null
    }
    res.json({token: tokenOut, success: out.user && out.user.token ? true : out.svr && out.svr.token ? true : false, data: out})
}

// const validatePwd = (password, hash) => {
//     return new Promise((resolve, reject) => {
//         bcrypt.compare(password, hash, (err, result) => {
//             resolve(result)
//         })
//     })
// }
