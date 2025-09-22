require('./database')

const Schemas = require('./Schemas')
let service = {}
const ObjectId = require('mongoose').Types.ObjectId

service.count = params => {
    return new Promise((resolve, reject) => {
        const { collection } = params
        delete params.collection
        const sch = Schemas[collection]

        if(typeof(sch) !== 'undefined') {
            sch.countDocuments(params.pipeline ? params.pipeline[0]['$match'] : params, (err, qty) => {
                resolve(qty)
            })
        } else {
            reject('undefined collection')
        }
    })
}

service.fetch = params => {
    return new Promise((resolve, reject) => {
        const { collection, query, asArray, asEntry } = params
        delete params.collection
        delete params.query
        delete params.asArray
        delete params.asEntry
        const sch = Schemas[collection]

        if(params._id && typeof(params._id) === 'string') {
            params._id = new ObjectId(params._id)
        }

        if(query && query.filter && !params.pipeline) {
            for(let key in query.filter) {
                params[key] = key.includes('Id') ? new ObjectId(query.filter[key]) : query.filter[key] === 'true' ? true : query.filter[key] === 'exists' ? {$ne: null} : query.filter[key]
            }
        }

        if(query && query.suggest && !params.pipeline) {
            for(let key in query.suggest) {
                params[key] = {$regex: query.suggest[key], $options: 'i'}
            }
        }

        if(!params.scopes || Object.keys(params.scopes).length === 0) {
            delete params.scopes
        } else {
            for(let key in params.scopes) {
                params['scopes.'+key] = params.scopes[key] === 'true' ? {$ne: null} : {$eq: null}
            }
            delete params.scopes
        }

        const pipeline = params.pipeline || [{$match: params}]

        const itemsAsList = ['printable']

        if(typeof(sch) !== 'undefined') {
            sch.aggregate(pipeline).option({ allowDiskUse: true }).exec((err, result) => {
                if(err) {
                    reject(JSON.stringify(err))
                } else {
                    resolve((params._id || params.tid || params.phone || asEntry) && !params.interaction && !itemsAsList.includes(collection) && !asArray ? result[0] : result)
                }
            })
        } else {
            reject('undefined collection')
        }
    })
}

service.save = (params, data) => {
    return new Promise((resolve, reject) => {
        const { collection } = params
        delete params.collection
        const sch = Schemas[collection]

        if(typeof(sch) !== 'undefined') {
            let item = new sch(data)
            try {
                item.save((err, result) => {
                    if(err) {
                        resolve(JSON.stringify(err))
                    } else {
                        resolve(result)
                    }
                })
            } catch(e) {
                resolve(JSON.stringify(e))
            }
        } else {
            reject('undefined collection')
        }
    })
}

service.insertMany = async (
        params,
        data,
        config={
            ordered: false,
            lean: true,
            rawResult: true
            // lean: true
        }
    ) => {
    const { collection } = params
    delete params.collection
    const sch = Schemas[collection]
	if(typeof(sch) !== 'undefined') {
		try {
			const resp = await sch.insertMany(data, config)
			return {success: true, data: resp}
		} catch (e) {
			 return {success: false, err: e}
		}
	}else{
		return {success: false, err: 'undefined collection'}
	}
}

service.findOneAndUpdate = async (params, data) => {
    const {collection, match, updateConfig={new:true}} = params;
    if (!match || !data) {
        return {success: false, err: 'undefined match or data'}
    }

    if(match._id && typeof(match._id) === 'string') {
        match._id = new ObjectId(params._id)
    }

    const sch = Schemas[collection]

    if(typeof(sch) === 'undefined') {
        return {success: false, err: 'undefined collection'}
    }

    try {
        const resp = await sch.findOneAndUpdate(match, data, updateConfig)
        return resp
    } catch (e) {
        return {success: false, err: e}
    }
}

service.update = (params, data) => {
    return new Promise((resolve, reject) => {
        const { collection } = params
        delete params.collection
        const sch = Schemas[collection]

        if(typeof(params._id) === 'string') {
            params._id = new ObjectId(params._id)
        }

        if(data.push) {
            if(typeof(sch) !== 'undefined') {
                sch.update(params, {$push: {[data.push[0]]: data.push[1].length === 24 ? new ObjectId(data.push[1]) : data.push[1]}}, (err, result) => {
                    if(err) {
                        reject(JSON.stringify(err))
                    } else {
                        resolve(result)
                    }
                })
            } else {
                reject('undefined collection')
            }
        } else if(data.shift) {
            const _pipeline = [{$match: params}]
            if(typeof(sch) !== 'undefined') {
                sch.aggregate(_pipeline).exec((err, result) => {
                    if(err) {
                        reject(JSON.stringify(err))
                    } else {
                        const item = result[0]
                        if(item) {
                            const arr = data.shift[0].includes('.') ? item[data.shift[0].split('.')[0]][data.shift[0].split('.')[1]] : item[data.shift[0]]
                            if(arr) {
                                sch.update(params, {[data.shift[0]]: arr.filter(i => i && i.toString() !== data.shift[1])}, (err, result) => {
                                    if(err) {
                                        reject(JSON.stringify(err))
                                    } else {
                                        resolve(result)
                                    }
                                })
                            } else {
                                reject()
                            }
                        } else {
                            reject()
                        }
                    }
                })
            } else {
                reject('undefined collection')
            }
        } else {
            if(typeof(sch) !== 'undefined') {
                sch.update(params, data, (err, result) => {
                    if(err) {
                        reject(JSON.stringify(err))
                    } else {
                        resolve(result)
                    }
                })
            } else {
                reject('undefined collection')
            }
        }
    })
}

service.delete = (params) => {
    return new Promise((resolve, reject) => {
        const { collection } = params
        delete params.collection
        const sch = Schemas[collection]

        if(typeof(sch) !== 'undefined') {
            sch.remove(params, (err, result) => {
                if(err) {
                    reject(JSON.stringify(err))
                } else {
                    resolve(result)
                }
            })
        } else {
            reject('undefined collection')
        }
    })
}

module.exports = service
