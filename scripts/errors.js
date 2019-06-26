/* 
    THE S3 LOG ANALYSER
    ERROR MANAGEMENT
    BY DAVID BLAND
*/

/* SETUP */

function checkIfRegexSupported() {
    // Check if regex lookbehind assertion causes error
    try {
        let test = new RegExp('(?<= "[^"]*) (?=[^"]*" )');
    } 
    catch(e) {
        // If error then browser not supported so display an error message instead of content
        $('#app-container>div,section').hide();
        $('#app-container').append('<h2 class="text-center">Sorry, this browser is not supported, please use Chrome instead.<h2>');
    }
}

// Check regex compatibility immediately
checkIfRegexSupported();

/* ERROR DISPLAY & CONTROLS */

function displayErrors(flowPosition) {
    // Empty error modal & reset button
    $('#modal-error-message-area').empty();
    $('#button-error-modal-continue:input').prop('disabled', false);
    // Update the action of the go-back button
    if (flowPosition == 'list') {
        $('#button-error-modal-go-back').attr('onclick', "errorModalGoBack('list');");
    } else {
        $('#button-error-modal-go-back').attr('onclick', "errorModalGoBack('get');");
    }
    $('#button-error-modal-continue:input').prop('disabled', false);
    // Write errorStack details to modal message area
    errorStack.forEach(function(error) {
        if (error.severity == 'fatal') {
            // Show fatal errors & disable continue button
            $('#modal-error-message-area').append(`${error.type}<div class="alert alert-danger" role="alert">${error.errorMessage}</div>`);
            $('#button-error-modal-continue:input').prop('disabled', true);
        } else {
            // Assume warning
            $('#modal-error-message-area').append(`${error.type}<div class="alert alert-warning" role="alert">${error.errorMessage}</div>`);
        }
    });
    // Display error modal
    $('#modal-error-messages').modal();
};

function errorModalGoBack(flowPosition) {
    // Check if we are listing files of getting files
    if (flowPosition == "list") {
        resetPage();
    } else {
        changeFilters();
    }
}