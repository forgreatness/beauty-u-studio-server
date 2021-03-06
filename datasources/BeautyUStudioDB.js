const { DataSource } = require('apollo-datasource');
const { Int32, ObjectID, Double, GridFSBucket } = require('mongodb');

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

    userReducer(user, userPhoto) {
        user = {
            ...user,
            id: user._id
        };

        if (userPhoto) {
            user = {
                ...user,
                photo: userPhoto
            };
        }

        return user;
    }

    appointmentReducer(appointment) {
        return {
            id: appointment._id,
            ...appointment
        };
    }

    async getService(serviceId) {
        try {
            if (serviceId == null) {
                throw 'serviceId input is missing from parameter';
            }

            const service = await this.store.collection('services').findOne({ _id: ObjectID.createFromHexString(serviceId) });

            return this.serviceReducer(service);
        } catch (err) {
            return new Error(err);
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

    async uploadUserPhoto(file) {
        return file
            .then(file => {
                const bucket = new GridFSBucket(this.store);
                const {createReadStream, filename, mimetype} = file;

                const fileStream = createReadStream();

                return fileStream.pipe(bucket.openUploadStream(filename))
            })
            .then(result => {
                return result.id;
            })
            .catch(err => {
                return new Error(err);
            });
    }

    async getUser(userId) {
        try {
            const user = await this.store.collection('users').findOne({ _id: ObjectID.createFromHexString(userId) });

            let downloadedPhoto = null;

            if (user.photo) {
                downloadedPhoto = await this.downloadUserPhoto(user.photo);
            }

            if (!user) {
                throw 'Error getting user, nothing was returned';
            }

            return this.userReducer(user, downloadedPhoto);
        } catch(err) {
            return new Error(err);
        }
    }

    async getUsers(role) {
        var users = [];

        try {
            if (role.toLowerCase() == 'all') {
                users = await this.store.collection('users').find({}).toArray();
            } else {
                users = await this.store.collection('users').find({ role: role }).toArray();
            }

            if (!users) {
                throw 'Error getting users, nothing was returned';
            }

            users.forEach((user, index) => {
                let downloadedPhoto = null;

                if (user.photo) {
                    downloadedPhoto = this.downloadUserPhoto(user.photo);
                }

                users[index] = this.userReducer(user, downloadedPhoto);
            });

            return users;
        } catch(err) {
            return new Error(err);
        }
    }

    async addUser(userInput) {
        const user = JSON.parse(JSON.stringify(userInput));

        if (user.role.toLowerCase() == 'stylist') {
            if (!user.photo || !user.about) {
                return new Error('New user whom are stylist must have an existing photo uploaded to Database and an about')
            }
        }

        try {
            let userPhoto = null;

            if (user.photo) {
                user.photo = ObjectID.createFromHexString(user.photo);

                userPhoto = await this.downloadUserPhoto(user.photo);
            }

            const result = await this.store.collection('users').insertOne(user);

            if (!result) {
                throw 'unable to create new user successfully';
            }

            return this.userReducer(result.ops[0], userPhoto);
        } catch(err) {
            return new Error(err);
        }
    }

    async getAppointments(filter) {
        let appointments = [];

        try {
            const query = [];

            if (filter != null) {
                filter = JSON.parse(JSON.stringify(filter));
                
                if (filter.stylist != null) {
                    query.push({
                        stylist: ObjectID.createFromHexString(filter.stylist.toString())
                    });
                }

                if (filter.client != null) {
                    query.push({
                        client: ObjectID.createFromHexString(filter.client.toString())
                    });
                }
            }

            var expression = query.length > 0 ? { $or: query } : {};

            appointments = await this.store.collection('appointments').find(expression).toArray();

            if (Array.isArray(appointments)) {
                for (var i = 0; i < appointments.length; i++) {
                    let appointment = {};

                    appointment.stylist = await this.getUser(appointments[i].stylist.toString());
                    appointment.client = await this.getUser(appointments[i].client.toString());

                    if (appointments[i].services) {
                        appointment.services = appointments[i].services.map(async serviceId => await this.getService(serviceId.toString()));   
                    } else {
                        throw err("every appointment must have a service");
                    }

                    appointment.time = appointments[i].time;
                    appointment.id = appointments[i]._id;

                    appointments[i] = appointment;
                }
            } else {
                appointments = [];
            }

            return appointments;
        } catch (err) {
            return new Error(err);
        }
    }

    downloadUserPhoto(photoId) {
        const bucket = new GridFSBucket(this.store);

        const fileReadStream = bucket.openDownloadStream(photoId);

        let chunks = [];

        return new Promise((resolve, reject) => {
            fileReadStream
                .on('data', (chunk) => {
                    chunks.push(chunk);
                })
                .on('end', () => {
                    let buff = Buffer.concat(chunks);

                    resolve(buff.toString('base64'));
                })
                .on('error', (err) => {
                    reject(err);
                });
        });
    }

    async addAppointment(appointmentInput) {
        const newAppointment = JSON.parse(JSON.stringify(appointmentInput));

        try {
            newAppointment.stylist = ObjectID.createFromHexString(newAppointment.stylist.toString());
            newAppointment.client = ObjectID.createFromHexString(newAppointment.client.toString());

            newAppointment.services = newAppointment.services.map(service => {
                return ObjectID.createFromHexString(service.toString());
            });

            const result = await this.store.collection('appointments').insertOne(newAppointment);

            if (!result) {
                throw ('unable to create new appointment');
            }

            const appointment = result.ops[0];

            appointment.stylist = await this.getUser(newAppointment.stylist.toHexString());
            appointment.client = await this.getUser(newAppointment.client.toHexString());

            appointment.services = await Promise.all(appointment.services.map(async service => {
                return await this.getService(service.toHexString());
            }));

            return this.appointmentReducer(appointment);
        } catch (err) {
            return new Error(err);
        }
    }
}