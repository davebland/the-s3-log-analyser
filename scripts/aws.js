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

// TEST DATA
var testDataS3 = `acea1d36a41f52c5432d6d490e825a08cdca9707571786b815c557e6940ec384 daveb.me.uk [14/Mar/2019:16:26:37 +0000] 157.55.39.63 - 82BA8AA0D5BA6649 WEBSITE.GET.OBJECT index.html "GET / HTTP/1.1" 200 - 195 195 69 69 "-" "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)" - - A4+LRBmK5nKJOwpWhBqCIqrvPhVCXw75oVvyl/xXxfTuo42mk3Lff3Ah/R7V4h3gLeqVQhNsgGs= - - - daveb.me.uk` // TEMP
var testDataCF = `2019-06-05	12:13:22	SEA19	574	54.212.180.101	GET	d3b19qjblu2xca.cloudfront.net	/	301	-	Go-http-client/1.1	-	-	Redirect	erWxwdksn2n2ozxSVRUk6fotC6hZXI3O4xRuuGrx247HL7uU1t1l5g==	daveb.me.uk	http	92	0.001	-	-	-	Redirect	HTTP/1.1` // TEMP
parseLogFileContent(testDataS3, 'S3Log');
parseLogFileContent(testDataCF, 'CloudFront');

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
                MaxKeys: 500                            
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
                parseLogFileContent(apiSuccess.Body.toString(), listItem.type).then(function(parseSuccess) {
                    // Update loaded logs counter
                    loadedLogsCounter++;
                    $('#message-area-load-logs-counter').text(loadedLogsCounter);
                    resolve();
                }).catch(function(parseError) {
                    // Update loaded logs counter
                    loadedLogsCounter++;
                    $('#message-area-load-logs-counter').text(loadedLogsCounter);
                    // Catch parsing error and save as warning
                    let errorText = `Error processing file ${listItem.objectKey} - ${parseError.message}`;
                    let errorObject = {type: 'Log File Processing', errorMessage: errorText, severity: 'fatal'};
                    reject(errorObject);
                });  
            }).catch(function(apiError) {
                // Catch API errors and save as fatal
                let errorText = `Could not get file ${listItem.objectKey} - ${apiError.message}`;
                let errorObject = {type: 'AWS API', errorMessage: errorText, severity: 'fatal'};
                reject(errorObject);
            });

        })            
        // Add the promise to the array
        promiseArray.push(s3GetRequest);
    })

    // Track when all promises are complete and use as return
    console.table(dataArray);
    return Promise.all(promiseArray);
}

// Parse response to JS object & add to dataArray
function parseLogFileContent(content, type) {
    // Remove spaces followed by + (time)
    let searchExpression = / (?=\+)/gm;
    content = content.replace(searchExpression, "");
    // Remove spaces contained within quotes
    searchExpression = /(?<= "[^"]*) (?=[^"]*" )/gm;
    content = content.replace(searchExpression, "");
    // Remove lines starting with # (.gz header lines)
    searchExpression = /#[^\n]*\n/gm;
    content = content.replace(searchExpression, "");
    // Create space delimeted parser for S3 Logs
    let parser = d3.dsvFormat(" ");
    // Parse data from the log row into an object according to type, ignore unwanted fields
    let parseResult = [];
    try {                   
        if (type == "S3Log") {
            parseResult = parser.parseRows(content, function(d, i) {
                // Remove invalid characters in date format
                d[2] = d[2].replace(/[\[\]]/g,'');
                d[2] = d[2].replace(/:/,' ');                
                // Correct type on other values as we go 
                return {
                    TimeDate: new Date(d[2]),
                    Operation: d[6],
                    FileRequested: d[7],
                    HttpStatus: +d[9],
                    BytesSent: convertToNumber(d[11]),
                    TotalTime: +d[13],
                    Referrer: d[15],
                    UserAgent: d[16],
                    Protocol: d[20]
                };
                function convertToNumber(input) {
                    if (isNaN(+input)) {
                        // Catch NaN error
                        new Error('Error converting to number');
                        return 0;
                    } else {
                        return +input;
                    }
                }                                     
            });
        } else {
            // Assume CloudFront if not S3
            parseResult = d3.tsvParseRows(content, function(d, i) {             
                return {
                    // Correct type on other values as we go
                    TimeDate: new Date(`${d[0]} ${d[1]}`),
                    Operation: d[5],
                    FileRequested: d[7],
                    HttpStatus: +d[8],
                    BytesSent: +d[3],
                    TotalTime: +d[17],
                    Referrer: d[9],
                    UserAgent: d[10],
                    Protocol: d[21],
                } 
            });          
        }
        // Add data object to array
        dataArray = dataArray.concat(parseResult);
        return Promise.resolve();    
    } catch (error) {
        return Promise.reject(error);
    }
}