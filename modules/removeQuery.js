const service = require('../service');
const { getObjId } = require('../utils')
//const removeAttach = require('./removeAttach')
const logger = require('../logger');

module.exports = async (item, handledBy, signer) => {
    try {
        const queryId = getObjId(item)

        if (!queryId) {
            return {success: false, message: 'проверьте параметры', errorStatus: 400}
        }
        const query = await service.fetch({collection: 'queries', _id: queryId});
        if (!query) {
            return {success: false, message: `заявка ${item} не найдена`, errorStatus: 400}
        }
        const patch = {status: "ARCHIVED", archived: true, handledAt: new Date()}
        if (handledBy) {
            patch.handledBy = handledBy
        }
        const res = await service.update({collection: 'queries', _id: queryId}, patch )
        // const attachs = await service.fetch({collection: 'attachments', sampleId: queryId});
        // for (let attach of attachs) {
        //     await removeAttach(attach._id)
        // }
        await logger({
            action: "put",
            collection: "queries",
            id: item,
            authorCollection: signer.collection || 'supervisors',
            authorId: signer._id,
            author: signer.email || "no_mail",
            patch: patch
        })
        return {success: true}
    } catch (e) {
        console.log('remove query failed', e);
        return {success: false, message: 'remove query failed', errorStatus: 500}
    }
}
