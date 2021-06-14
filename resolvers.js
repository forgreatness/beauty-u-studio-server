module.exports = {
    Query: {
        service: (_, { serviceId }, { dataSources }) => dataSources.beautyUStudioDB.getService(serviceId),
        services: (_, __, { dataSources }) => dataSources.beautyUStudioDB.getServices(),
        users: (_, { role }, { dataSources }) => dataSources.beautyUStudioDB.getUsers(role),
        user: (_, { userId }, { dataSources }) => dataSources.beautyUStudioDB.getUser(userId),
        appointments: (_, { filter }, { dataSources }) => dataSources.beautyUStudioDB.getAppointments(filter)
    },
    Mutation: {
        addService: (_, { serviceInput }, { dataSources }) => dataSources.beautyUStudioDB.addService({ serviceInput }),
        removeService: (_, { serviceID }, { dataSources }) => dataSources.beautyUStudioDB.removeService(serviceID),
        updateService: (_, { serviceID, serviceInput }, { dataSources }) => dataSources.beautyUStudioDB.updateService(serviceID, serviceInput),
        singleUpload: (_, { file }, { dataSources }) => dataSources.beautyUStudioDB.uploadUserPhoto(file),
        addUser: (_, { userInput }, { dataSources }) => dataSources.beautyUStudioDB.addUser(userInput),
        addAppointment: (_, { appointmentInput }, { dataSources }) => dataSources.beautyUStudioDB.addAppointment(appointmentInput)
    }
};