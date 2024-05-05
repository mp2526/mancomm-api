import { MancommPortalService } from "../../lib/mancommPortalService";
export const getDocs = async (event, context) => {
    const svc = new MancommPortalService();

    try {
        const body = await svc.getDocs();

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error("Error getting docs:", error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to get docs"
        };
    }
};

export const getTitles = async (event, context) => {
    const svc = new MancommPortalService();

    try {
        const body = await svc.getTitles();

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error('Error getting titles:', error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to get titles"
        };
    }
};

export const getTitle = async (event, context) => {
    const svc = new MancommPortalService();

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
                    "content-type":"application/json"
                },
                body: JSON.stringify(body)
            };
        } else {
            return {
                statusCode: 404,
                body: "Title not found"
            };
        }

    } catch (error) {
        console.error('Error getting title:', error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to get title"
        };
    }
};

export const saveTitle = async (event, context) => {
    try {
        const svc = new MancommPortalService();

        const request = JSON.parse(event.body);
        const body = await svc.saveTitle(request.id, request.date);

        return {
            statusCode: 200,
            headers: {
                "content-type": "application/json"
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
    const svc = new MancommPortalService();

    try {
        let id;

        if(event.pathParameters != null) {
            id = event.pathParameters.id;
        }

        const body = await svc.deleteTitle(id);

        return {
            statusCode: 200,
            headers: {
                "content-type":"application/json"
            },
            body: JSON.stringify(body)
        };
    } catch (error) {
        console.error('Error deleting title:', error);
        return {
            statusCode: 500,
            body: "Internal server error - Failed to delete title"
        };
    }
};

export const updateDBStream = async (event, context) => {
    const svc = new MancommPortalService();

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