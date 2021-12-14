require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const { connectToDB, getDBReference } = require('./lib/mongo');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const BeautyUStudioDB = require('./datasources/BeautyUStudioDB');

const JWT_SIGNATURE = process.env.AUTH_SECRET;

connectToDB(() => {
    const store = getDBReference();
    
    const dataSources = () => ({
        beautyUStudioDB: new BeautyUStudioDB({ store })
    });

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async (context) => {
            const header =  context.req.headers.authorization;

            if (!header) return;

            const token = header.split(" ")[1];

            if (!token) return;

            let decodeToken;

            try {
                decodeToken = await jwt.verify(token, JWT_SIGNATURE);
            } catch (err) {
                return;
            }

            if (!!!decodeToken) return;

            return { claim: decodeToken };
        },
        dataSources
    });

    const app = express();
    const port = process.env.PORT || 8080;

    app.use(morgan('dev'));
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));

    const corsOptions = {
        origin: 'https://beautyustudioweb.azurewebsites.net',
        credentials: true
    };

    app.use(cors(corsOptions));

    server.applyMiddleware({ app });

    app.use('', (req, res) => {
        res.send("Welcome to the data interface for BeautyUStudio");
    });

    app.use('*', (req, res) => {
        res.status(404).json({
            error: "Requested resource " + req.originalUrl + " does not exist"
        });
    });

    app.listen(port, () => {
        console.log(`🚀 Server ready at http://localhost:${port}`)
    });
});