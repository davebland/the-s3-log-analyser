/* 
    THE S3 LOG ANALYSER
    FORMS AND MESSAGE AREA MANAGEMENT
    BY DAVID BLAND
*/

/* SETUP */

// Application wide variables
let saveCredsFlag = false;

// Disable standard form submit behavour (don't reload page)
$(document).submit(function(event){
    event.preventDefault();
});

// Initial functions to run
checkSavedCredsButtonState();
getAwsRegions();
$('#message-area-load-logs').hide();

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
        $('#fieldset-log-file-type').addClass('border-red');
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
        $('#button-submit-filter-form').prop('disabled', false);
        $('#button-reset-filter-form').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#fieldset-log-file-date :input').prop('disabled', true);
    }
}

function enableFilterByPresetForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#fieldset-log-file-presets :input').prop('disabled', false);
        $('#button-submit-filter-form').prop('disabled', false);
        $('#button-reset-filter-form').prop('disabled', false);
    } else {
        //Disable form fields
        $('#fieldset-log-file-presets :input').prop('disabled', true);
    }
};

function enableFilterFormSubmit(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#button-submit-filter-form:input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#button-submit-filter-form:input').prop('disabled', true);
    }
}

/* MESSAGE AREAS */

function updateApiMessageArea(numObjects) {
    // Update the counter for number of object found in message area
    $('#message-area-api-connect-counter').html(numObjects);
}

// Clear API message area
function clearApiMessageArea() {
    // Hide message area
    $('#message-area-api-connect').hide();
    // Reset data fields
    $('#message-area-api-connect-loading').html('<div class="spinner-border" role="status"></div>');
    $('message-area-api-connect-counter').html('0');
    $('#message-area-api-connect-other-count, #message-area-api-connect-gz-count, #message-area-api-connect-removed-count').html('-');
}

// Reset & hide Load Logs message area
function clearLoadLogsMessageArea() {
    $('#message-area-load-logs-loading').html('<span class="spinner-border mr-2" role="status"></span>');
    $('#message-area-load-logs-counter').text(0);
    $('#message-area-load-logs').hide();    
}

/* RESETS */

// Reset Page
function resetPage() {
    // Reset forms
    resetCredsForm();
    resetFilterForm();
    $('#fieldset-log-file-type').removeClass('border-red');
    // Disable filter form and enable creds form
    enableCredsForm(true);
    enableFilterByTypeForm(false);
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
    $(window).scrollTop(0);
    // Clear down application wide variables
    errorStack = [];
    awsObjectList = [];
    ndx = 0;
}

// Reset Creds Form
function resetCredsForm() {
    $('#form-api-creds')[0].reset(); 
}

// Reset Filter Logs Form
function resetFilterForm(flowPosition) {
    // Disable elements apart from type selected, highlight & reset form
    enableFilterByTypeForm(true);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);
    $('#section-filter-logs').addClass('highlight-form');    
    $('#form-filter-log-files')[0].reset();
    $('#info-num-files-selected').text('-');
    $('#button-submit-filter-form').prop('disabled', true);
    $('#button-reset-filter-form').prop('disabled', true);
    $('#fieldset-log-file-date').removeClass('border-red');
    $('#fieldset-log-file-presets').removeClass('border-red');
    // If we are changing the filter update the dates
    if (flowPosition == 'ChangeFilter') {
        updateMinMaxDates();
    }    
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
    // Clear error stack
    errorStack = [];
    // Disable creds form and un-highlight whilst processing
    enableCredsForm(false);
    $('#section-filter-logs').removeClass('highlight-form');
    // Show message area, add message & scroll to if required
    $('#message-area-api-connect').show();
    $('#message-area-api-connect-loading').append('Loading...');
    $(window).scrollTop($('#message-area-api-connect').offset().top - 100);
    // Create object holding AWS Creds
    let awsCreds = {
        awsRegion: formCreds.awsRegion.value,
        keyId: formCreds.keyId.value,
        keySecret: formCreds.keySecret.value,
        bucketName: formCreds.bucketName.value
    }
    // Invoke function to list objects and handle promise
    awsListObjects(awsCreds).then(function(success) {
            // Update message area & show instruction
            $('#message-area-api-connect-loading').html('Success!');
            $('#instruction-select-filter').show();
            // Enable filter form
            enableFilterByTypeForm(true);
        }).catch(function(error) {
            // Update message area & show instruction
            $('#message-area-api-connect-loading').html('Loaded, but with some errors...');
            $('#instruction-select-filter').show();
            // Enable filter form
            enableFilterByTypeForm(true);
            // Call error display function
            displayErrors('list');                    
        });
    // Save creds & return
    saveCreds(awsCreds);
    return false;
}

// Triggered on submission of filter form
function submitFilterForm() {
    // Clear error stack
    errorStack = [];
    // Disable filter form & submit button and un-highlight whilst processing
    enableFilterByTypeForm(false);
    enableFilterByDateForm(false);
    enableFilterByPresetForm(false);
    $('#button-submit-filter-form').prop('disabled', true);
    $('#section-filter-logs').removeClass('highlight-form');
    // Show message area & filter button in footer
    $('#message-area-load-logs').show();
    $('#message-area-load-logs-loading').append('Loading...');
    $('#button-change-filter-footer').show();
    // Convert list crossfilter to array of keys to retrieve
    let awsGetList = dateDim.top(Infinity);
    // Send get list to aws function & handle promise
    awsGetObjects(awsGetList).then(function(success) {
        // Write success to message area
        $('#message-area-load-logs-loading').text('Success!');
        // Display the charts
        displayData();
    }).catch(function(errorObject) {
        // Collect any internal errors and add to stack
        errorStack.push(errorObject);
        // Write warning to message area
        $('#status-area-load-logs').text('Some errors occured...');
        // Call error display function
        displayErrors('get');
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
    // Get demo secret from web
    $.get('https://daveb.me.uk/s3-log-analyser-demo.txt', function(secret) {
        // Input into form
        $('#access-key-secret').val(secret);
    });
    // Input other creds data into form fields
    $('#access-key-id').val('AKIASVQN7V6SIMIAYWHC');
    $('#aws-region-select').val('eu-west-2');
    $('#bucket-name').val('demo.the-s3-log-analyser');
}