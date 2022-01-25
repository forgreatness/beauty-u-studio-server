const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

hashPassword();

async function hashPassword () {
    try {
        const hash = await bcrypt.hash("@bangN2024", 10);

        console.log(hash);
    
        const match = await bcrypt.compare("@bangN2024", hash);

        const authToken = "";

        const payload = jwt.decode(authToken);

        if(!payload) {
            console.log('redirect');
        }

        console.log(payload);
    } catch (err) {
        throw Error(err);
    }
}