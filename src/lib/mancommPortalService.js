import axios from "axios";
import {DataService} from "./data";

export class MancommPortalService {
    constructor() {
        this.dataService = new DataService();
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

    async updateDBStream(request){
        return await this.dataService.updateDBStream(request);
    }
}