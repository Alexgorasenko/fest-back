const bcrypt = require('bcrypt')

const service = require('./service')
const ObjectId = require('mongoose').Types.ObjectId
const jwt = require('jwt-simple')
const {decomposeToken: decodePublicUserToken, commonCompose: composePublicToken} = require('./user/tokens');
const SALT_ROUNDS = 10

const _ = {}

_.admins = []

_.getObjId = id => {
    try {
        const objId = id ? new ObjectId(id) : null;
        if (!objId || !id || id.toString() !== objId.toString()) {
            return null
        }
        return objId
    } catch (e) {
        return null
    }
}

_.isEmptyOrNull = (obj) => {
    if (obj) {
        for (let key in obj) {
          // если тело цикла начнет выполняться - значит в объекте есть свойства
          return false;
        }
    }
    return true;
}

_.uploader = async (folder, filename, encoded) => {
    const buffer = new Buffer(decodeURIComponent(encoded.replace(/^data:image\/\w+;base64,/, '')), 'base64')
    const uploaded = await doUpload()
    return uploaded
}
_.composePublicToken = (payload) => {
    return composePublicToken(payload)
}
_.decodePublicUserToken = token => {
    const decoded = decodePublicUserToken(token)
    return decoded && decoded._id ? {...decoded, uid: decoded._id} : {}
}

_.attachScopes = async (token, uid) => {
    try {
        const decoded = token ? jwt.decode(token, secret, true) : uid ? {uid: uid} : null
        if(decoded && decoded.uid) {
            const user = await service.fetch({collection: 'users', _id: new ObjectId(decoded.uid)})
            const scopes = await service.fetch({collection: 'scopes', userId: new ObjectId(decoded.uid)})
            return {
                profile: {
                    name: user ? user.name : 'No Name',
                    balance: 0,
                    userId: user ? user._id : null
                },
                scopes: scopes
            }
        } else {
            return null
        }
    } catch(e) {
        return null
    }
}

_.checkObjValid = ({keys, data}) => {
    try {
        if (_.isEmptyOrNull(data)) {
            return false
        }
        if (!keys || !Array.isArray(keys)) {
            return false;
        }

        for (let key of keys) {
            if (data[key] !== 'undefined' && (data[key] === null || data[key] === '') ) {
                return false
            }
        }

        return true;
    } catch (e) {
        console.log('utils.checkObjValid error', e);
        return false;
    }
}

_.hashPwd = (str) => {
    return new Promise((resolve, reject) => {
        bcrypt
            .hash(str, SALT_ROUNDS)
            .then(hash => {
                resolve(hash)
            })
            .catch(err => {
                reject()
            })
    })
}

_.validatePwd = (password, hash) => {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            resolve(result)
        })
    })
}

_.patchSampleData = (data) => {
    let patchedData = {};
    for (let key in data) {
        switch (true) {
            case (key === "_id"):
                patchedData[key] = _.getObjId(data[key])
                break;
            case (['educationlevels', 'nominationtypes'].includes(key)):
                patchedData[key] = data[key].map(id => _.getObjId(id))
                break
            case (['common', 'main', 'mandatory', 'additional'].includes(key)):
                patchedData[key] = data[key].map(obj => {
                    const mapd = {};
                    for (let k in obj) {
                        if (k === '_id' || k.includes('Id')) {
                            mapd[k] = _.getObjId(obj[k])
                        } else {
                            mapd[k] = obj[k]
                        }
                    }
                    return mapd
                })
                break
            default:
                patchedData[key] = data[key]
                break
        }
    }
    return patchedData
}

_.sampleReducer = async (col, key='_id', match={}) => {
    const arr = await service.fetch({collection: col, pipeline: [
        {$match: match},
    ]});

    const reduced = arr.reduce((acc, cur) => {
        if (cur[key] && !acc[cur[key]]) {
            acc[cur[key]] = cur;
        }
        return acc
    }, {});
    return reduced
}

const doUpload = (params) => {
    // return new Promise((resolve, reject) => {
    //     const objParams = {
    //         Bucket: 'amateum',
    //         ACL: 'public-read',
    //         Key: folder+'/'+filename,
    //         Body: buffer,
    //         ContentEncoding: 'base64',
    //         ContentType: 'image/png'
    //     }
    //
    //     resolve(s3.putObject(objParams).promise())
    // })
    return params
}

module.exports = _
