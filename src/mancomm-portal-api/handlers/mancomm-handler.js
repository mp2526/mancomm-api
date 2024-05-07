import { MancommPortalService } from "../../lib/mancommPortalService";
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
        const svc = await new MancommPortalService().init();

        const request = JSON.parse(event.body);
        const body = await svc.saveTitle(request.id, request.date);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods" : "POST",
                "Access-Control-Allow-Headers": "Content-Type"
            },
            body: JSON.stringify(body)
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

export const updateDBStream = async (event, context) => {
    const svc = await new MancommPortalService().init();

    try {
        const request = JSON.parse(event.body);

        const body = await svc.updateDBStream(request);

        if(body) {
            return {
                statusCode: 200,
                headers: {
                    "content-type":"application/json"
                },
                body: JSON.stringify(body)
            };
        }

    } catch (error) {
        console.error('Error updating stream:', error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to update stream"
        };
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