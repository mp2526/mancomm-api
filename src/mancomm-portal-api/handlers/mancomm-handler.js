import { MancommPortalService } from "../../lib/mancommPortalService";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

export const getDocs = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        const body = await svc.getDocs();

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error("Error getting docs:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: "Internal server error - Failed to get docs"
        };
    }
};

export const getTitles = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        const body = await svc.getTitles();

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error('Error getting titles:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: "Internal server error - Failed to get titles"
        };
    }
};

export const getTitle = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        let id;

        if(event.pathParameters != null) {
            id = event.pathParameters.id;
        }

        const body = await svc.getTitle(id);

        if(body) {
            return {
                statusCode: 200,
                headers: {
                    "content-type":"application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(body)
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: "Title not found"
            };
        }

    } catch (error) {
        console.error('Error getting title:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: "Internal server error - Failed to get title"
        };
    }
};

export const saveTitle = async (event, context) => {
    try {
        const sqs = new SQSClient({});
        const request = JSON.parse(event.body);

        const response = await sqs.send(new SendMessageCommand({
            QueueUrl: "https://sqs.us-east-1.amazonaws.com/381492003455/mancomm-download.fifo",
            DelaySeconds: 0,
            MessageDeduplicationId: `${request.id}-${request.date}-${new Date().getTime()}`,
            MessageGroupId: "mancomm-download",
            MessageBody: event.body
        }));
        console.log(response);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods" : "POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(response)
        };
    } catch (error) {
        console.error("Error saving title:", error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to save title"
        };
    }
};

export const deleteTitle = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        let id;

        if(event.pathParameters != null) {
            id = event.pathParameters.id;
        }

        const body = await svc.deleteTitle(id);

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error('Error deleting title:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: "Internal server error - Failed to delete title"
        };
    }
};

export const downloadTitle = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        let id;

        if(event.pathParameters != null) {
            id = event.pathParameters.id;
        }

        const body = await svc.downloadTitle(id);

        if(body) {
            return {
                statusCode: 200,
                headers: {
                    "content-type":"application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                body: JSON.stringify(body)
            };
        } else {
            return {
                statusCode: 404,
                headers: {
                    "Access-Control-Allow-Origin": "*"
                },
                body: "Title not found"
            };
        }

    } catch (error) {
        console.error('Error getting title:', error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*"
            },
            body: "Internal server error - Failed to get title"
        };
    }
};

export const processTitle = async (event, context) => {
    const svc = await new MancommPortalService().init();

    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    try {
        await svc.processTitle(bucket, key);
    } catch (error) {
        console.error('Error processing title:', error);
    }
};

export const processDBStream = async (changeStream) => {
    const svc = await new MancommPortalService().init();

    try {
        await svc.processDBStream(changeStream);
    } catch (error) {
        console.error('Error updating stream:', error);
    }
};

export const downloadEvent = async (event, context) => {
    for (const record of event.Records) {
        const { body } = record;
        console.info(body);
        const request = JSON.parse(body);
        const svc = await new MancommPortalService().init();

        await svc.saveTitle(request.id, request.date);
    }
};