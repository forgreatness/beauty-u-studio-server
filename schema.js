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

    type Appointment {
        id: ID!
        stylist: User!
        client: User!
        services: [Service!]!
        time: String!
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

    input AppointmentInput {
        stylist: ID!
        client: ID!
        services: [ID!]!
        time: String!
    }

    input AppointmentFilter {
        stylist: ID
        client: ID
    }

    type Kind {
        type: String!,
        kind: Kind
    }

    type Query {
        uploads: [File!]
        services: [Service!]
        service(serviceId: ID!): Service!
        user(userId: ID!): User!
        users(role: String = "client"): [User!]
        appointments(filter: AppointmentFilter): [Appointment!]
    }

    type Mutation {
        singleUpload(file: Upload!) : ID!
        addService(serviceInput: ServiceInput!): Service!
        removeService(serviceID: ID!): Service!
        updateService(serviceID: ID!, serviceInput: ServiceInput): Service!
        addUser(userInput: UserInput!): User!
        addAppointment(appointmentInput: AppointmentInput): Appointment!
    }
`;

module.exports = typeDefs;