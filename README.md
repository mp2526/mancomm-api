<!--
title: 'Mancomm Portal API Service'
description: 'RESTful API for managing document storage and presentation'
layout: Doc
framework: v3
platform: AWS
language: nodeJS
authorLink: 'https://github.com/mp2526'
authorName: 'Mike Perry'
authorAvatar: ''
-->

# Mancomm Portal API Service

This is a RESTful API written using Node.js / Javascript and AWS serverless stack. (Lambdas, API Gateway, DocumentDB, S3, and SQS)

### Design

This API includes endpoints for CRUD functionality to asyncronously download a federal regulations HTML document and parse it and save it as several JSON document fragments into a DocumentDB datastore as well as saving a compiled version onto S3.

It is reliant upon an SQS queue for downloading relatively large documents to an S3 watch bucket without timing out. It also uses an S3 trigger to asynchronously parse the downloaded HTML into JSON fragments and store the resulting JSON into DocumentDB as related collections.
Utilizing a trigger on the DocumentDB change stream, the JSON collections are then compiled and merged into a single JSON document and saved to a separate bucket on S3 for download or display.

### Limitations

This is not a complete production ready API. This is more of a proof of concept with some production ready features missing, such as:

* **Authentication** - The endpoints are publicly available and require no authentication. In a production environment I would utilize either a token key or something like a JWT OAuth scenario to lock down the endpoints.
* **Failover Redundancy** - This POC is only deployed to one AWS region and the DocumentDB cluster contains only one instance. In a production environment I would deploy to multi region and possibly multi AZs within a region. The DocumentDB cluster would consist of a write and multi read instances and the S3 storage would be multi region as well as everything backed up.
* **Code Quality** - While I tried to write the code as I would for a production app, due to time constraints I did take some shortcuts...
  * **Error Handling** - The current error handling is very basic.
  * **Unit Tests** - Normally I would have started with unit tests and written the code based on my unit test assumptions
  * **HTML Parser** - The html parser could use some attention. It misses some of the HTML attributes, but I think gets enough of them to get the point across.
  * **Infrastructure As Code** - Some of the Serverless scripts are lacking and some of the infrastructure is hardcoded or done manually to save time.

## Usage

### Deployment

The code is deployed via Serverless scripts and using the Serverless CLI.
```
$ serverless deploy
```

After deploying, the API is now available at the following URL:

https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1

### Invocation

You can call the created application via HTTP:

```bash
curl https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/
```

### API Definition

#### Get HTML document:
```
 GET https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/docs
```

Gets a list of available federal regulation documents from the following URL:

https://www.ecfr.gov/api/renderer/v1/content/enhanced/${date}/title-${id}

It is currently limited to Title 2 and Title 29 for this demo.
<br>
<br>
<br>
#### Save HTML document to S3:
```
 POST https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/title
 
{
    "id": 2,
    "date": "2024-05-02"
}
```

Posts a message to an SQS queue that allows the service to asynchronously download the HTML document.
<br>
<br>
<br>
#### Get a list of documents saved to the DocumentDB
```
 GET https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/titles
```
Gets a list of the available parsed JSON documents saved in the DocumentDB.
<br>
<br>
<br>
#### Get a single document
```
 GET https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/title/:id
```
Gets a single document given an id from the previous list.
<br>
<br>
<br>
#### Deletes a single document
```
 DELETE https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/title/:id
```
Deletes a single document given an id as well as deleting the compiled S3 document.
<br>
<br>
<br>
#### Get a download link
```
 GET https://8pwdhsk1hl.execute-api.us-east-1.amazonaws.com/dev/v1/download/title/:id
```
Gets a signed S3 URL with a 60 second expiry of the compiled JSON document for downloading.
