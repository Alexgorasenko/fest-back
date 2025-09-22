const service = require('../service');
const moment = require('moment');

const mod = async () => {
    try {
        const start = new Date("2024-05-14 16:30");
        console.log(start);

        for (let col of ['publicusers', 'supervisors']) {
            let count = 0;

            const users = await service.fetch({collection: col, pipeline: [
                {$match: {}},
                {$project: {email: 1}}
            ]})

            console.log(users.length);

            for (let user of users) {
                const email2 = user.email.trim().toLowerCase();
                if (email2 !== user.email) {

                    const patch = {
                        email: email2,
                        email2: user.email
                    }

                    let queryUpd = await service.update({collection: col, _id: user._id}, patch)
                    if (count < 5) {
                        console.log(patch, queryUpd);
                    }
                    count += 1;
                }
            }
            console.log('FINISHED',count);
        }

        return {success: true}
    } catch (e) {
        console.log('SV patch query failed', e);
    }
}

//mod()
