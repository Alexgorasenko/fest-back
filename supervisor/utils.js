const service = require('../service')

module.exports = {
    extractRegions: async role => {
        const kladrs = [];

        if ( role ) {
            if ( role.canEdit && role.canEdit.length ) {
                kladrs.push(...role.canEdit)
            }
            if ( role.canView && role.canView.length ) {
                kladrs.push(...role.canView)
            }
        }
        const ids = kladrs && kladrs.length ? await service.fetch({
            collection: 'regions',
            pipeline: [
                {$match: {
                    kladr_id: {$in: kladrs}
                }},
                {$sort: {name: 1}}
            ]
        }) : null

        return ids ? { kladrs, ids } : null
    }
}
