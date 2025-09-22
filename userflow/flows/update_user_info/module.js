const service = require('../../../service');
const { getObjId, isEmptyOrNull, decodeToken, hashPwd, checkObjValid } = require('../../../utils')
const { query_pipeline, festival_pipeline } = require('../../../pipelines')
const logger = require('../../../logger');

module.exports = async (req, item) => {
    try {
        const userId = getObjId(req.signer.uid);
        if (!userId) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }
        const entry = await service.fetch({collection: 'publicusers', pipeline: [
            {$match: {
                _id: userId
            }},
            {$project: {password: 0}}
        ]});

        if (!entry) {
            return {success: false, message: 'проверьте авторизацию', errorStatus: 401}
        }

        const { _id, email, ...patch } = req.body;
        if (!checkObjValid({keys: ['name', 'password'], data: patch})) {
            return {success: false, message: 'проверьте передаваемые значения', errorStatus: 400}
        }
        if (patch.password) {
            if (!frontChecker(patch.password)) {
                return {success: false, message: 'проверьте передаваемые значения', errorStatus: 400}
            }
            const hashed = await hashPwd(patch.password);

            patch.password = hashed
        }

        const res = await service.update({collection: 'publicusers', _id: userId}, patch);

        await logger({
            action: "put",
            collection: "publicusers",
            id: userId,
            authorCollection: 'publicusers',
            authorId: req.signer._id || req.signer.uid,
            author: req.signer.email || "no_mail",
            patch: patch
        })

        return {
            success: true
        }
    } catch (e) {
        console.log('userflow preload failed', e);
        return {success: false, message: 'userflow preload failed', errorStatus: 500}
    }
}

const frontChecker = str => {
    return /^(((?=.*[a-z])(?=.*[A-Z]))|((?=.*[a-z])(?=.*[0-9]))|((?=.*[A-Z])(?=.*[0-9])))(?=.{8,})./.test(str)
}
