const mod = [
    {$lookup: {
        from: 'nominations',
        let: {fid: '$_id'},
        pipeline: [
            {$match: {
                $expr: {$eq: ['$festivalId', '$$fid']}
            }},
            {$sort: {sort: 1}},
            {$project: {name: 1, educationLevels: 1, sort: 1, description: 1, nominationtypes: 1, countStudents: 1}},
            {$lookup: {
                from: 'educationlevels',
                let: {nid: '$_id'},
                pipeline: [
                    {$match: {
                        $expr: {$eq: ['$nominationId', '$$nid']}
                    }},
                    {$project: {nominationId: 0}},
                    {$sort: {sort: 1}}
                ],
                as: 'educationLevels'
            }},
        ],
        as: 'nominations'
    }},
    {$lookup: {
        from: 'activities',
        let: {fid: '$_id'},
        pipeline: [
            {$match: {
                $expr: {$eq: ['$$fid', '$festivalId']},
            }}
        ],
        as: 'activities'
    }}
]

module.exports = mod;
