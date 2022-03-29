const { gql } = require('apollo-server-express');

const typeDefs = gql`
    type File {
        filename: String!
        mimetype: String!
        encoding: String!
    }

    type Promotion {
        id: ID!
        code: String!
        description: String!
        type: String!
        amount: Int!
        start: String!
        end: String!
        services: [ID!]!
    }

    type Service {
        id: ID!
        type: String!
        kind: Kind
        name: String!
        description: String!
        price: Float!
        time: Int!,
        status: String!
    }

    type User {
        id: ID!
        name: String!
        email: String!
        phone: String!
        role: String!
        status: String!
        photo: String
        about: String
        activationCode: String!
    }

    type Appointment {
        id: ID!
        stylist: User!
        client: User!
        services: [Service!]!
        time: String!
        status: String!
    }

    input PromotionInput {
        code: String!
        description: String!
        type: String!
        amount: Int!
        start: String!
        end: String!
        services: [ID!]!
    }

    input ServiceInput {
        type: String!
        name: String!
        description: String!
        price: Float!
        time: Int!
        kind: [String!],
        status: String!
    }
    
    input UserInput {
        name: String!
        email: String!
        password: String!
        phone: String!
        role: String!
        activationCode: String!
        photo: ID
        about: String
    }

    input AppointmentInput {
        stylist: ID!
        client: ID!
        services: [ID!]!
        time: String!
        status: String!
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
        login(username: String!, password: String!): String!
        promotions: [Promotion!]
    }

    type Mutation {
        singleUpload(file: Upload!) : ID!
        activateUser(userId: ID!, activationCode: String!): String!
        addPromotion(promotionInput: PromotionInput!) : Promotion!
        removePromotion(promotionID: ID!) : Promotion!
        updatePromotion(promotionID: ID!, promotionInput: PromotionInput!) : Promotion!
        addService(serviceInput: ServiceInput!): Service!
        removeService(serviceID: ID!): Service!
        updateService(serviceID: ID!, serviceInput: ServiceInput): Service!
        addUser(userInput: UserInput!): String!
        addAppointment(appointmentInput: AppointmentInput!): Appointment!
        updateAppointment(appointmentID: ID!, appointmentInput: AppointmentInput!): Appointment!
        removeAppointment(appointmentID: ID!): Appointment!
    }
`;

module.exports = typeDefs;