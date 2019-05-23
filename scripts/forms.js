/* 
    THE S3 LOG ANALYSER
    FORM MANAGEMENT
    BY DAVID BLAND
*/

// Application wide variables
var awsCreds = {};
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
        //Enable form fields & buttons
        $('#form-api-creds :input').prop('disabled', false);
        $('#buttons-load-saved :input').prop('disabled', false);
        // Check saved creds button state having just enabled it
        checkSavedCredsButtonState();
    } else {
        //Disable form fields & buttons
        $('#form-api-creds :input').prop('disabled', true);
        $('#buttons-load-saved :input').prop('disabled', true);
    }
}

// Enable/disable Filter Logs form
function enableFilterForm(yes) {
    if (yes) {
        //Enable form fields & buttons
        $('#form-filter-log-files :input').prop('disabled', false);
    } else {
        //Disable form fields & buttons
        $('#form-filter-log-files :input').prop('disabled', true);
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

// Clear API Connect message area
function clearApiMessageArea() {
    $('#message-area-api-connect').empty();
}

// Clear Load Logs message area
function clearLoadLogsMessageArea() {
    $('#message-area-load-logs').empty();
}

// Reset Page
function resetPage() {
    // Reset forms
    resetCredsForm();
    resetFilterForm();
    // Disable filter form and enable creds form
    enableCredsForm(true);
    enableFilterForm(false);
    // Clear message areas
    clearApiMessageArea();
    clearLoadLogsMessageArea()
    // Clear down application wide variable
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

// Triggered on submission of API credentials form
function submitCredsForm(apiCreds) {

    // Disable creds form whilst processing
    enableCredsForm(false);

    // Write loading to message area
    $('#message-area-api-connect').append('<p>Loading...</p>');

    // Update object holding AWS Creds
    awsCreds = {
        awsRegion: apiCreds.awsRegion.value,
        keyId: apiCreds.keyId.value,
        keySecret: apiCreds.keySecret.value,
        bucketName: apiCreds.bucketName.value
    }
    console.table(awsCreds);

    // Invoke function to list objects and handle promise
    awsListObjects().then(function(success) {
            // On list function success
            //console.log(success);
            $('#message-area-api-connect').append(`<p>${success}</p>`);
            // Enable filter form
            enableFilterForm(true);
        }).catch(function(error) {
            // On error write errorStack details to modal message area
            $('#modal-error-message-area').empty();
            errorStack.forEach(function(error) {            
                $('#modal-error-message-area').append(`<p>${error.type} ERROR: ${error.errorCode} - ${error.errorMessage}</p>`);
            });
            // Display error modal
            $('#modal-error-messages').modal();
            // Clear error stack
            errorStack = [];
            // Enable creds form again & clear page message area
            enableCredsForm(true);
            clearApiMessageArea();       
        });

    // Save creds
    saveCreds();

    return null;
}

/* SAVED CREDENTIALS */

// Save credentials (if flag set)
function saveCreds() {
    if (saveCredsFlag) {
        // Save credentials locally with property name to match those in awsCreds object
        for (var property in awsCreds) {
            localStorage.setItem(property, awsCreds[property]);    
        }        
    }
}

// Load saved credentials
function loadSavedCreds() {
    // Overwrite creds object
    awsCreds = {
        awsRegion: localStorage.getItem('awsRegion'),
        keyId: localStorage.getItem('keyId'),
        keySecret: localStorage.getItem('keySecret'),
        bucketName: localStorage.getItem('bucketName')
    }
    // Input data into form fields
    $('#access-key-id').val(awsCreds.keyId);
    $('#access-key-secret').val(awsCreds.keySecret);
    $('#aws-region-select').val(awsCreds.awsRegion);
    $('#bucket-name').val(awsCreds.bucketName);
}

// Clear saved credentials
function clearSavedCreds() {    
    localStorage.clear();
    // Check saved creds button state to disable
    checkSavedCredsButtonState();
}

// Check if saved credentials are available and enable button accordingly
function checkSavedCredsButtonState() {    
    if (localStorage.length > 0) {
        $('#buttons-load-local-saved :input').prop('disabled', false);
    } else {
        $('#buttons-load-local-saved :input').prop('disabled', true);
    }
}

/* DEMO CREDENTIALS */