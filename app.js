require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const { ApolloServer } = require('apollo-server-express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { graphqlUploadExpress } = require('graphql-upload');

const { connectToDB, getDBReference } = require('./lib/mongo');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const BeautyUStudioDB = require('./datasources/BeautyUStudioDB');

const JWT_SIGNATURE = process.env.AUTH_SECRET;
const env = process.env.NODE_ENV || 'development';

connectToDB(() => {
    const store = getDBReference();
    
    const dataSources = () => ({
        beautyUStudioDB: new BeautyUStudioDB({ store })
    });

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        context: async (context) => {
            try {
                const header =  context.req.headers.authorization;

                if (!header)  throw 'no authorization header provided'

                const token = header.split(" ")[1];

                if (!token) throw 'no auth token founded on auth header'

                let decodeToken;

                decodeToken = await jwt.verify(token, JWT_SIGNATURE);

                if (!decodeToken) {
                    throw 'token is not valid';
                }

                return { claim: decodeToken };
            } catch (err) {
                return;
            }
        },
        uploads: false,
        dataSources
    });

    const app = express();

    app.use(graphqlUploadExpress());

    const port = process.env.PORT || 8080;

    app.use(morgan('dev'));
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    const corsOptions = {
        origin: ['http://localhost:3000', 'https://localhost:3000', 'https://beautyustudioweb.azurewebsites.net', 'https://beautyustudio.com', 'https://www.beautyustudio.com'],
        credentials: true
    };

    server.applyMiddleware({ app, cors: corsOptions });

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
