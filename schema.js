const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type Service {
        id: ID!
        type: String!
        kind: Kind
        name: String!
        description: String!
        price: Float!
        time: Int!
    }

    input ServiceInput {
        type: String!
        name: String!
        description: String!
        price: Float!
        time: Int!
        kind: [String!]
    }

    type Kind {
        type: String!,
        kind: Kind
    }

    type Query {
        services: [Service]
    }

    type Mutation {
        addService(serviceInput: ServiceInput): Service!
        removeService(serviceID: ID!): Service!
        updateService(serviceID: ID!, serviceInput: ServiceInput): Service!
    }
`;

module.exports = typeDefs;