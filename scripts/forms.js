/* 
    THE S3 LOG ANALYSER
    FORMS AND MESSAGE AREA MANAGEMENT
    BY DAVID BLAND
*/

// Application wide variables
var saveCredsFlag = false;

// Disable standard form submit behavour (reload page)
$(document).submit(function(event){
    event.preventDefault();
});

// Initial functions to run
checkSavedCredsButtonState();
getAwsRegions();

/* FORM DISPLAY */

// Enable/disable API Credentials form
function enableCredsForm(yes) {
    if (yes) {
        // Highlight section
        $('#section-api-creds').addClass('highlight-form');
        // Enable form fields & buttons
        $('#form-api-creds :input').prop('disabled', false);
        $('#buttons-load-saved :input').prop('disabled', false);
        // Check saved creds button state having just enabled it
        checkSavedCredsButtonState();
    } else {
        // Un-highlight section
        $('#section-api-creds').removeClass('highlight-form');
        //Disable form fields & buttons
        $('#form-api-creds :input').prop('disabled', true);
        $('#buttons-load-saved :input').prop('disabled', true);
    }
}

// Enable/disable Filter Logs form by type
function enableFilterByTypeForm(yes) {
    if (yes) {
        // Highlight section
        $('#section-filter-logs').addClass('highlight-form');
        //Enable form fields & buttons
        $('#fieldset-log-file-type :input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#fieldset-log-file-type :input').prop('disabled', true);
    }
}

// Enable/disable Filter Logs form by date
function enableFilterByDateForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#fieldset-log-file-date :input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#fieldset-log-file-date :input').prop('disabled', true);
    }
}

function enableFilterByPresetForm(yes) {};

function enableFilterFormSubmit(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#button-submit-filter-form:input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#button-submit-filter-form:input').prop('disabled', true);
    }
}

// Reset API Credentials Form
function resetCredsForm() {
    $('#form-api-creds')[0].reset(); 
}

// Reset Filter Logs Form
function resetFilterForm() {
    $('#form-filter-log-files')[0].reset();
}

/* MESSAGE AREAS */

function updateApiMessageArea(numObjects) {
    // Update the counter for number of object found in message area
    $('#message-area-api-connect-counter').html(`Objects found: <strong>${numObjects}</strong>`);
}

// Clear API message area
function clearApiMessageArea() {
    $('#message-area-api-connect div').empty();
}

// Clear & hide Load Logs message area
function clearLoadLogsMessageArea() {
    $('#message-area-load-logs div').empty();
    $('#message-area-load-logs div').hide();

}

/* RESETS */

// Reset Page
function resetPage() {
    // Reset forms
    resetCredsForm();
    resetFilterForm();
    // Disable filter form and enable creds form
    enableCredsForm(true);
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);
    // Clear filter form date displays
    $('#info-date-min').empty();
    $('#info-date-max').empty();
    // Clear message areas
    clearApiMessageArea();
    clearLoadLogsMessageArea();
    // Add holding notice & remove chart containers
    $('#heading-no-data').show();
    $('#section-visualise-data article').hide();
    // Highlight creds form and un-highlight filter form
    $('#section-api-creds').addClass('highlight-form');
    $('#section-filter-logs').removeClass('highlight-form');
    // Scroll back to the top of the page
    $(window).scrollTop();
    // Clear down application wide variablse
    errorStack = [];
    awsObjectList = [];
}

/* AWS REGION DROPDOWN */

// Load list of AWS regions into creds form
function getAwsRegions() {
    let awsRegions = [
        "us-east-2",
        "us-east-1",
        "us-west-1",
        "us-west-2",
        "ap-east-1",
        "ap-south-1",
        "ap-northeast-2",
        "ap-southeast-1",
        "ap-southeast-2",
        "ap-northeast-1",
        "ca-central-1",
        "cn-north-1",
        "cn-northwest-1",
        "eu-central-1",
        "eu-west-1",
        "eu-west-2",
        "eu-west-3",
        "eu-north-1",
        "sa-east-1",
        "us-gov-east-1",
        "us-gov-west-1",
    ]
    // For each region in the array add an option element to the form dropdown
    awsRegions.forEach(function(region) {
        $('#aws-region-select').append(`<option value="${region}">${region}</option>`);
    });
    // Pre select 'eu-west-2' as region
    $('#aws-region-select option[value="eu-west-2"]').attr("selected", true);
}
    
/* FORM SUBMISSION */

// Triggered on submission of credentials form
function submitCredsForm(formCreds) {
    
    // Disable creds form and un-highlight whilst processing
    enableCredsForm(false);
    $('#section-filter-logs').removeClass('highlight-form');

    // Write loading to message area
    $('#message-area-api-connect-loading').text('Loading...');

    // Create object holding AWS Creds
    let awsCreds = {
        awsRegion: formCreds.awsRegion.value,
        keyId: formCreds.keyId.value,
        keySecret: formCreds.keySecret.value,
        bucketName: formCreds.bucketName.value
    }
    console.table(awsCreds);

    // Invoke function to list objects and handle promise
    awsListObjects(awsCreds).then(function(success) {
            // Update message area
            $('#message-area-api-connect-loading').text('Success!');            
            // Enable filter form
            enableFilterByTypeForm(true);
        }).catch(function(error) {
            // Update message area
            $('#message-area-api-connect-loading').text('Loaded, but with some errors...');            
            // Enable filter form
            enableFilterByTypeForm(true);
            // Call error display function
            displayErrors();                    
        });

    // Save creds
    saveCreds(awsCreds);

    return false;
}

// Triggered on submission of filter form
function submitFilterForm() {
    // Disable filter form and un-highlight whilst processing
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);
    $('#section-filter-logs').removeClass('highlight-form');

    // Show & write loading to message area
    $('#message-area-load-logs div').show();
    $('#status-area-load-logs').text('Loading...');

    // Convert list crossfilter to array of keys to retrieve
    let awsGetList = dateDim.top(Infinity);

    // Clear error stack
    errorStack = [];

    // Send get list to aws function & handle promise
    awsGetObjects(awsGetList).then(function(success) {
        // Write success to message area
        $('#status-area-load-logs').text('Logs loaded successfully!');
        // Display the charts
        displayData();
    }).catch(function(error) {
        // Collect any internal errors and add to stack
        errorStack.push({type: 'Displaying Data', errorMessage: error.message, severity: 'warning'});
        // Write warning to message area
        $('#status-area-load-logs').text('Logs loaded with some errors...');
        // Call error display function
        displayErrors();
        // Display the charts
        displayData();
    });

    return false; 
}

/* SAVED CREDENTIALS */

// Save credentials (if flag set)
function saveCreds(awsCreds) {
    if (saveCredsFlag) {
        // Save credentials locally with property name to match those in awsCreds object
        for (var property in awsCreds) {
            localStorage.setItem(property, awsCreds[property]);    
        }      
    }
}

// Load saved credentials
function loadSavedCreds() {
    // Input data into form fields
    $('#access-key-id').val(localStorage.getItem('keyId'));
    $('#access-key-secret').val(localStorage.getItem('keySecret'));
    $('#aws-region-select').val(localStorage.getItem('awsRegion'));
    $('#bucket-name').val(localStorage.getItem('bucketName'));
}

// Clear saved credentials
function clearSavedCreds() {    
    localStorage.clear();
    // Check saved creds button state (to disable)
    checkSavedCredsButtonState();
}

// Check if it looks like saved cred are avaiable and enable button accordingly
function checkSavedCredsButtonState() {    
    if (localStorage.length > 0) {
        $('#buttons-load-local-saved :input').prop('disabled', false);
    } else {
        $('#buttons-load-local-saved :input').prop('disabled', true);
    }
}

/* DEMO CREDENTIALS */

function loadDemoCredentials() {
    // Get demo creds from file (tbd)

    // Input data into form fields
    $('#access-key-id').val('AKIASVQN7V6SIMIAYWHC');
    $('#access-key-secret').val('');
    $('#aws-region-select').val('eu-west-2');
    $('#bucket-name').val('demo.the-s3-log-analyser');
}