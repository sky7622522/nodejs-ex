var mongoose = require('mongoose');
var connectionString = process.env.OPENSHIFT_MONGODB_DB_URL || 'mongodb://localhost/testdb';
mongoose.connect(connectionString);