/* 
    THE S3 LOG ANALYSER
    ERROR MANAGEMENT
    BY DAVID BLAND
*/

function displayErrors() {
    //Empty error modal
    $('#modal-error-message-area').empty();
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

function errorModalGoBack() {
    // Re Enable creds form
    enableCredsForm(true);
    // Clear message areas
    clearApiMessageArea();
    clearLoadLogsMessageArea();
    // Clear error stack
    errorStack = [];
}