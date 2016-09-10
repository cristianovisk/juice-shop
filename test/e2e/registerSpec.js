'use strict';

describe('/#/register', function () {

    var email, password, passwordRepeat, registerButton;

    protractor.beforeEach.login({email: 'admin@juice-sh.op', password: '***REMOVED***'});

    beforeEach(function () {
        browser.get('/#/register');
        email = element(by.model('user.email'));
        password = element(by.model('user.password'));
        passwordRepeat = element(by.model('user.passwordRepeat'));
        registerButton = element(by.id('registerButton'));
    });


    xit('should perform client side validation of email address', function () {
    });


    describe('challenge "xss2"', function () {

        it('should be possible to bypass validation by directly using Rest API', function () {
            var EC = protractor.ExpectedConditions;

            browser.executeScript('var $http = angular.injector([\'juiceShop\']).get(\'$http\'); $http.post(\'/api/Users\', {email: \'<script>alert("XSS2")</script>\', password: \'xss\'});');

            browser.get('/#/administration');
            browser.wait(EC.alertIsPresent(), 5000, "'XSS2' alert is not present");
            browser.switchTo().alert().then(function (alert) {
                expect(alert.getText()).toEqual('XSS2');
                alert.accept();

                browser.ignoreSynchronization = true;
                browser.executeScript('var $http = angular.injector([\'juiceShop\']).get(\'$http\'); $http.put(\'/api/Users/4\', {email: \'alert disabled\'});');
                browser.driver.sleep(1000);
                browser.ignoreSynchronization = false;
            });

        });

        protractor.expect.challengeSolved({challenge: 'xss2'});

    });

});
