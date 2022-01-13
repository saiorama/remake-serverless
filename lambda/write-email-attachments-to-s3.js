var AWS = require('aws-sdk');

// needs the mailparser library to parse emails properly
const simpleParser = require('mailparser').simpleParser;
var URL = require('url').URL;

AWS.config.update({region: 'us-east-1'});

var s3 = new AWS.S3();

const BUCKET_NAME = process.env.BUCKET_NAME;
const ATTACHMENTS_KEY_PREFIX = process.env.ATTACHMENTS_KEY_PREFIX;
const DELIM = '/';

let processEml = async (emlBody) => {
    return simpleParser(emlBody)
      .then( d => d);
};

const RESPONSE = {
    statusCode: 400,
    headers: {
        "Access-Control-Allow-Origin" : "*", // Required for CORS support to work
                                             // in case you are calling the lambda from
                                             // API-GW with proxy integration
        'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({'msg': 'no data'}),
};

let getEmlFilenameFromKey = (key) => key.split(DELIM).pop();
let getKeyForAttachments = (key, filename) => `${ATTACHMENTS_KEY_PREFIX}${DELIM}${key}`;

let putEmlAttachmentObject = (bucket, key, buffer, contentType) => {
  const params = {
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        Tagging: "public=yes",
    };  
    return s3.putObject(params).promise();
};
let bucket = (event) => event.bucket.name;
let key = (event) => event.object.key;

// build the params object from $EVENT which
// we will use to read in the eml file
let emlDetails = (event) => {
    return {
        Bucket: bucket(event),
        Key: key(event)
    };
};
exports.handler = async (event) => {
    let eml = emlDetails(event);
    //get the eml file from the S3 bucket where AWS SES puts it
    return await s3.getObject(eml).promise()
    .then(async data => {
        //convert the eml file into a utf-8 string
        let emlBody = data.Body.toString('utf-8');
        //process the eml file using the `mailparser` npm module
        return await processEml(emlBody);
    })
    .then(d => {
        //save each email attachment back to S3
        return Promise.all(d.attachments.map((a) => {
            return putEmlAttachmentObject(BUCKET_NAME, getKeyForAttachments(eml.Key, a.filename), a.content, a.contentType)
                .then(d => d);
        }));
    })
    .then(vals => {
        console.log(JSON.stringify(vals));
        return event;
    })
    .catch(e => {
        console.log(e);
        return RESPONSE;
    });
};
