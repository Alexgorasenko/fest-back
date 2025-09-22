const mod = [
    {$lookup: {
        from: 'attachments',
        let: {id: '$_id'},
        pipeline: [
            {$match: {$expr: {$eq: ['$$id', '$sampleId']}}},
        ],
        as: 'attachments'
    }},
    {$lookup: {
        from: 'attachments',
        let: {aid: '$attachmentFormId'},
        pipeline: [
            {$match: {$expr: {$eq: ['$$aid', '$_id']}}},
        ],
        as: 'attachmentForm'
    }},
    // {$lookup: {
    //     from: 'festivals',
    //     let: {fid: '$festivalId'},
    //     pipeline: [
    //         {$match: {$expr: {$eq: ['$$fid', '$_id']}}},
    //         {$lookup: {
    //             from: 'nominations',
    //             let: {noms: '$nominations'},
    //             pipeline: [
    //                 {$match: {
    //                     $expr: {$in: ['$_id', '$$noms']}
    //                 }},
    //                 {$lookup: {
    //                     from: 'nominationtypes',
    //                     let: {types: '$nominationtypes'},
    //                     pipeline: [
    //                         {$match: {
    //                             $expr: {$in: ['$_id', '$$types']}
    //                         }}
    //                     ],
    //                     as: 'nominationtypes'
    //                 }},
    //                 {$lookup: {
    //                     from: 'educationlevels',
    //                     let: {eds: '$educationLevels'},
    //                     pipeline: [
    //                         {$match: {
    //                             $expr: {$in: ['$_id', '$$eds']}
    //                         }},
    //                         {$sort: {sort: 1}}
    //                     ],
    //                     as: 'educationLevels'
    //                 }},
    //                 {$sort: {sort: 1}}
    //             ],
    //             as: 'nominations'
    //         }},
    //     ],
    //     as: 'festival'
    // }},
    {$lookup: {
        from: 'organizations',
        let: {oid: '$organizationId'},
        pipeline: [
            {$match: {$expr: {$eq: ['$$oid', '$_id']}}},
        ],
        as: 'organization'
    }},
    {$lookup: {
        from: 'regions',
        let: {rid: '$regionId'},
        pipeline: [
            {$match: {$expr: {$eq: ['$$rid', '$_id']}}},
        ],
        as: 'region'
    }},
    {$set: {
        //festival: {'$arrayElemAt': ['$festival', 0]},
        organization: {'$arrayElemAt': ['$organization', 0]},
        region: {'$arrayElemAt': ['$region', 0]},
        attachmentForm: {'$arrayElemAt': ['$attachmentForm', 0]},        
    }}
]

module.exports = mod;
