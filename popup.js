function signIn() {
    chrome.identity.getAuthToken({interactive: true}, function(token) {
    // Utilisez le jeton pour accéder aux données Google Agenda de l'utilisateur.
    });
    }
    document.addEventListener('DOMContentLoaded', function() {
    var loginButton = document.getElementById('login-button');
    loginButton.addEventListener('click', signIn);
    });