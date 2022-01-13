const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

hashPassword();

async function hashPassword () {
    try {
        const hash = await bcrypt.hash("@bangN2024", 10);

        console.log(hash);
    
        const match = await bcrypt.compare("@bangN2024", hash);

        const authToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwYjQyMDk1ZDJmZTI2NWNlOTIyZTljZCIsIm5hbWUiOiJCYW5nIE5ndXllbiIsImNvbnRhY3QiOiI5NzEzNDQzNTU5Iiwicm9sZSI6ImNsaWVudCIsImlhdCI6MTY0MTE0NDU4MSwiZXhwIjoxNjQxNzQ5MzgxLCJhdWQiOiJiZWF1dHl1c3R1ZGlvc2VydmVyIGNsaWVudHMiLCJpc3MiOiJiZWF1dHl1c3R1ZGlvc2VydmVyIiwic3ViIjoiYmVhdXR5dXN0dWRpb3NlcnZlciBqd3QifQ.qpAutNE6DEnqBmft2MaZMiiOo1_b3bRAGFH5azn_1qk";

        const payload = jwt.decode(authToken);

        console.log(payload);
    } catch (err) {
        throw Error(err);
    }
}