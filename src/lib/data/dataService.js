import {MongoClient, ObjectId} from "mongodb";

export class DataService {
    constructor() {
        this.uri = `mongodb://${process.env.DOCDB_USERNAME}:${process.env.DOCDB_PASSWORD}@${process.env.DOCDB_ENDPOINT}:${process.env.DOCDB_PORT}/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;
    }

    async getTitles(){
        const client = new MongoClient(this.uri);
        let result = [];

        try {
            await client.connect();
            const db = client.db("mancommdb");
            const collection = db.collection("titles");

            console.log("DB connected");

            result = await collection.find({}).toArray();

            console.log(result);
        } finally {
            await client.close();
            console.log("DB client closed");
        }

        return result;
    }

    async getTitle(id){
        const client = new MongoClient(this.uri);
        let result = {};

        try {
            await client.connect();
            const db = client.db("mancommdb");
            const collection = db.collection("titles");

            console.log("DB connected");
            console.log(`find by: ${id}`);
            result = await collection.findOne({"_id": new ObjectId(id)});

            console.log(result);
        } finally {
            await client.close();
            console.log("DB client closed");
        }

        return result;
    }

    async saveTitle(doc) {
        const client = new MongoClient(this.uri);
        let result = {};

        try {
            await client.connect();

            const db = client.db("mancommdb");
            const collection = db.collection("titles");

            console.log("DB connected");

            result = await collection.insertOne(doc);

            console.log(result);
        } finally {
            await client.close();
            console.log("DB client closed");
        }

        return result;
    }

    async deleteTitle(id) {
        const client = new MongoClient(this.uri);
        let result = {};

        try {
            await client.connect();
            const db = client.db("mancommdb");
            const collection = db.collection("titles");

            console.log("DB connected");

            console.log(`delete by: ${id}`);
            result = await collection.deleteOne({"_id": new ObjectId(id)});
            console.log(result);
        } finally {
            await client.close();
            console.log("DB client closed");
        }

        return result;
    }

    async updateDBStream(request) {
        const client = new MongoClient(this.uri);
        let result = {};

        try {
            await client.connect();
            const db = client.db("mancommdb");
            const collection = db.collection("titles");

            console.log("DB connected");
            await db.admin().command({
                ...request,
                modifyChangeStreams: 1,
                database: "mancommdb",
                collection: "titles"
            });
            console.log(result);
        } finally {
            await client.close();
            console.log("DB client closed");
        }

        return result;
    }
}