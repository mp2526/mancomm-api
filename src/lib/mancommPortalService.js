import axios from "axios";
import {DataService} from "./data";
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const S3_BUCKET = "mancomm-us-east-1-titles";
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
        });
    }

    async getTitles(){
        return await this.dataService.getTitles();
    }

    async getTitle(id){
        return await this.dataService.getTitle(id);
    }

    async saveTitle(id, date){
        const response = await axios.get(
            `https://www.ecfr.gov/api/versioner/v1/structure/${date}/title-${id}.json`,
            { headers: {"accept": `application/json`}}
        );

        return await this.dataService.saveTitle(response.data);
    }

    async deleteTitle(id){
        return await this.dataService.deleteTitle(id);
    }

    async downloadTitle(id){
        const s3 = new S3Client({ region: "us-east-1" });

        const bucketParams = {
            Bucket: S3_BUCKET,
            Key: `downloads/${id}.json`,
            ResponseContentDisposition:  `attachment; filename="${id}.json"`
        };

        return getSignedUrl(s3, new GetObjectCommand(bucketParams), { expiresIn: 60 });
    }

    async updateDBStream(request){
        return await this.dataService.updateDBStream(request);
    }

    async processDBStream(changeStream){
        const s3 = new S3Client({ region: "us-east-1" });

        for (const {event} of changeStream.events) {
            if (event.operationType === "insert") {
                const bucketParams = {
                    Bucket: S3_BUCKET,
                    Key: `downloads/${event.documentKey._id["$oid"]}.json`,
                    Body: JSON.stringify(event.fullDocument),
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
                    Key: `downloads/${event.documentKey._id["$oid"]}.json`
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