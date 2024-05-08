import axios from "axios";
import {DataService} from "./data";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = "mancomm-us-east-1-titles";
const S3_WATCH_BUCKET = "mancomm-us-east-1-watch";
export class MancommPortalService {
    async init() {
        this.dataService = await new DataService().init();
        return this;
    }

    async getDocs(){
        const response = await axios.get(
            `https://www.ecfr.gov/api/versioner/v1/titles.json`,
            { headers: {"accept": `application/json`}}
        );
        return response.data.titles.map((title) => {
            return {
                number: title.number,
                name: title.name,
                date: title.latest_issue_date
            };
        }).filter((title) => title.number === 2 || title.number === 29);
    }

    async getTitles(){
        return await this.dataService.getTitles();
    }

    async getTitle(id){
        const s3 = new S3Client({ region: "us-east-1" });

        const bucketParams = {
            Bucket: S3_BUCKET,
            Key: `downloads/${id}/${id}.json`,
            ResponseContentType: "application/json; charset=utf-8"
        };

        const response = await s3.send(new GetObjectCommand(bucketParams));

        return JSON.parse(await response.Body.transformToString("utf8"));
    }

    async saveTitle(id, date){
        const response = await axios.get(
            `https://www.ecfr.gov/api/renderer/v1/content/enhanced/${date}/title-${id}`,
            { headers: {"accept": `text/html`}}
        );

        const s3 = new S3Client({ region: "us-east-1" });

        const bucketParams = {
            Bucket: S3_WATCH_BUCKET,
            Key: `${date}_title-${id}.html`,
            Body: response.data,
            ContentType: "text/html; charset=utf-8"
        };
        try {
            await s3.send(new PutObjectCommand(bucketParams));
        } catch (err) {
            console.error("Error", err);
        }

        return { message: "success" }; //await this.dataService.saveTitle(response.data);
    }

    async deleteTitle(id){
        return await this.dataService.deleteTitle(id);
    }

    async downloadTitle(id){
        const s3 = new S3Client({ region: "us-east-1" });

        const bucketParams = {
            Bucket: S3_BUCKET,
            Key: `downloads/${id}/${id}.json`,
            ResponseContentDisposition:  `attachment; filename="${id}.json"`
        };

        return getSignedUrl(s3, new GetObjectCommand(bucketParams), { expiresIn: 60 });
    }

    async processTitle(bucket, key){
        const s3 = new S3Client({ region: "us-east-1" });

        const bucketParams = {
            Bucket: bucket,
            Key: key,
            ResponseContentType: "text/html; charset=utf-8"
        };

        try {
            const response = await s3.send(new GetObjectCommand(bucketParams));

            const titleId = await this.dataService.processTitle(await response.Body.transformToString("utf8"));

            await s3.send(new DeleteObjectCommand(bucketParams));

            console.log(`Title Processed: ${titleId}`);
        } catch (err) {
            console.error("Error", err);
        }
    }

    async processDBStream(changeStream){
        const s3 = new S3Client({ region: "us-east-1" });

        for (const {event} of changeStream.events) {
            if (event.operationType === "insert") {
                const body = await this.dataService.getTitleJson(event.fullDocument);

                const bucketParams = {
                    Bucket: S3_BUCKET,
                    Key: `downloads/${event.documentKey._id["$oid"]}/${event.documentKey._id["$oid"]}.json`,
                    Body: JSON.stringify(body),
                    ContentType: "application/json"
                };
                try {
                    await s3.send(new PutObjectCommand(bucketParams));
                } catch (err) {
                    console.error("Error", err);
                }
            } else if (event.operationType === "delete") {
                const bucketParams = {
                    Bucket: S3_BUCKET,
                    Key: `downloads/${event.documentKey._id["$oid"]}/${event.documentKey._id["$oid"]}.json`
                };
                try {
                    await s3.send(new DeleteObjectCommand(bucketParams));
                } catch (err) {
                    console.error("Error", err);
                }
            }
        }
    }
}