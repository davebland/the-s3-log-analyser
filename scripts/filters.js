/* 
    THE S3 LOG ANALYSER
    OBJECT LIST FILTERS
    BY DAVID BLAND
*/

function filterInvalidObjects() {
    // For each key in array determine if ends in .gz (CloudFront) or some other file extension
    awsObjectList.forEach(function(awsObject, index) {
        // Filter out common file types (extensions not gz less than 10 characters)
        let searchString = awsObject.objectKey.slice(-10);
        if (searchString.indexOf('.') >= 0) {
            if (searchString.search('.gz') < 0) {
                // If not .gz add error to stack
                errorStack.push({type: 'List Processing', errorMessage: 'Removed object with invalid file extension: ' + awsObject.objectKey});
                console.log('Removed object with invalid file extension: ' + awsObject.objectKey);
                // Remove element from array
                awsObjectList.splice(index,1);
            }
        }
    });
    return Promise.resolve();
}

function getObjectDates() {
    awsObjectList.forEach(function(awsObject, index) {
        // Find & extract date string in key if exists then convert to date object
        let searchExp = /20\d{2}-\d{2}-\d{2}/; // Expression to find a date in the format yyyy-mm-dd
        let datePosition = awsObject.objectKey.search(searchExp);                     
        if (datePosition >= 0) {
            // Extract date part of string
            let dateAsString = awsObject.objectKey.substring(datePosition, datePosition + 10);
            // Try to convert string to date object and add as object property in array
            awsObject.dateCreated = new Date(dateAsString);
            // Check its a real date
            if (isNaN(awsObject.dateCreated)) {
                // If not real add error to stack
                errorStack.push({type: 'List Processing', errorMessage: 'Could not convert to date for key ' + awsObject.objectKey});
                console.log('Could not convert to date for key ' + awsObject.objectKey);
                // Remove element from array
                awsObjectList.splice(index,1);
            }
        } else {
            // If not date string found add error to stack
            errorStack.push({type: 'List Processing', errorMessage: awsObject.objectKey + ' does not contain a valid date string'});
            console.log(awsObject.objectKey + ' does not contain a valid date string');
            // Remove element from array
            awsObjectList.splice(index,1);
        }  
    });
    return Promise.resolve();
}

function objectListStats() {
    
    var objectListStats = {
        gzCount: 0,
        otherCount: 0
    };

    // Count keys end in .gz or other (e.g. CloudFront or S3 log)
    awsObjectList.forEach(function(awsObject, index) {               
        if (awsObject.objectKey.slice(-3) == '.gz') {
            objectListStats.gzCount++;
        } else {
            objectListStats.otherCount++;
        }
    });
    // Sort Asc by date
    awsObjectList.sort((a, b) => a.dateCreated -b.dateCreated);
    // Get max & min date object (start and end of array)
    objectListStats.maxDate = awsObjectList[awsObjectList.length - 1]['dateCreated'];
    objectListStats.minDate = awsObjectList[0]['dateCreated'];
    
    
    // Update display
    displayListStats(objectListStats);
    
    console.dir(awsObjectList);

    return Promise.resolve(objectListStats);
}


function displayListStats(objectListStats) {
    // Update gz count
    $('#message-area-api-connect-gz-count').text(`CloudFront Log Files: ${objectListStats.gzCount}`);
    // Update other count
    $('#message-area-api-connect-other-count').text(`S3 Log Files: ${objectListStats.otherCount}`);
    // Update form elements using min max dates
    $('#info-date-max').text(objectListStats.maxDate.toDateString());
    $('#date-max').attr('min', createDateString(objectListStats.minDate));
    $('#date-max').attr('max', createDateString(objectListStats.maxDate));
    $('#info-date-min').text(objectListStats.minDate.toDateString());
    $('#date-min').attr('min', createDateString(objectListStats.minDate));
    $('#date-min').attr('max', createDateString(objectListStats.maxDate));

    function createDateString(dateObject) {
        // Return date in format yyyy-mm-dd
        if (dateObject.getMonth() < 9) {
            return `${dateObject.getFullYear()}-0${dateObject.getMonth() + 1}-${dateObject.getDate()}`;
        } else {
            `${dateObject.getFullYear()}-${dateObject.getMonth() + 1}-${dateObject.getDate()}`;
        }
    }
    
    return;
}