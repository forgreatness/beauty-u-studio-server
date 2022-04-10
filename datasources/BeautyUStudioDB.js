const { DataSource } = require('apollo-datasource');
const { UserInputError, AuthenticationError, ForbiddenError } = require('apollo-server-core');
const { Int32, ObjectID, Double, GridFSBucket } = require('mongodb');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SIGNATURE = process.env.AUTH_SECRET;

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

    promotionReducer(promotion) {
        return {
            ...promotion,
            id: promotion._id
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

    async login(username, password) {
        try {
            if (username) {
                const user = await this.store.collection('users').findOne({ email: username.toLowerCase() });

                if (!user) {
                    throw new AuthenticationError('Invalid credentials');
                }

                const match = await bcrypt.compare(password, user.password);

                if (!match) {
                    throw new AuthenticationError('Invalid Credentials');
                }

                const payload = {
                    id: user._id,
                    name: user.name,
                    contact: user.phone,
                    role: user.role,
                };

                const token = jwt.sign(payload, JWT_SIGNATURE, {
                    expiresIn: "7d",
                    subject: "beautyustudioserver jwt",
                    issuer: "beautyustudioserver",
                    audience: "beautyustudioserver clients"
                });
                
                return token;
            } else {
                throw new UserInputError('Not a valid username');
            }
        } catch (err) {
            return err;
        }
    }

    async activateUser(userId, activationCode) {
        try {
            let user = await this.store.collection('users').findOne({ _id: ObjectID.createFromHexString(userId) });

            if (!user || user.activationCode != activationCode) {
                throw UserInputError('invalid activation link');
            } 

            let activate = await this.store.collection("users").updateOne({ _id: ObjectID.createFromHexString(userId) }, { $set: { status: 'active' } });

            if (activate.result.n < 1) {
                return new Error(`No Document with ObjectID ${userId} was found`);
            } else {
                if (activate.result.nModified < 1) {
                    return new Error(`Document with ObjectID ${userId} was not updated because input provided did not contain any updated data`);
                }
            }

            const payload = {
                id: user._id,
                name: user.name,
                contact: user.phone,
                role: user.role,
            };

            const token = jwt.sign(payload, JWT_SIGNATURE, {
                expiresIn: "7d",
                subject: "beautyustudioserver jwt",
                issuer: "beautyustudioserver",
                audience: "beautyustudioserver clients"
            });
            
            return token;
        } catch (err) {
            return err;
        }
    }

    async getService(serviceId) {
        try {
            if (serviceId == null) {
                throw new UserInputError('serviceId input is missing from parameter');
            }

            const service = await this.store.collection('services').findOne({ _id: ObjectID.createFromHexString(serviceId) });

            if (!service) {
                throw new UserInputError('ServiceId does not exist');
            }

            return this.serviceReducer(service);
        } catch (err) {
            return new Error(err);
        }
    }

    async getServices() {
        try {
            const services = await this.store.collection('services').find({}).toArray();

            return Array.isArray(services) ? services.map(service => this.serviceReducer(service)) : [];
        } catch (err) {
            return new Error(err);
        }
    }

    async addService(claim, serviceInput) {
        if (!claim) {
            throw new AuthenticationError('Request is not authenticated');
        }

        if ((claim?.role.toLowerCase() ?? "") != 'admin') {
            throw new ForbiddenError('User does not have permission to add service');
        }

        try {
            const service = JSON.parse(JSON.stringify(serviceInput));
            service.price = new Double(service.price);
            service.time = new Int32(service.time);
    
            const result = await this.store.collection('services').insertOne(service);

            if (!result?.insertedCount) {
                throw new Error('Unable to create new service');
            }
    
            return this.serviceReducer(result.ops[0]);
        } catch (err) {
            return new Error(err);
        }
    }

    async removeService(claim, serviceID) {
        if (!claim) {
            throw new AuthenticationError('Request is not authenticated');
        }

        if ((claim?.role.toLowerCase() ?? "") != 'admin') {
            throw new ForbiddenError('User does not have permission remove service');
        }

        try {
            const service = await this.store.collection('services').findOne({ _id: ObjectID.createFromHexString(serviceID) });

            if (service) {
                const result = await this.store.collection('services').deleteOne({ _id: ObjectID.createFromHexString(serviceID) });
            } else {
                return new Error('No service was remove because it does not exist');
            }
    
            return this.serviceReducer(service);
        } catch (err) {
            return new Error(err);
        }
    }

    async updateService(claim, serviceID, serviceInput) {
        if (!claim) {
            throw new AuthenticationError('Request is not authenticated');
        }

        if ((claim?.role.toLowerCase() ?? "") != 'admin') {
            throw new ForbiddenError('User does not have permission update service');
        }

        try {
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
        } catch (err) {
            return new Error(err);
        }
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

    async getUser(claim, userId) {
        try {
            const user = await this.store.collection('users').findOne({ _id: ObjectID.createFromHexString(userId) });

            if (!user) {
                throw new UserInputError("No user found");
            }

            if (user.role.toLowerCase() == 'client') {
                if ((claim?.id ?? "") != userId) {
                    if ((claim?.role.toLowerCase() ?? "") != 'stylist' && (claim?.role.toLowerCase() ?? "") != 'admin') {
                        throw new ForbiddenError('if you are not an admin or stylists you are not allow to obtains other clients users details');
                    }
                }
            }

            let downloadedPhoto = null;

            if (user.photo) {
                downloadedPhoto = await this.downloadUserPhoto(user.photo);
            }

            return this.userReducer(user, downloadedPhoto);
        } catch(err) {
            return new Error(err);
        }
    }

    async getUsers(claim, role) {
        if (!role) {
            if ((claim?.role.toLowerCase() ?? "") != 'stylist' && (claim?.role.toLowerCase() ?? "") != 'admin') {
                throw new ForbiddenError("Only admin or stylist can get all users details");
            }
        } else if (role.toLowerCase() == 'client') {
            if ((claim?.role.toLowerCase() ?? "") != 'stylist' && (claim?.role.toLowerCase() ?? "") != 'admin') {
                throw new ForbiddenError('Only admin or stylist can get all clients details');
            }
        }

        try {
            var users = [];
            
            if (!role) {
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

    async addUser(claim, userInput) {
        const user = JSON.parse(JSON.stringify(userInput));

        //With Current implementation all new user are active
        user.status = "not activated";

        // You can only create admin or stylist account if you are an admin
        if ((claim?.role.toLowerCase() ?? "") != 'admin') {
            if (user.role.toLowerCase() == 'admin' || user.role.toLowerCase() == 'stylist') {
                return new ForbiddenError("unable to create account due to restriction level");
            }
        }

        // You can only create an account with the following listed roles
        if (user.role.toLowerCase() != 'admin' && user.role.toLowerCase() != 'stylist' && user.role.toLowerCase() != 'client') {
            return new UserInputError('User only can only have admin, stylist, or client role');
        }

        // New account which are for stylist or admin must have a photo and about details
        if (user.role.toLowerCase() == 'stylist' || user.role.toLowerCase() == 'admin') {
            if (!user.photo || !user.about) {
                return new UserInputError('New user whom are stylist or admin must have an existing photo uploaded to Database and an about')
            }
        }

        try {
            let userPhoto = null;

            if (user.photo) {
                user.photo = ObjectID.createFromHexString(user.photo);

                userPhoto = await this.downloadUserPhoto(user.photo);

                if (!userPhoto) {
                    return new UserInputError('Unable to create account because provided photo is not valid');
                }
            }

            const hashedPassword = await bcrypt.hash(user.password, 10);
            user.password = hashedPassword;

            const result = await this.store.collection('users').insertOne(user);

            if (!result) {
                throw 'unable to create new user successfully';
            }

            const newUser = result.ops[0];
            const payload = {
                id: newUser._id,
                name: newUser.name,
                contact: newUser.phone,
                role: newUser.role
            };

            const token = jwt.sign(payload, JWT_SIGNATURE, {
                expiresIn: "7d",
                subject: "beautyustudioserver jwt",
                issuer: "beautyustudioserver",
                audience: "beautyustudioserver clients"
            });

            return token;
        } catch(err) {
            return new Error(err);
        }
    }

    async removePromotion(claim, promotionID) {
        try {
            if (!claim) {
                return new AuthenticationError('Action requires authentication');
            }

            if ((claim?.role ?? "") != 'admin') {
                return new ForbiddenError('Action is not permitted for user crendentials');
            }

            const originalPromotion = await this.store.collection('promotions').findOne({ _id: ObjectID.createFromHexString(promotionID ?? '') });

            if (!originalPromotion) {
                throw new UserInputError('Invalid user input, promotion does not exist');
            }

            const removePromotion = await this.store.collection('promotions').deleteOne({ _id: ObjectID.createFromHexString(promotionID ?? '') });

            if ((removePromotion?.deletedCount ?? 0) < 1) {
                throw 'Unable to remove the specified promotion';
            }

            return this.promotionReducer(originalPromotion);
        } catch (err) {
            return new Error(err?.message ?? 'Server Error');
        }
    }

    async addPromotion(claim, promotionInput) {
        try {
            if (!claim) {
                return new AuthenticationError('Action requires authentication');
            }

            if ((claim?.role ?? "") != 'admin') {
                return new ForbiddenError('Action is not permitted for user crendentials');
            }

            const newPromotion = JSON.parse(JSON.stringify(promotionInput));

            newPromotion.services.forEach((serviceId, index) => {
                newPromotion.services[index] = ObjectID.createFromHexString(serviceId);
            });

            let addPromotion = await this.store.collection('promotions').insertOne(newPromotion);

            if (!addPromotion?.insertedCount) {
                throw new Error('Server Error: Unable to create new promotion');
            }

            return this.promotionReducer(addPromotion.ops[0]);
        } catch (err) {
            return new Error(err?.message ?? 'Server Error');
        }
    }

    async getPromotions(claim) {
        if (!claim) {
            return new AuthenticationError('Not authenticated');
        }

        try {
            let promotions = await this.store.collection('promotions').find({}).toArray();

            if (Array.isArray(promotions)) {
                promotions = promotions.map(promotion => this.promotionReducer(promotion));
            } else {
                throw new Error('Server Error');
            }

            return promotions;
        } catch (err) {
            return new Error(err?.message ?? 'Server Error');
        }
    }

    async getAppointments(claim, filter, future) {
        if (!claim) {
            return new AuthenticationError('Not authenticated');
        }

        filter = JSON.parse(JSON.stringify(filter));

        if ((claim?.role.toLowerCase() ?? "") != 'admin' && (claim?.role.toLowerCase() ?? "") != 'stylist') {
            if (filter.client) {
                if ((claim?.id ?? "") != filter.client) {
                    return new ForbiddenError('User whom are clients can only get appointments for them or any of the stylists');
                }
            }

            // If the user doesn't provide any filter input, then the system gets all appointments which should only be authorize
            // for the admin and stylists. 
            if (!filter.client && !filter.stylist) {
                return new ForbiddenError('Clients can only get appointments for them and the appointments of the stylist');
            }
        }

        try {
            let appointments = [];
            const query = [];

            if (filter != null) {
                if (filter.stylist != null) {
                    query.push({
                        stylist: ObjectID.createFromHexString(filter.stylist.toString())
                    });

                    query.push({
                        client: ObjectID.createFromHexString(filter.stylist.toString())
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

            claim.role = 'stylist';

            if (Array.isArray(appointments)) {
                if (future) {
                    appointments = appointments.filter(appointment => new Date(appointment.time) > Date.now());
                }

                for (var i = 0; i < appointments.length; i++) {
                    let appointment = {};

                    appointment.stylist = await this.getUser(claim, appointments[i].stylist.toString());
                    appointment.client = await this.getUser(claim, appointments[i].client.toString());

                    if (appointments[i].services) {
                        appointment.services = appointments[i].services.map(async serviceId => await this.getService(serviceId.toString()));   
                    } else {
                        throw err("every appointment must have a service");
                    }

                    appointment.time = appointments[i].time;
                    appointment.id = appointments[i]._id;
                    appointment.status = appointments[i].status;
                    appointment.discount = appointments[i].discount;
                    appointment.details = appointments[i].details;

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

    async addAppointment(claim, appointmentInput) {
        if (!claim) {
            throw new AuthenticationError("Must be sign in to book an appointment");
        }

        if ((claim?.role.toLowerCase() ?? "") != 'admin') {
            if ((claim?.role.toLowerCase() ?? "") == 'stylist') {
                if (claim.id != appointmentInput.client && claim.id != appointmentInput.stylist) {
                    throw new ForbiddenError("Stylist can't book appointment for someone else");
                }
            }

            if ((claim?.role.toLowerCase() ?? "") == 'client') {
                if (claim.id != appointmentInput.client) {
                    throw new ForbiddenError('Client are not allow to book appointments for someone else');
                }
            }

            if ((claim?.role.toLowerCase() ?? "") == "") {
                throw new ForbiddenError('User role is not permitted');
            }
        }

        try {
            const newAppointment = JSON.parse(JSON.stringify(appointmentInput));

            newAppointment.stylist = ObjectID.createFromHexString(newAppointment.stylist.toString());
            newAppointment.client = ObjectID.createFromHexString(newAppointment.client.toString());

            newAppointment.services = newAppointment.services.map(service => {
                return ObjectID.createFromHexString(service.toString());
            });

            if (newAppointment?.discount) {
                newAppointment.discount = new Double(newAppointment.discount);
            } else {
                delete newAppointment.discount;
            }

            if (newAppointment?.details) {
                delete newAppointment.details;
            }

            const result = await this.store.collection('appointments').insertOne(newAppointment);

            if (!result) {
                throw ('unable to create new appointment');
            }

            const appointment = result.ops[0];

            appointment.stylist = await this.getUser(claim, newAppointment.stylist.toHexString());
            appointment.client = await this.getUser(claim, newAppointment.client.toHexString());

            appointment.services = await Promise.all(appointment.services.map(async service => {
                return await this.getService(service.toHexString());
            }));

            return this.appointmentReducer(appointment);
        } catch (err) {
            return new Error(err);
        }
    }

    async updateAppointment(claim, appointmentID, appointmentInput) {
        if (!claim) {
            return new AuthenticationError("Must be sign in to update appointment");
        }

        try {
            if ((claim?.role?.toLowerCase() ?? "") !== "admin") {
                let originalAppointment = await this.store.collection('appointments').findOne({ _id: ObjectID.createFromHexString(appointmentID) });

                if (!originalAppointment) {
                    return new UserInputError("Unable to find an appointment with that ID");
                }
    
                if (claim.id == originalAppointment.client ) {
                    if (appointmentInput.client != claim.id) {
                        return new ForbiddenError("If you are the client of the original appointment, you must also be the client of the updated appointment");
                    }
    
                    if (appointmentInput.status != 'Requested' && appointmentInput.status != 'Cancelled') {
                        return new ForbiddenError("Clients of any appointments can only request or cancel that appointment");
                    }
    
                    if (appointmentInput.stylist == claim.id) {
                        return new ForbiddenError("You dont have permission to be stylist");
                    }
                } else if (claim.id == originalAppointment.stylist) {
                    if (appointmentInput.stylist != claim.id) {
                        return new ForbiddenError("Although you are a stylist, you can not schedule appointments for other stylist");
                    }
    
                    if (appointmentInput.client == claim.id) {
                        return new ForbiddenError("You can't be your own client");
                    }
                } else {
                    return new ForbiddenError('User whom are not admin cannot modify appointments which are not under your name');
                }
            }

            appointmentInput.stylist = ObjectID.createFromHexString(appointmentInput.stylist.toString());
            appointmentInput.client = ObjectID.createFromHexString(appointmentInput.client.toString());
            appointmentInput.services = appointmentInput.services.map(service => {
                return ObjectID.createFromHexString(service.toString());
            });

            if (appointmentInput?.discount) {
                appointmentInput.discount = new Double(appointmentInput.discount);
            } else {
                delete appointmentInput.discount;
            }

            if (!appointmentInput?.details) {
                delete appointmentInput.details;
            }

            appointmentInput = {
                $set: appointmentInput
            };

            const result = await this.store.collection('appointments').updateOne({ _id: ObjectID.createFromHexString(appointmentID) }, appointmentInput);

            if (result?.result.n < 1 ?? true) {
                throw `No Document with ObjectID ${appointmentID} was found`;
            } else {
                if (result?.result.nModified < 1 ?? true) {
                    throw 'Document with ObjectID ${serviceID} was not updated because input provided did not contain any updated data';
                }
            }

            const appointment = {
                id: ObjectID.createFromHexString(appointmentID),
                ...appointmentInput["$set"]
            }
            appointment.stylist = await this.getUser(claim, appointment.stylist.toHexString());
            appointment.client = await this.getUser(claim, appointment.client.toHexString());
            appointment.services = await Promise.all(appointment.services.map(async service => {
                return await this.getService(service.toHexString());
            }));
            
            return this.appointmentReducer(appointment);
        } catch (err) {
            return new Error(err);
        }
    }

    async removeAppointment (claim, appointmentID) {
        if (!claim) {
            return new AuthenticationError("Must be sign in to update appointment");
        }

        try {
            let originalAppointment = await this.store.collection("appointments").findOne({ _id: ObjectID.createFromHexString(appointmentID) });

            if (!originalAppointment) {
                return new UserInputError("Unable to find an appointment with that ID");
            }

            if ((claim?.role?.toLowerCase() ?? "") !== "admin") {
                if (claim.id == originalAppointment.client) {
                    if ((originalAppointment?.status?.toLowerCase() ?? "") != 'requested') {
                        return new ForbiddenError("As user who is a client, you are permitted to only remove requested appointment");
                    }
                } else if (claim.id != originalAppointment.stylist) {
                    return new ForbiddenError("User whom are not admin cannot remove appointments which are not under your name");
                }
            }

            const result = await this.store.collection("appointments").deleteOne({ _id: ObjectID.createFromHexString(appointmentID) });

            if ((result?.deletedCount ?? 0) < 1) {
                throw 'unable to delete the specified appointment';
            }

            originalAppointment.stylist = await this.getUser(claim, originalAppointment.stylist.toHexString());
            originalAppointment.client = await this.getUser(claim, originalAppointment.client.toHexString());
            originalAppointment.services = await Promise.all(originalAppointment.services.map(async service => {
                return await this.getService(service.toHexString());
            }));

            return this.appointmentReducer(originalAppointment);
        } catch (err) {
            return new Error(err);
        }
    }
}