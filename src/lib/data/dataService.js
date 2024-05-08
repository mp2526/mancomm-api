import {MongoClient, ObjectId} from "mongodb";
import { GetSecretValueCommand, SecretsManagerClient } from "@aws-sdk/client-secrets-manager";
import * as cheerio from 'cheerio';
import { getIdentifier } from "../utils/html"

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

    async processTitle(html) {
        const client = new MongoClient(this.uri);
        await client.connect();
        const db = client.db("mancommdb");

        const $ = cheerio.load(html);
        const titleNode = $("div.title");

        const title = {
            identifier: getIdentifier(titleNode.attr("id")),
            type: "title",
            text: titleNode.children().first().text(),
            subtitles: []
        };

        for(const subtitle of titleNode.children(".subtitle")) {
            const subtitleId = await this.processSubtitle($(subtitle), $, db);
            title.subtitles.push(subtitleId);
        }

        console.log(`Tile: ${title}`);
        const collection = db.collection("titles");
        const { insertedId } = await collection.insertOne(title);

        return insertedId;
    }

    async processSubtitle(subTitleNode, $, db) {
        const subtitle = {
            identifier: getIdentifier(subTitleNode.attr("id")),
            type: "subtitle",
            text: subTitleNode.children().first().text(),
            parts: [],
            chapters: []
        };

        for(const part of subTitleNode.children(".part")) {
            const partId = await this.processPart($(part), $, db);
            subtitle.parts.push(partId);
        }

        for(const chapter of subTitleNode.children(".chapter")) {
            const chapterId = await this.processChapter($(chapter), $, db);
            subtitle.chapters.push(chapterId);
        }

        const collection = db.collection("subtitles");
        const { insertedId } = await collection.insertOne(subtitle);

        return insertedId;
    }

    async processPart(partNode, $, db) {
        const part = {
            identifier: getIdentifier(partNode.attr("id")),
            type: "part",
            text: partNode.children().first().text(),
            authority: partNode.children(".authority")?.children().first().html(),
            source: partNode.children(".source")?.children().first().html(),
            subparts: []
        };

        for(const subpart of partNode.children(".subpart")) {
            const subpartId = await this.processSubpart($(subpart), $, db);
            part.subparts.push(subpartId);
        }

        const collection = db.collection("parts");
        const { insertedId } = await collection.insertOne(part);

        return insertedId;
    }

    async processSubpart(subpartNode, $, db) {
        const subpart = {
            identifier: getIdentifier(subpartNode.attr("id")),
            type: "subpart",
            text: subpartNode.children().first().text(),
            sections: []
        };

        for(const section of subpartNode.children(".section")) {
            const sectionId = await this.processSection($(section), $, db);
            subpart.sections.push(sectionId);
        }

        const collection = db.collection("subparts");
        const { insertedId } = await collection.insertOne(subpart);

        return insertedId;
    }

    async processSection(sectionNode, $, db) {
        const section = {
            identifier: sectionNode.attr("id"),
            type: "section",
            text: sectionNode.children().first().text(),
            subsections: []
        };

        for(const subsection of sectionNode.children("div")) {
            section.subsections.push({
                identifier: $(subsection).attr("id"),
                text: $(subsection).children().first().text()
            });
        }

        const collection = db.collection("sections");
        const { insertedId } = await collection.insertOne(section);

        return insertedId;
    }

    async processChapter(chapterNode, $, db) {
        const chapter = {
            identifier: getIdentifier(chapterNode.attr("id")),
            type: "chapter",
            text: chapterNode.children().first().text(),
            parts: []
        };

        for(const part of chapterNode.children(".part")) {
            const partId = await this.processPart($(part), $, db);
            chapter.parts.push(partId);
        }

        const collection = db.collection("chapters");
        const { insertedId } = await collection.insertOne(chapter);

        return insertedId;
    }

    async getTitleJson(root) {
        const client = new MongoClient(this.uri);
        await client.connect();
        const db = client.db("mancommdb");

        console.log(JSON.stringify(root));

        const arr = [];
        for (let subtitle of root.subtitles) {
           arr.push(await this.getSubtitleJson(subtitle["$oid"], db));
        }

        root.subtitles = arr;

        return root;
    }

    async getSubtitleJson(id, db) {
        const collection = db.collection("subtitles");
        const subtitle = await collection.findOne({"_id": new ObjectId(id)});

        console.log(JSON.stringify(subtitle));
        if(subtitle) {
            let arr = [];
            for (let part of subtitle?.parts) {
                arr.push(await this.getPartJson(part, db));
            }
            subtitle.parts = arr;

            arr = [];
            for (let chapter of subtitle?.chapters) {
                arr.push(await this.getChapterJson(chapter, db));
            }
            subtitle.chapters = arr;
        }

        return subtitle;
    }

    async getPartJson(id, db) {
        const collection = db.collection("parts");
        const part = await collection.findOne({"_id": new ObjectId(id)});

        if(part) {
            const arr = [];
            for (let subpart of part?.subparts) {
                arr.push(await this.getSubpartJson(subpart, db));
            }
            part.subparts = arr;
        }

        return part;
    }

    async getSubpartJson(id, db) {
        const collection = db.collection("subparts");
        const subpart = await collection.findOne({"_id": new ObjectId(id)});

        if(subpart) {
            const arr = [];
            for (let section of subpart?.sections) {
                arr.push(await this.getSectionJson(section, db));
            }
            subpart.sections = arr;
        }

        return subpart;
    }

    async getSectionJson(id, db) {
        const collection = db.collection("sections");
        return await collection.findOne({"_id": new ObjectId(id)});
    }

    async getChapterJson(id, db) {
        const collection = db.collection("chapters");
        const chapter = await collection.findOne({"_id": new ObjectId(id)});

        if (chapter) {
            const arr = [];
            for (let part of chapter?.parts) {
                arr.push(await this.getPartJson(part, db));
            }
            chapter.parts = arr;
        }

        return chapter;
    }
}