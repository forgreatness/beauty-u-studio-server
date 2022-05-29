const { gql } = require('apollo-server-express');

const typeDefs = gql`
    scalar FileUpload

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
        accountRecoveryCode: String!
        capabilities: [ID!]
    }

    type Appointment {
        id: ID!
        stylist: User!
        client: User!
        services: [Service!]!
        time: String!
        status: String!
        discount: Float
        details: String
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
        name: String
        email: String
        password: String
        phone: String
        role: String
        status: String
        activationCode: String
        accountRecoveryCode: String
        photo: ID
        about: String
        capabilities: [ID!]
    }

    input AppointmentInput {
        stylist: ID!
        client: ID!
        services: [ID!]!
        time: String!
        status: String!
        discount: Float
        details: String
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
        appointments(filter: AppointmentFilter = {}, future: Boolean = false): [Appointment!]
        login(username: String!, password: String!): String!
        promotions: [Promotion!]
        accountRecoveryToken(username: String!): String!
        recoverAccount(accountRecoveryToken: String!): String!
    }

    type Mutation {
        singleUpload(file: FileUpload!) : ID!
        activateUser(userId: ID!, activationCode: String!): String!
        addPromotion(promotionInput: PromotionInput!) : Promotion!
        removePromotion(promotionID: ID!) : Promotion!
        updatePromotion(promotionID: ID!, promotionInput: PromotionInput!) : Promotion!
        addService(serviceInput: ServiceInput!): Service!
        removeService(serviceID: ID!): Service!
        updateService(serviceID: ID!, serviceInput: ServiceInput): Service!
        addUser(userInput: UserInput!): String!
        updateUser(userID: ID!, userInput: UserInput!): User!
        addAppointment(appointmentInput: AppointmentInput!): Appointment!
        updateAppointment(appointmentID: ID!, appointmentInput: AppointmentInput!): Appointment!
        removeAppointment(appointmentID: ID!): Appointment!
    }
`;

module.exports = typeDefs;