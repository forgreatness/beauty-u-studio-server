const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');  
const { ApolloServer } = require('apollo-server-express');

const { connectToDB, getDBReference } = require('./lib/mongo');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');
const BeautyUStudioDB = require('./datasources/BeautyUStudioDB');

connectToDB(() => {
    const store = getDBReference();
    
    const dataSources = () => ({
        beautyUStudioDB: new BeautyUStudioDB({ store })
    });

    const server = new ApolloServer({
        typeDefs,
        resolvers,
        dataSources
    });

    const app = express();
    const port = process.env.PORT || 80;

    app.use(morgan('dev'));
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));

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