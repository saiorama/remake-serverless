/**
  * This lambda returns a presigned URL to a Cognito authorized caller
  * allowing the caller to upload files directly to S3
  * It uses the Cognito JWT to decide the name of the subdirectory inside ${PREFIX} 
  * where your files will be stored
**/
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
    signatureVersion: 'v4', // use v2 or v4 depending on the S3 bucket's region
    endpoint: `${process.env.DESTINATION_BUCKET}.s3.amazonaws.com`, // E.g., example.com.s3.amazonaws.com
    s3BucketEndpoint: true,
    sslEnabled: false, // use FALSE if your bucketname includes periods. 
                       // i.e., if your bucket name is 'example.com', use FALSE, else TRUE
    region: process.env.S3_REGION
});

const BUCKET_NAME = process.env.DESTINATION_BUCKET; // E.g., my-fav-bucket
const PREFIX = process.env.JSON_STORE_PREFIX; // the/path/to/where/json/files/will/be/stored

// replaces all non-alphanumeric characters in a given string with ${replace}
let cleanupString = (str, replace) => str.replace(/[^A-Za-z0-9]/g, replace);

// returns the params which the AWS S3 client will use to generate a presigned url
const getPutParams = (event) => {
    //remove all non alphanumeric characters from email
    let userEmail = cleanupString(getUserEmail(event), '');
    if(userEmail){
        return {
            'Bucket': BUCKET_NAME,
            'Key': `${PREFIX}/${userEmail}/${cleanupString(decodeURIComponent(event.queryStringParameters.filename), '-')}`,
            'ContentType': event.queryStringParameters.filetype
        };
    }
};

/**
  * The following three functions are used to extract user details from 
  * a Cognito Authorization token, then extract the user's email id
  * then cleanup the email
  * then return that cleaned up string.
  * E.g., if the user's email is `name@example.com`, you will get `nameexamplecom`
**/
let getAuthorizationStringFromEvent = (event) => event.headers.Authorization;
let parseAuthorizationObjectFromEvent = (event) => JSON.parse(Buffer.from(getAuthorizationStringFromEvent(event).split('.')[1], 'base64'));
let getUserEmail = (event) => {
  let authObject = parseAuthorizationObjectFromEvent(event);
  return authObject['email'];
};

// returns a presigned url to the authorized caller
exports.handler = async (event) => {
    console.log(event);
    let params = getPutParams(event);
    let url = s3.getSignedUrl('putObject', params);
    const response = {
        statusCode: 200,
        body: JSON.stringify({'psu': url}),
    };
    return response;
};

