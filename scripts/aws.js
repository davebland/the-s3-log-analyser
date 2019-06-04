/* 
    THE S3 LOG ANALYSER
    AWS API FUNCTIONS
    BY DAVID BLAND
*/

// Application wide variables
var awsObjectList = [];
var errorStack = [];
var s3;
var dataArray = [];

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
        s3 = setupAws(awsCreds);

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

// AWS Get Object, returns promise to handler
function awsGetObjects(awsGetList) {
    // Reset & display loaded logs counter
    let loadedLogsCounter = 0;
    $('#message-area-loaded-counter').text(`Logs Loaded: ${loadedLogsCounter}`);
    // Reset dataArray
    dataArray = [];
    // Create an array of promises (one for each file to be retrieved)
    let promiseArray = [];
    awsGetList.forEach(function(listItem) {
        console.log('Requesting: ' + listItem.objectKey);
        // Set additional S3 parameters including responsetype header for CloudFront .gz object          
        let s3Options = {
            Key: listItem.objectKey                         
        };
        if (listItem.type == "CloudFront") {
            s3Options.ResponseContentEncoding = "gzip";
        }
        // Create the request object
        let s3GetRequest = new Promise(function(resolve, reject) {
            // Call S3 to get objects and handle promise
            s3.getObject(s3Options).promise().then(function(apiSuccess) {
                // Send data to processing function & handle promise
                parseLogFileContent(apiSuccess.Body.toString()).then(function(parseSuccess) {
                    // Update loaded logs counter
                    loadedLogsCounter++;
                    $('#message-area-loaded-counter').text(`Logs Loaded: ${loadedLogsCounter}`);
                    console.log(success);
                    resolve();
                }).catch(function(parseError) {
                    // Catch parsing error and save as warning
                    let errorText = `Error processing file ${listItem.objectKey} - ${parseError.message}`;
                    errorStack.push({type: 'Log File Processing', errorMessage: errorText, severity: 'warning'});
                    resolve();
                });  
            }).catch(function(apiError) {
                // Catch API errors and save as fatal
                let errorText = `Error getting file ${listItem.objectKey} - ${apiError.message}`;
                errorStack.push({type: 'AWS API', errorMessage: errorText, severity: 'fatal'});
                reject();
            });
        })            
        // Add the promise to the array
        promiseArray.push(s3GetRequest);
    })

    // Track when all promises are complete and use as return
    console.table(dataArray);
    return Promise.all(promiseArray);
}

function parseLogFileContent(content) {
    // Parse response to JS object & add to results array      
    let parser = d3.dsvFormat(" ");
    try {
        let results = parser.parseRows(content, function(d, i) {
            return {
                f1: d[0],
                f2: d[1],
                f3: d[2],
                f4: d[3],
                f5: d[4],
                f6: d[5],
                f7: d[6],
                f8: d[7],
                f9: d[8],
                f10: d[9],
                f11: d[10],
                f12: d[11],
                f13: d[12],
                f14: d[13],
                f15: d[14],
                f16: d[15]
            };
        });
        dataArray = dataArray.concat(results);
        return Promise.resolve();        
    } catch (error) {
        return Promise.reject(error);
    }
}