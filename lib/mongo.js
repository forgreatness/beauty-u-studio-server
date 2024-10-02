const { MongoClient } = require('mongodb');

let db = null; 

exports.connectToDB = (callback) => {
    const mongoUser = process.env.MONGO_USER;
    const mongoPassword = process.env.MONGO_PASSWORD;
    const mongoDBName = process.env.MONGO_DB_NAME;
    
    const mongoUrl = `mongodb+srv://${mongoUser}:${mongoPassword}@beautyustudio.dwrqy.mongodb.net/${mongoDBName}?retryWrites=true&w=majority`;

    const client = new MongoClient(
        mongoUrl,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }
    );

    client.connect((err, client) => {
        if (err) {
            throw err;
        }

        db = client.db(mongoDBName);
        callback();
    });
}

exports.getDBReference = () => {
    return db;
}

