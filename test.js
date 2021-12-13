const bcrypt = require('bcrypt');

hashPassword();

async function hashPassword () {
    try {
        const hash = await bcrypt.hash("@bangN2024", 10);

        console.log(hash);
    
        const match = await bcrypt.compare("@bangN2024", hash);

        console.log(match);
    } catch (err) {
        throw Error(err);
    }
}