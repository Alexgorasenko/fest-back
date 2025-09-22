const mongoose = require('mongoose')

const devBase = !process.env.INSTANCE || (process.env.INSTANCE === 'development')
const prStr = devBase ? 'mongodb://databaseRoot:ucbndh667RtsdZ_oPH@212.113.121.128:27017/school_fest_test?authMechanism=DEFAULT&authSource=admin' : `mongodb://festsClusterUser:Tkmyz7%242(@${process.env.MA}:27017/${process.env.DB_INSTANCE}?tls=true&tlsCAFile=${__dirname+'/creds'}/mongoCA.pem&tlsCertificateKeyFile=${__dirname+'/creds'}/clientPrimary.pem&tlsInsecure=true&authMechanism=DEFAULT&authSource=admin`

mongoose.connect(prStr, {useNewUrlParser: true, useUnifiedTopology: devBase})
