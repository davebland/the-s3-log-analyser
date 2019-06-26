/* 
    THE S3 LOG ANALYSER
    OBJECT LIST FILTERS
    BY DAVID BLAND
*/

/* SETUP */

// Application wide variables
let ndx;
let dateDim;

/* OBJECT LIST FILTERS */

function getListObjectDate(objectKey) {
    // Find & extract date string in key if exists then convert to date object
    let searchExp = /20\d{2}-\d{2}-\d{2}/; // Expression to find a date in the format yyyy-mm-dd
    let datePosition = objectKey.search(searchExp);                     
    if (datePosition >= 0) {
        // Extract date part of string
        let dateAsString = objectKey.substring(datePosition, datePosition + 10);
        // Try to convert string to date object and add as object property
        var objectDate = new Date(dateAsString);
        // Check its a real date
        if (!(isNaN(objectDate))) {
            return objectDate;
        } else {
            // If not real add error to stack
            errorStack.push({type: 'List Processing', errorMessage: 'Could not convert to date for key ' + objectKey, severity: 'warning'});
            // Return fail
            return false;
        }
    } else {
        // If not date string found add error to stack
        errorStack.push({type: 'List Processing', errorMessage: objectKey + ' does not contain a valid date string', severity: 'warning'});
        // Return fail
        return false;
    } 
}

function getListObjectType(objectKey) {
    // If ends in .gz then type CloudFront
    if (objectKey.slice(-3) == '.gz') {
        return "CloudFront";
    } else if (objectKey.slice(-10).indexOf('.') >= 0) { // Filter out common file types (keys which look like extensions .xxx)
        // Add to error stack
        errorStack.push({type: 'List Processing', errorMessage: objectKey + ' has invalid file extension', severity: 'warning'});
        // Return fail
        return false;
    } else {
        // If none of above assume type S3 Log
        return "S3Log";
    }
}

function removeInvalidListObjects() {
    // For each object in the list, check for invalid (false) properties
    let indexesToRemove = []
    awsObjectList.forEach(function(listItem, index) {
        if (!listItem.dateCreated) {
            // Add to remove list if no date
            indexesToRemove.push(index);
        } else if (!listItem.type) {
            // Add to remove list if no type
            indexesToRemove.push(index);
        }
    });
    // Remove object list items with indexes in remove list
    let removedCount = 0;
    indexesToRemove.reverse(); // Start from highest index to avoid errors as array size changes
    indexesToRemove.forEach(function(indexToRemove) {
        console.log('removing ' + awsObjectList[indexToRemove]['objectKey']);
        awsObjectList.splice(indexToRemove, 1);
        removedCount++;
    });
    return Promise.resolve(removedCount);
}

function getObjectListStats(removedCount = 0) {
    // Start with fresh stats object
    var objectListStats = {
        gzCount: 0,
        s3Count: 0,
        removedCount: removedCount
    };
    awsObjectList.forEach(function(listObject) {
        // Count keys of each type         
        if (listObject.type == "CloudFront") {
            objectListStats.gzCount++;
        } else {
            // Assume S3Log as all others removed already
            objectListStats.s3Count++;
        }
    });
    // Sort Asc by date
    awsObjectList.sort((a, b) => a.dateCreated - b.dateCreated);
    // Update min and max date objects
    updateMinMaxDates();
    // Update display & return
    displayListStats(objectListStats);
    return Promise.resolve();
}

function updateMinMaxDates() {
    // Check if there are items in the object list
    if (awsObjectList.length > 0) {
        // Get max & min date object (start and end of array)
        let maxDate = awsObjectList[awsObjectList.length - 1]['dateCreated'];
        let minDate = awsObjectList[0]['dateCreated'];
        // Set form elements to reflect min and max dates
        let dateFormat = d3.timeFormat('%Y-%m-%d');
        $('#info-date-max').text(maxDate.toDateString());
        $('#date-max').attr('min', dateFormat(minDate));
        $('#date-max').attr('max', dateFormat(maxDate));
        $('#date-max').val(dateFormat(maxDate));
        $('#info-date-min').text(minDate.toDateString());
        $('#date-min').attr('min', dateFormat(minDate));
        $('#date-min').attr('max', dateFormat(maxDate));
        $('#date-min').val(dateFormat(minDate));
        return;
    } else {
        return;
    }
}

function displayListStats(objectListStats) {
    // Update gz count
    $('#message-area-api-connect-gz-count').html(objectListStats.gzCount);
    // Update other count
    $('#message-area-api-connect-other-count').html(objectListStats.s3Count);
    // Update removed count
    $('#message-area-api-connect-removed-count').html(objectListStats.removedCount);
    return;
}
 
function filterListByType(type) {
    // Load awsObjectList list into crossfilter
    ndx = crossfilter(awsObjectList);
    // Create dimension by type & filter by requested type
    ndx.dimension(dc.pluck('type')).filter(type);
    // Create dimension by date
    dateDim = ndx.dimension(dc.pluck('dateCreated'));
    // Update count display
    updateSelectedLogFiles();
    // Enable next form elements
    enableFilterByDateForm(true);
    enableFilterByPresetForm(true);
    enableFilterFormSubmit(true);
    return Promise.resolve();
}

function filterListByDate() {
    // Disable filter by type and preset elements & highlight
    enableFilterByTypeForm(false);
    enableFilterByPresetForm(false);
    $('#fieldset-log-file-date').addClass('border-red');
    // Get date value from both date form elements
    let dateMin = new Date($('#date-min').val());
    let dateMax = new Date($('#date-max').val());
    dateMax.setDate(dateMax.getDate() + 1); // Add 1 day to satisfy filter function
    // Clear old filters and re filter date dimension by range min or max
    dateDim.filterAll();
    dateDim.filterRange([dateMin, dateMax]);
    // Update count display & return
    updateSelectedLogFiles();
    return Promise.resolve();
}

function filterListByPreset(presetName) {
    // Disable filter by type and date elements & highlight
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    $('#fieldset-log-file-presets').addClass('border-red');
    // For each preset no apply a relevant filter to the list data
    dateDim.filterAll();
    let today = new Date();
    let dateMax = d3.timeDay.offset(today, +1);
    let dateMin = null;
    switch(presetName) {
        case "1Week" :
            dateMin = d3.timeDay.offset(today, -7);
            dateDim.filterRange([dateMin, dateMax]);
            break;
        case "1Month" :
            dateMin = d3.timeMonth.offset(today, -1);
            dateDim.filterRange([dateMin, dateMax]);
            break;
        case "6Month" :
            dateMin = d3.timeMonth.offset(today, -6);
            dateDim.filterRange([dateMin, dateMax]);
            break;
        case "1Year" :
            dateMin = d3.timeYear.offset(today, -1);
            dateDim.filterRange([dateMin, dateMax]);
            break;
        default :
            break;
    }
    // Update count display & return
    updateSelectedLogFiles();
    return Promise.resolve();
}

function updateSelectedLogFiles() {
    $('#info-num-files-selected').text(ndx.groupAll().reduceCount().value());
}

function changeFilters() {
    // Reset chart display area, message area & filter form
    resetChartArea();
    clearLoadLogsMessageArea();
    resetFilterForm('ChangeFilter');
    // Scroll to filter form
    $(window).scrollTop($('#section-filter-logs').offset().top - 100);
}