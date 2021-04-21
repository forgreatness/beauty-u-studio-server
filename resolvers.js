module.exports = {
    Query: {
        services: (_, __, { dataSources }) => dataSources.beautyUStudioDB.getServices()
    },
    Mutation: {
        addService: (_, { serviceInput }, { dataSources }) => dataSources.beautyUStudioDB.addService({ serviceInput }),
        removeService: (_, { serviceID }, { dataSources }) => dataSources.beautyUStudioDB.removeService(serviceID),
        updateService: (_, { serviceID, serviceInput }, { dataSources }) => dataSources.beautyUStudioDB.updateService(serviceID, serviceInput),
        singleUpload: (_, { file }, { dataSources }) => dataSources.beautyUStudioDB.uploadUserPhoto(file),
        addUser: (_, { userInput }, { dataSources }) => dataSources.beautyUStudioDB.addUser(userInput)
    }
};