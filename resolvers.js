const { GraphQLUpload } = require('graphql-upload');

module.exports = {
    FileUpload: GraphQLUpload,
    Query: {
        service: (_, { serviceId }, { dataSources }) => dataSources.beautyUStudioDB.getService(serviceId),
        services: (_, __, { dataSources }) => dataSources.beautyUStudioDB.getServices(),
        users: (_, { role }, { dataSources, claim }) => dataSources.beautyUStudioDB.getUsers(claim, role),
        user: (_, { userId }, { dataSources, claim }) => dataSources.beautyUStudioDB.getUser(claim, userId),
        appointments: (_, { filter, future }, { dataSources, claim }) => dataSources.beautyUStudioDB.getAppointments(claim, filter, future),
        promotions: (_, __, { dataSources, claim }) => dataSources.beautyUStudioDB.getPromotions(claim),
        login: (_, { username, password }, { dataSources }) => dataSources.beautyUStudioDB.login(username, password)
    },
    Mutation: {
        activateUser: (_, { userId, activationCode }, { dataSources }) => dataSources.beautyUStudioDB.activateUser(userId, activationCode),
        addService: (_, { serviceInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addService(claim, serviceInput),
        removeService: (_, { serviceID }, { dataSources, claim }) => dataSources.beautyUStudioDB.removeService(claim, serviceID),
        updateService: (_, { serviceID, serviceInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.updateService(claim, serviceID, serviceInput),
        singleUpload: (_, { file }, { dataSources }) => dataSources.beautyUStudioDB.uploadUserPhoto(file),
        addUser: (_, { userInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addUser(claim, userInput),
        addAppointment: (_, { appointmentInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addAppointment(claim, appointmentInput),
        addPromotion: (_, { promotionInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addPromotion(claim, promotionInput),
        removePromotion: (_, { promotionID }, { dataSources, claim }) => dataSources.beautyUStudioDB.removePromotion(claim, promotionID),
        updateAppointment: (_, { appointmentID, appointmentInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.updateAppointment(claim, appointmentID, appointmentInput),
        removeAppointment: (_, { appointmentID }, { dataSources, claim }) => dataSources.beautyUStudioDB.removeAppointment(claim, appointmentID) 
    }
};      