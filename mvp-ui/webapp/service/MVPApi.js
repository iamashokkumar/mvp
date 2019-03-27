"use strict";

/** @class MVPApi */
sap.ui.define([
    "com/sap/build/leonardo/votingApp/service/ErrorHandler",
    "com/sap/build/leonardo/votingApp/service/BusyHandler"
], function(ErrorHandler, BusyHandler) {
    var csrfToken = "";

    function apiUrl() {
      //  var sTokenURL = "https://coe-cloud-tech-coecloudtech-innospace-mvp-ui.cfapps.sap.hana.ondemand.com";
     var sTokenURL= ""
        return sTokenURL;
    }

    var MVPApi = {
        get: function(resourceUrl, data) {
            return makeRequest("GET", resourceUrl, data);
        },

        post: function(resourceUrl, data) {
            return makeRequest("POST", resourceUrl, data);
        },

        put: function(resourceUrl, data) {
            return makeRequest("PUT", resourceUrl, data);
        },

        patch: function(resourceUrl, data) {
            return makeRequest("PATCH", resourceUrl, data);
        },

        delete: function(resourceUrl, data) {
            return makeRequest("DELETE", resourceUrl, data);
        },

        getUrl: function(resourceUrl) {
            return apiUrl() + resourceUrl;
        }
    };



    function stringify(data) {
        if (data && typeof data !== "string") {
            return JSON.stringify(data);
        }
        return "";
    }

    function makeRequest(method, resourceUrl, data) {
        var requestPromise = jQuery.when();

        if (method != "GET") {
            requestPromise = initializeCSRF();
        }

        return ErrorHandler.enableErrorMessages(requestPromise.then(function() {
            return jQuery.ajax({
                url: apiUrl() + resourceUrl,
                data: method === "GET" ? data : stringify(data),
                method: method,
                contentType: "application/json"
            });
        }));
    }

    function initializeCSRF() {
        var sessionInMS = 20 * 60 * 1000;
        setTimeout(function() {
            initializeCSRF();
        }, sessionInMS / 2);

        return fetchCSRFToken()
            .then(function(data, sStatus, jqXHR) {
                csrfToken = jqXHR.getResponseHeader("X-CSRF-Token") || true;;
                jQuery.ajaxPrefilter(function(options, originalOptions, _jqXHR) {
                    if (typeof csrfToken === "string") {
                        if (["POST", "PUT", "DELETE", "PATCH"].indexOf(options.type) !== -1) {
                            _jqXHR.setRequestHeader("X-CSRF-Token", csrfToken);
                        }
                    }
                });
                return "done";
            });
    }

    function fetchCSRFToken() {
        var requestPromise = jQuery.ajax({
            url: apiUrl() + "/",
            method: "GET",
            headers: {
                "X-CSRF-Token": "Fetch"
            },
            async: false
        });

        return ErrorHandler.enableErrorMessages(requestPromise, "erp_timeout");
    }

    return MVPApi;
}, true);