var loginManager = new LoginManager();

function LoginManager() {
    this.login = null;
    this.isLoggedIn = null;
    this.getLogin = function() {
        this.login = appscore.dao.request("Creds");
        return this.login;
    };
    this.setLogin = function(data) {
        this.login = new Login(data);
    };
    this.setToken = function(token) {
        if (this.login == null) this.login = {};
        this.login.token = token;
    };
    this.validateLogin = function(callback) {
        var login = this.getLogin();
        var token = null;
        if (login) token = login.token
        if (token) {
            invokeHTTPService("GET", SERV_VALIDATE, {
                "token": token
            }, function(status, resultTable) {
                appscore.print.log("status :" + status);
                appscore.print.log("resultTable :" + JSON.stringify({
                    "data": resultTable
                }));
                if (resultTable["opstatus"].charAt(0) == "2") { // HTTP Success Status code starts with 2
                    var response = resultTable["main"];
                    appscore.print.log("result :" + response.result);
                    loginManager.isLoggedIn = true;
                } else {
                    appscore.print.error("Error", "Token is expired.");
                    loginManager.logout();
                }
                if (callback) callback();
            });
        } else {
            if (callback) callback();
        }
    };
    this.validateMember = function(callback) {
        invokeHTTPService("GET", SERV_AUTHENTICATE, JSON.stringify(this.login), function(status, resultTable) {
            appscore.print.start();
            appscore.print.log("resultTable :" + JSON.stringify({
                "data": resultTable
            }));
            if (resultTable["opstatus"].charAt(0) == "2") { // HTTP Success Status code starts with 2
                var response = resultTable["main"];
                appscore.print.log("token :" + response.token);
                loginManager.login.token = response.token;
                loginManager.isLoggedIn = true;
                if (callback) callback();
            } else {
                loginManager.isLoggedIn = false;
                appscore.print.error("errcode :" + resultTable["opstatus"] + " \n errmsg : " + resultTable["main"]);
            }
        });
    };
    this.saveLogin = function() {
        if (this.login == null) {
            appscore.dao.remove("Creds");
        } else {
            if (gRememberMe_Support) {
                appscore.dao.update("Creds", this.buildForStorage());
            }
        }
    };
    this.buildForStorage = function() {
        return {
            "email": this.login.email,
            "token": this.login.token
        };
    };
    this.logout = function() {
        appscore.dao.remove("Creds");
        this.login = null;
        loginManager.isLoggedIn = false;
    };
}