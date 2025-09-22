const cron = require('node-cron')
const { getVKPosts, getNumbers } = require('../landing/modules')
console.log('CRON START');

cron.schedule('10 */1 * * *', async () => {
    console.log('CRON getVKPosts START');
    const res = await getVKPosts()
    console.log(res);
})

cron.schedule('25 */1 * * *', async () => {
    console.log('CRON getNumbers START');
    const res = await getNumbers()
    console.log(res);
})
