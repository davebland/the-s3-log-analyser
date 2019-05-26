/* 
    THE S3 LOG ANALYSER
    AWS API FUNCTIONS
    BY DAVID BLAND
*/

// Application wide variables
var awsObjectList = [];
var errorStack = [];

// Object Constructors
function AwsObjectListItem(objectKey) {
    this.objectKey = objectKey;
    this.dateCreated = getListObjectDate(objectKey); // Find date in object key string
    this.type = getListObjectType(objectKey); // CloudFront (.gz) or S3Log
}

// Enable AWS console logger
AWS.config.logger = console;

// Set AWS config and service object globally
function setupAws(awsCreds) {
    // Set creds awsCreds object
    AWS.config.credentials = new AWS.Credentials({accessKeyId: awsCreds.keyId, secretAccessKey: awsCreds.keySecret});
    // Create S3 service object with region and bucket name from awsCreds
    return new AWS.S3({region: awsCreds.awsRegion, maxRetries: 2, params: {Bucket: awsCreds.bucketName}});
}

// AWS List Objects (first call to AWS), returns promise to handler 
function awsListObjects(awsCreds) {
    return new Promise(function(resolve, reject) {
        // Get an s3 service object setup ready to go
        let s3 = setupAws(awsCreds);

        // Reset object list
        awsObjectList = [];

        // Set list loop counter
        let listLoopCounter = 0;

        // Create function to call api and list object
        function listObjectLoop(NextContinuationToken) {
            // Set additional S3 parameters including continuation token if available          
            let s3Options = {
                MaxKeys: 10                            
            };
            if (NextContinuationToken) {
                s3Options.ContinuationToken = NextContinuationToken;
            }
            // Call S3 and handle promise result
            s3.listObjectsV2(s3Options).promise().then(function(s3ListSuccess) {
                    // On successful response add the contents (bucket objects) to our array
                    s3ListSuccess.Contents.forEach(function(bucketObject) {
                        awsObjectList.push(new AwsObjectListItem(bucketObject.Key));       
                    });
                    // Update the count in the message area
                    updateApiMessageArea(awsObjectList.length);
                    // If there is more results to get (continuation token) and we haven't hit the loop safety limit then re-run listObjectLoop
                    if (s3ListSuccess.NextContinuationToken && listLoopCounter < 1) {
                        listObjectLoop(s3ListSuccess.NextContinuationToken);
                        listLoopCounter++;   
                    } else {
                        console.dir(awsObjectList);
                        removeInvalidListObjects() // Remove objects with invalid properties                        
                            .then((removedCount) => {getObjectListStats(removedCount);}) // Get object list stats and update the screen with the information
                            .then(returnPromise())
                            .catch (function(error) {
                                // If promise error add to stack
                                errorStack.push({type: 'List Processing', errorMessage: 'Unknown processing error', severity: 'fatal'});
                            })
                    }
                }).catch(function(s3ListError) {
                    // If api call fails then add error to stack
                    console.log(s3ListError);
                    errorStack.push({type: 'AWS API', errorMessage: s3ListError.message, severity: 'fatal'});
                    returnPromise();
                });
        }

        // Invoke listObjectLoop for the first time
        listObjectLoop(null);
    
        function returnPromise() {
            // Check for errors and resolve
            if (errorStack.length > 0) {
                reject();
            } else {
                resolve();
            } 
        };  
    });
}