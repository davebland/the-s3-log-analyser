/* 
    THE S3 LOG ANALYSER
    AWS API FUNCTIONS
    BY DAVID BLAND
*/

// Application wide variables
var awsObjectList = [];
var errorStack = [];

// Enable AWS console logger
AWS.config.logger = console;

// Set AWS config and service object globally
function setupAws() {
    // Set creds awsCreds object
    AWS.config.credentials = new AWS.Credentials({accessKeyId: awsCreds.keyId, secretAccessKey: awsCreds.keySecret});
    // Create S3 service object with region and bucket name from awsCreds
    return new AWS.S3({region: awsCreds.awsRegion, maxRetries: 2, params: {Bucket: awsCreds.bucketName}});
}

// AWS List Objects (first call to AWS), returns promise to handler 
function awsListObjects() {
    return new Promise(function(resolve, reject) {
        // Get an s3 service object setup ready to go
        let s3 = setupAws();

        // Set list loop counter
        let listLoopCounter = 0;

        // Create function to call api and list object
        function listObjectLoop(ContinuationToken) {
            // Set additional S3 parameters including continuation token if available          
            let s3Options = {
                MaxKeys: 10                            
            };
            if (ContinuationToken) {
                s3Options.ContinuationToken = awsContinuationToken;
            }
            // Call S3 and handle promise results
            s3.listObjectsV2(s3Options).promise().then(function(s3ListSuccess) {
                    // On successful response add the contents (bucket objects) to our array
                    addToObjectList(s3ListSuccess.Contents);
                    // If there is more results to get (continuation token) and we haven't hit the loop safety limit then re-run listObjectLoop
                    if (s3ListSuccess.ContinuationToken && listLoopCounter < 5) {
                        //listObjectLoop(ContinuationToken);
                        listLoopCounter++;   
                    }
                    returnPromise();
                }).catch(function(s3ListError) {
                    // If api call fails then add error to stack
                    console.log(s3ListError);
                    errorStack.push({type: 'AWS API', errorCode: s3ListError.code, errorMessage: s3ListError.message});
                    returnPromise();
                });
        }

        // Invoke listObjectLoop for the first time
        listObjectLoop(null) 
            
        function returnPromise() {
            // Check for errors and resolve
            if (errorStack.length > 0) {
                reject();
            } else {
                resolve('Listing success, no. objects = ' + awsObjectList.length);
            } 
        };  
    });
}

function addToObjectList(s3BucketObjects) {    
    // For each object in array extract the key property only & add to our array
    s3BucketObjects.forEach(function(bucketObject) {
        awsObjectList.push({objectKey: bucketObject.Key});        
    });
}

    // Handle promise result
    

                    // Parse object list for key

            // Find date string in key to determine log date

            // Convert to date object and store in list object

            // Determine max & min dates then display in filter form

            // Count no. of object loaded and display in message area