/* 
    THE S3 LOG ANALYSER
    AWS API FUNCTIONS
    BY DAVID BLAND
*/

// Application wide variables
var awsObjectList = [];

// Enable AWS console logger
AWS.config.logger = console;

// AWS List Objects (first call to AWS) 
function awsListObjects(awsContinuationToken) {
    // Set AWS creds globally using awsCreds object
    AWS.config.credentials = new AWS.Credentials({accessKeyId: awsCreds.keyId, secretAccessKey: awsCreds.keySecret});

    // Create S3 service object with region and bucket name from awsCreds
    let s3 = new AWS.S3({region: awsCreds.awsRegion, params: {Bucket: awsCreds.bucketName}});                                    

    // Set additional S3 parameters including continuation token if available          
    let s3Options = {
        MaxKeys: 10                
    };
    if (awsContinuationToken) {
        s3Options.ContinuationToken = awsContinuationToken;
    }

    console.log('AWS Options: ');
    console.dir(s3Options);

    // Create promise to return to handler
    return new Promise(function(resolve, reject) {        
        // Call S3 to list bucket objects & handle promise result
        s3.listObjectsV2(s3Options).promise().then(function(s3ListSuccess) {
            // On successful response add the contents (bucket objects) to our array
            addToObjectList(s3ListSuccess.Contents);
            resolve('List Success, no objects = ' + awsObjectList.length);
        }).catch(function(s3ListError) {
            // If list objects api call is not a success then reject awsListObjectResult promise & add error message to error modal
            $('#modal-error-message-area').append(`<p>AWS ERROR (list objects): ${s3ListError.code} - ${s3ListError.message}</p>`);
            reject();
        });
    })
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
