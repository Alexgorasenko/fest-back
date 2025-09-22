const mod = [
    {$lookup: {
        from: 'nominations',
        let: {noms: '$nominations'},
        pipeline: [
            {$match: {
                $expr: {$in: ['$_id', '$$noms']}
            }},
            {$sort: {sort: 1}}
        ],
        as: 'nominations'
    }},
    {$lookup: {
        from: 'festsettings',
        let: {fid: '$_id'},
        pipeline: [
            {$match: {$expr: {$eq: ['$$fid', '$festivalId']}}},
            {$sort: {sampleId: 1}},
            {$lookup: {
                from: 'nominations',
                let: {sid: '$sampleId'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$sid', '$_id']}}},
                ],
                as: 'nomination'
            }},
            {$lookup: {
                from: 'activities',
                let: {sid: '$sampleId'},
                pipeline: [
                    {$match: {$expr: {$eq: ['$$sid', '$_id']}}},
                ],
                as: 'activity'
            }},
            {$set: {
                nomination: {'$arrayElemAt': ['$nomination', 0]},
                activity: {'$arrayElemAt': ['$activity', 0]},
            }}
        ],
        as: 'festsettings'
    }}
]

module.exports = mod;
