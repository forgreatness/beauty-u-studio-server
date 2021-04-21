const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type File {
        filename: String!
        mimetype: String!
        encoding: String!
    }

    type Service {
        id: ID!
        type: String!
        kind: Kind
        name: String!
        description: String!
        price: Float!
        time: Int!
    }

    type User {
        id: ID!
        name: String!
        email: String!
        phone: String!
        role: String!
        photo: String
        about: String
    }

    input ServiceInput {
        type: String!
        name: String!
        description: String!
        price: Float!
        time: Int!
        kind: [String!]
    }
    
    input UserInput {
        name: String!
        email: String!
        password: String!
        phone: String!
        role: String!
        photo: ID
        about: String
    }

    type Kind {
        type: String!,
        kind: Kind
    }

    type Query {
        uploads: [File]
        services: [Service]
        user(userId: ID!): User!
        users(role: String = "client"): [User]
    }

    type Mutation {
        singleUpload(file: Upload!) : ID!
        addService(serviceInput: ServiceInput!): Service!
        removeService(serviceID: ID!): Service!
        updateService(serviceID: ID!, serviceInput: ServiceInput): Service!
        addUser(userInput: UserInput!): User!
    }
`;

module.exports = typeDefs;