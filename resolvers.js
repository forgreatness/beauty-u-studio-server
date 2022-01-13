module.exports = {
    Query: {
        service: (_, { serviceId }, { dataSources }) => dataSources.beautyUStudioDB.getService(serviceId),
        services: (_, __, { dataSources }) => dataSources.beautyUStudioDB.getServices(),
        users: (_, { role }, { dataSources, claim }) => dataSources.beautyUStudioDB.getUsers(claim, role),
        user: (_, { userId }, { dataSources, claim }) => dataSources.beautyUStudioDB.getUser(claim, userId),
        appointments: (_, { filter }, { dataSources, claim }) => dataSources.beautyUStudioDB.getAppointments(claim, filter),
        login: (_, { username, password }, { dataSources }) => dataSources.beautyUStudioDB.login(username, password)
    },
    Mutation: {
        addService: (_, { serviceInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addService(claim, serviceInput),
        removeService: (_, { serviceID }, { dataSources, claim }) => dataSources.beautyUStudioDB.removeService(claim, serviceID),
        updateService: (_, { serviceID, serviceInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.updateService(claim, serviceID, serviceInput),
        singleUpload: (_, { file }, { dataSources }) => dataSources.beautyUStudioDB.uploadUserPhoto(file),
        addUser: (_, { userInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addUser(claim, userInput),
        addAppointment: (_, { appointmentInput }, { dataSources, claim }) => dataSources.beautyUStudioDB.addAppointment(claim, appointmentInput)
    }
};  