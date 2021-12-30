## remake-serverless

### Getting Oriented

`remake-serverless` is built on top of the `remake` client side [framework](https://github.com/remake/remake-framework). 

`remote-serverless` provides a serverless, globally available backend to store JSON files spit out by the core `remake-framework`. The default remake framework uses an express server to receive and persist files.

`ScratchPad` is the name of the serverless backend which manages user auth (built on AWS Cognito), generation of presigned urls (AWS Lambda + S3), and saving json files to S3.

### Getting Started

1. Clone this repository
2. Run using `http-server` or any other such static website server
3. Visit `http://localhost:8080/remake.html`

You should see a set of To-Dos along with a message that you need to signup/login to use the ScratchPad server. Without signing up, you will only be able to save and read JSONs locally

### Saving your latest JSON to ScratchPad

Every time you click on `Save`, it automatically writes the JSON file to S3. Keep in mind that this is just a demo repository. Your own implementation will vary.

### Reading your JSON files from ScratchPad

Login and then refresh the page, it should read the latest JSON file from SratchPad. Keep in mind that this is just a demo repository. Your own implementation will vary.
