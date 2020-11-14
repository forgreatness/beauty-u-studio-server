const { DataSource } = require('apollo-datasource');
const { Int32, ObjectID, Double } = require('mongodb');

module.exports = class BeautyUStudioDB extends DataSource {
    constructor({ store }) {
        super();
        this.store = store;
    }

    initialize(config) {
        this.context = config.context;
    }

    serviceReducer(service) {
        if (service.kind == null || service.kind.length == 0) {
            delete service.kind;

            return {
                ...service,
                id: service._id
            }
        } else {
            const kind = {};

            for(var i = service.kind.length-1; i > -1; i--) {
                kind.type = service.kind[i];

                if (i > 0) {
                    const new_kind = {
                        kind: kind
                    };

                    kind = new_kind;
                }
            }

            return {
                ...service,
                kind: kind,
                id: service._id
            };
        }
    }

    async getServices() {
        const services = await this.store.collection('services').find({}).toArray();

        return Array.isArray(services) ? services.map(service => this.serviceReducer(service)) : [];
    }

    async addService({ serviceInput }) {
        const service = JSON.parse(JSON.stringify(serviceInput));
        service.time = new Int32(service.time).valueOf();

        const result = await this.store.collection('services').insertOne(service);

        return this.serviceReducer(result.ops[0]);
    }

    async removeService(serviceID) {
        const service = await this.store.collection('services').findOne({ _id: ObjectID.createFromHexString(serviceID) });

        if (service) {
            const result = await this.store.collection('services').deleteOne({ _id: ObjectID.createFromHexString(serviceID) });
        } else {
            return new Error('No service was remove because it does not exist');
        }

        return this.serviceReducer(service);
    }

    async updateService(serviceID, serviceInput) {
        serviceInput = JSON.parse(JSON.stringify(serviceInput));
        serviceInput.time = new Int32(serviceInput.time);
        serviceInput.price = new Double(serviceInput.price);
        serviceInput = {
            $set: serviceInput
        };

        const result = await this.store.collection('services').updateOne({ _id: ObjectID.createFromHexString(serviceID) }, serviceInput);

        if (result.result.n < 1) {
            return new Error(`No Document with ObjectID ${serviceID} was found`);
        } else {
            if (result.result.nModified < 1) {
                return new Error('Document with ObjectID ${serviceID} was not updated because input provided did not contain any updated data');
            }
        }

        return {
            ...serviceInput["$set"],
            id: ObjectID.createFromHexString(serviceID)
        };
    }
}