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
        function listObjectLoop(NextContinuationToken) {
            // Set additional S3 parameters including continuation token if available          
            let s3Options = {
                MaxKeys: 10                            
            };
            if (NextContinuationToken) {
                s3Options.ContinuationToken = NextContinuationToken;
            }
            // Call S3 and handle promise results
            s3.listObjectsV2(s3Options).promise().then(function(s3ListSuccess) {
                    // On successful response add the contents (bucket objects) to our array
                    addToObjectList(s3ListSuccess.Contents);
                    // Update the count in the message area
                    updateApiMessageArea(awsObjectList.length);
                    // If there is more results to get (continuation token) and we haven't hit the loop safety limit then re-run listObjectLoop
                    if (s3ListSuccess.NextContinuationToken && listLoopCounter < 1) {
                        listObjectLoop(s3ListSuccess.NextContinuationToken);
                        listLoopCounter++;   
                    } else {
                        console.dir(awsObjectList);
                        filterObjectsToLogFilesOnly() // Determine no. of each type of log file (.txt .gz)
                            .then(getObjectDates()) // Find the date of each log file within key name
                            .then(updateFilterForm()) // Update the filter form with the information
                            .then(returnPromise())
                            .catch (function(error) {
                                console.log('A processing error occured');
                            })
                    }
                }).catch(function(s3ListError) {
                    // If api call fails then add error to stack
                    console.log(s3ListError);
                    errorStack.push({type: 'AWS API', errorMessage: s3ListError.message});
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

function addToObjectList(s3BucketObjects) {    
    // For each object in array extract the key property only & add to our array
    s3BucketObjects.forEach(function(bucketObject) {
        awsObjectList.push({objectKey: bucketObject.Key});        
    });
}

function updateApiMessageArea(numObjects) {
    // Update the counter for number of object found in message area
    $('#message-area-api-connect-counter').html(`Objects found: <strong>${numObjects}</strong>`);
}

function filterObjectsToLogFilesOnly() {
    return Promise.resolve();
}

function getObjectDates() {

    awsObjectList.push({objectKey: "test key 201-12-25"});

    awsObjectList.forEach(function(awsObject, index) {
        //Find & extract date string in key if exists then convert to date object
        let searchExp = /20\d{2}-\d{2}-\d{2}/; // Expression to find a date in the format yyyy-mm-dd
        let datePosition = awsObject.objectKey.search(searchExp);                     
        if (datePosition >= 0) {
            var dateAsString = awsObject.objectKey.substring(datePosition, datePosition + 10);
            // Try to convert string to date object and add as property in array
            awsObject.dateCreated = new Date(dateAsString);
            // Check its a real date
            if (isNaN(awsObject.dateCreated)) {
                // Add error to stack
                errorStack.push({type: 'List Processing', errorMessage: 'Could not convert to date for key ' + awsObject.objectKey});
                console.log('Could not convert to date for key ' + awsObject.objectKey);
                // Remove element from array
                awsObjectList.splice(index,1);
            }
        } else {
            // Add error to stack
            errorStack.push({type: 'List Processing', errorMessage: awsObject.objectKey + ' does not contain a valid date string'});
            console.log(awsObject.objectKey + ' does not contain a valid date string');
            // Remove element from array
            awsObjectList.splice(index,1);
        }
    // Catch promise result and return up the chain   
    });
    return Promise.resolve();
}

function updateFilterForm() {
    return Promise.resolve();
}

    // Handle promise result
    

                    // Parse object list for key

            // Find date string in key to determine log date

            // Convert to date object and store in list object

            // Determine max & min dates then display in filter form

            // Count no. of object loaded and display in message area