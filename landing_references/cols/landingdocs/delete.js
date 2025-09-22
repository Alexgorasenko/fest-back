const service = require('../../../service');
module.exports = async (req, id) => {
    if (!id) {
        return {error: true, msg: 'проверьте параметры'}
    }

    try {
        const res = await service.delete({collection: "landingdocs", _id:id })
        return {success: !!(res && res.deletedCount), data: res}
    } catch (e) {
        console.log('landingdocs err', e)
        return {success: false, errorStatus: 400, message: 'ошибка удаления'}
    }

}
