/* 
    THE S3 LOG ANALYSER
    AWS API FUNCTIONS
    BY DAVID BLAND
*/

// Application wide variables
var awsObjectList = [];
var errorStack = [];
var listLoopCounter = 0;

// Enable AWS console logger
AWS.config.logger = console;

// Set AWS config and service object globally
function setupAws() {
    // Set creds awsCreds object
    AWS.config.credentials = new AWS.Credentials({accessKeyId: awsCreds.keyId, secretAccessKey: awsCreds.keySecret});
    // Create S3 service object with region and bucket name from awsCreds
    return new AWS.S3({region: awsCreds.awsRegion, params: {Bucket: awsCreds.bucketName}});
}

// AWS List Objects (first call to AWS) 
function awsListObjects() {
    // Get an s3 service option setup ready to go
    let s3 = setupAws();
    
    // Create function to call api and list object
    function listObjectLoop(ContinuationToken) {
        // Set additional S3 parameters including continuation token if available          
        let s3Options = {
            MaxKeys: 10                
        };
        if (ContinuationToken) {
            s3Options.ContinuationToken = awsContinuationToken;
        }

        s3.listObjectsV2(s3Options, function(s3ListError, s3ListSuccess) {
            if (s3ListError) {
                // If list objects api call fails then add error to stack
                errorStack.push({type: 'AWS API', errorCode: s3ListError.code, errorMessage: s3ListError.message});
            } else {
                // On successful response add the contents (bucket objects) to our array
                addToObjectList(s3ListSuccess.Contents);
                // If there is more results to get (continuation token) and we haven't hit the loop safety limit then re-run listObjectLoop
                if (s3ListSuccess.ContinuationToken && listLoopCounter < 5) {
                    listObjectLoop(ContinuationToken);
                    listLoopCounter++;
                } else {
                    //listObjectLoopComplete();
                }
            }
        });
        
    }

    function listObjectLoopComplete() {
        if (errorStack.length > 0) {
        // If any errors then return promise as rejected
            //return Promise.reject();
        } else {
            //return Promise.resolve('Listing success, no. objects = ' + awsObjectList.length);
        } 
    }

    // Call api for first time
    //listObjectLoop();

    // Work through the object list to generate dates
    //generateObjectDates();

    

    /*
    // Create promise to return to handler
    let listObjectPromise = new Promise(function(resolve, reject) {        
        if (errorStack.length > 0) {
            // If any errors then return promise as rejected
            //reject();
        } else {
            //resolve('Listing success, no. objects = ' + awsObjectList.length);
        }            
    });

    return listObjectPromise;
    */
}

function addToObjectList(s3BucketObjects) {    
    // For each object in array extract the key property only & add to our array
    s3BucketObjects.forEach(function(bucketObject) {
        awsObjectList.push({objectKey: bucketObject.Key});        
    })
    console.dir(awsObjectList);
    // Return list for further processing
    return awsObjectList;
}

    // Handle promise result
    

                    // Parse object list for key

            // Find date string in key to determine log date

            // Convert to date object and store in list object

            // Determine max & min dates then display in filter form

            // Count no. of object loaded and display in message area
    
    
    // Return promise result to promise handler 
    //return awsListObjectsResult;
/*

    result = new Promise(function(resolve, reject) {
        if(awsCreds.keyId == 'test') {
            resolve('Creds Recieved');
        } else {
            reject({ code: 'Wrong creds', message: 'error details'});
        };
    });
    return result; */
