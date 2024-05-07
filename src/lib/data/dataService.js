import {MongoClient, ObjectId} from "mongodb";
import {
    GetSecretValueCommand,
    SecretsManagerClient,
} from "@aws-sdk/client-secrets-manager";

export class DataService {
    async init() {
        const client = new SecretsManagerClient();
        const response = await client.send(
            new GetSecretValueCommand({
                SecretId: "mancommdb",
            }),
        );

        const secret = JSON.parse(response.SecretString);

        this.uri = `mongodb://${secret.username}:${secret.password}@${secret.host}:${secret.port}/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false`;
        return this;
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

            await db.adminCommand({
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