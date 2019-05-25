/* 
    THE S3 LOG ANALYSER
    ERROR MANAGEMENT
    BY DAVID BLAND
*/

function displayErrors() {
    // Fill & display error modal
    $('#modal-error-message-area').empty();
    // Write errorStack details to modal message area
    errorStack.forEach(function(error) {            
        $('#modal-error-message-area').append(`${error.type}<div class="alert alert-danger" role="alert">${error.errorMessage}</div>`);
    });
    // Display error modal
    $('#modal-error-messages').modal();
};

function errorModalGoBack() {
    // Disable filter form and enable creds form
    enableCredsForm(true);
    enableFilterForm(false);
    // Clear message areas
    clearApiMessageArea();
    // Clear error stack
    errorStack = [];
}

function errorModalContinue() {
}