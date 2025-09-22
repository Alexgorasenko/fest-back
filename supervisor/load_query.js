const service = require('../service')
const ObjectId = require('mongoose').Types.ObjectId
const { getFestPreloadData } = require('../modules')

const definePermsLevel = (entry, roles) => {
    if(roles.superadmin || roles.admin || roles.rfu_admin) {
        return 'full'
    } else {
        if(roles.region_admin && roles.region_admin.canEdit) {
            if(roles.region_admin.canEdit.includes(entry.organizationQueryData.address.region.kladr_id)) {
                return 'full'
            }
        }

        if(roles.region_admin && roles.region_admin.canView) {
            if(roles.region_admin.canView.includes(entry.organizationQueryData.address.region.kladr_id)) {
                return 'read'
            }
        }

        return null
    }
}

const fetchFestNoms = async _id => {
    const festivalres = await getFestPreloadData({ _id });
    const festival = festivalres.data;

    const festnoms = festival.nominations.reduce((acc, cur) => {
        if (!acc[cur._id]) {
            acc[cur._id] = cur;
        }
        return acc
    }, {});

    return [festival, festnoms]
}

module.exports = async (req, res) => {
    const { id } = req.params
    const { roles } = req

    const entry = await service.fetch({collection: 'queries', _id: new ObjectId(id)})
    if(entry) {
        const permsLevel = definePermsLevel(entry, roles)
        if(!permsLevel) {
            res.status(403).send({error: true, message: 'Not enough permissions'})
        } else {
            const [festival, festnoms] = await fetchFestNoms(entry.festivalId)

            const noms = entry.nominations && entry.nominations.length ? entry.nominations.map(cur => {
                if (!festnoms[cur._id]) {
                    return cur
                }

                const {nominationtypes, educationLevels, ...nom} = festnoms[cur._id];

                const maped = {
                    ...cur,
                    ...nom,
                    levels: cur.levels.map(l => {
                        const levelData = educationLevels.find(edlevel => edlevel._id && l._id && edlevel._id.toString() === l._id.toString());

                        if (levelData && levelData.option_description) {
                            levelData.name += ` (${levelData.option_description})`
                        }
                        return {
                        ...l,
                        levelData: levelData
                    }})
                }
                return maped
            }) : []

            const mergedQuery = {...entry, nominations: noms, festival: festival}

            res.json({
                entry: mergedQuery,
                access: permsLevel
            })
        }
    } else {
        res.status(404).send({error: true, message: 'Query not found'})
    }
}
