(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*
 * Copyright (c) 2017 Allan Pichardo.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
var Pagefreezer = (function () {
    function Pagefreezer() {
    }
    Pagefreezer.diffPages = function (url1, url2, callback) {
        $.ajax({
            type: "GET",
            url: Pagefreezer.DIFF_API_URL,
            dataType: "json",
            jsonpCallback: callback,
            data: {
                old_url: url1,
                new_url: url2,
                as: "json",
            },
            success: callback,
            error: function (error) {
                console.log(error);
            },
            headers: { "x-api-key": "" }
        });
    };
    return Pagefreezer;
}());
Pagefreezer.DIFF_API_URL = "/diff";
Pagefreezer.API_KEY = "";
exports.Pagefreezer = Pagefreezer;

},{}],2:[function(require,module,exports){
/*
 * Copyright (c) 2017 Allan Pichardo.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
"use strict";
var Pagefreezer_1 = require("./Pagefreezer");
$(document).ready(function () {
    console.log("ready");
    toggleProgressbar(false);
    $('#submitButton').click(function () {
        toggleProgressbar(true);
        Pagefreezer_1.Pagefreezer.diffPages($('#url1').val(), $('#url2').val(), function (data, status) {
            $('#pageView').html(data.result.output.html);
            $('#pageView link[rel=stylesheet]').remove();
            toggleProgressbar(false);
        });
    });
    $('#toggle_view').click(toggleView);
    // Load Google api
    gapi.load('client', start);
    setPagination();
});
function setPagination() {
    var urlParams = new URLSearchParams(window.location.search);
    var index = parseInt(urlParams.get('index')) || 7;
    $('#prev_index').text("<-- Row " + (index - 1)).attr('href', "/diffbyindex?index=" + (index - 1));
    $('#next_index').text("Row " + (index + 1) + " -->").attr('href', "/diffbyindex?index=" + (index + 1));
}
function start() {
    $.getJSON('./config.json', function (data) {
        var API_KEY = data.api_key;
        // 2. Initialize the JavaScript client library.
        // !! Work around because gapi.client.init is not in types file 
        gapi.client.init({ 'apiKey': API_KEY });
        $('#diff_by_index').click(function () {
            var urlParams = new URLSearchParams(window.location.search);
            var index = parseInt(urlParams.get('index'));
            showPage(index);
        });
    })
        .fail(function () {
        console.error('Couldn\'t find api key');
    });
}
;
function showPage(row_index) {
    // link to test spreadsheet: https://docs.google.com/spreadsheets/d/17QA_C2-XhLefxZlRKw74KDY3VNstbPvK3IHWluDJMGQ/edit#gid=0
    var sheetID = '17QA_C2-XhLefxZlRKw74KDY3VNstbPvK3IHWluDJMGQ';
    var range = "A" + row_index + ":AG" + row_index;
    // Info on spreadsheets.values.get: https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/get
    var path = "https://sheets.googleapis.com/v4/spreadsheets/" + sheetID + "/values/" + range;
    gapi.client.request({
        'path': path,
    }).then(function (response) {
        // If we need to write to spreadsheets: 
        // 1) Get started: https://developers.google.com/sheets/api/quickstart/js
        // 2) Read/write docs: https://developers.google.com/sheets/api/guides/values
        var values = response.result.values;
        if (values) {
            var row_data = values[0];
            var old_url = row_data[8];
            var new_url = row_data[9];
            console.log(row_data);
            showDiffMetadata(row_data);
            runDiff(old_url, new_url);
        }
        else {
            $('#diff_title').text('No data found');
        }
    }, function (response) {
        console.error('Error: ' + response.result.error.message);
    });
}
function runDiff(old_url, new_url) {
    toggleProgressbar(true);
    Pagefreezer_1.Pagefreezer.diffPages(old_url, new_url, function (data, status) {
        console.log(data);
        loadIframe(data.result.output.html);
        toggleProgressbar(false);
    });
}
function loadIframe(html_embed) {
    // inject html
    var iframe = document.getElementById('pageView');
    iframe.setAttribute('srcdoc', html_embed);
    iframe.onload = function () {
        // inject diff css
        var frm = frames['pageView'].contentDocument;
        var otherhead = frm.getElementsByTagName("head")[0];
        var link = frm.createElement("link");
        link.setAttribute("rel", "stylesheet");
        link.setAttribute("type", "text/css");
        link.setAttribute("href", window.location.origin + "/css/diff.css");
        otherhead.appendChild(link);
        // set dimensions
        // iframe.setAttribute('width', (iframe as any).contentWindow.document.body.scrollWidth);
        iframe.setAttribute('height', iframe.contentWindow.document.body.scrollHeight);
    };
}
function showDiffMetadata(data) {
    var index = data[0] || 'No index';
    var title = data[5] || 'No title';
    var url = data[6] || 'No url';
    $('#diff_title').text(index + " - " + title + " : ");
    $('#diff_page_url').attr('href', "http://" + url).text(url);
    // Magic numbers! Match with column indexes from google spreadsheet.
    // Hack because we don't get any type of metadata, just an array
    for (var i = 15; i <= 32; i++) {
        $("#cbox" + i).prop('checked', data[i]);
    }
}
function toggleProgressbar(isVisible) {
    if (isVisible) {
        $('.progress').show();
    }
    else {
        $('.progress').hide();
    }
}
function toggleView(e) {
    e.preventDefault();
    $('.info-text').toggle();
    $('#inspectorView').toggleClass('short-view');
}

},{"./Pagefreezer":1}]},{},[2,1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvc2NyaXB0cy9QYWdlZnJlZXplci50cyIsInNyYy9zY3JpcHRzL21haW4udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7Ozs7Ozs7R0FRRzs7QUFFSCxvRUFBb0U7QUEyQnBFO0lBQUE7SUEwQkEsQ0FBQztJQXJCaUIscUJBQVMsR0FBdkIsVUFBd0IsSUFBWSxFQUFFLElBQVksRUFBRSxRQUFpRTtRQUVqSCxDQUFDLENBQUMsSUFBSSxDQUFDO1lBQ0gsSUFBSSxFQUFFLEtBQUs7WUFDWCxHQUFHLEVBQUUsV0FBVyxDQUFDLFlBQVk7WUFDN0IsUUFBUSxFQUFFLE1BQU07WUFDaEIsYUFBYSxFQUFFLFFBQVE7WUFDdkIsSUFBSSxFQUFFO2dCQUNGLE9BQU8sRUFBRSxJQUFJO2dCQUNiLE9BQU8sRUFBRSxJQUFJO2dCQUNiLEVBQUUsRUFBRSxNQUFNO2FBQ2I7WUFDRCxPQUFPLEVBQUUsUUFBUTtZQUNqQixLQUFLLEVBQUUsVUFBUyxLQUFLO2dCQUNqQixPQUFPLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDO1lBQ3ZCLENBQUM7WUFDRCxPQUFPLEVBQUUsRUFBQyxXQUFXLEVBQUUsRUFBRSxFQUFDO1NBQzdCLENBQUMsQ0FBQztJQUVQLENBQUM7SUFFTCxrQkFBQztBQUFELENBMUJBLEFBMEJDO0FBeEJpQix3QkFBWSxHQUFHLE9BQU8sQ0FBQztBQUN2QixtQkFBTyxHQUFHLEVBQUUsQ0FBQztBQUhsQixrQ0FBVzs7O0FDckN4Qjs7Ozs7Ozs7R0FRRzs7QUFFSCw2Q0FBMEM7QUFFMUMsQ0FBQyxDQUFFLFFBQVEsQ0FBRSxDQUFDLEtBQUssQ0FBQztJQUNoQixPQUFPLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO0lBQ3JCLGlCQUFpQixDQUFDLEtBQUssQ0FBQyxDQUFDO0lBRXpCLENBQUMsQ0FBQyxlQUFlLENBQUMsQ0FBQyxLQUFLLENBQUM7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YUFBYSxDQUFDLENBQUMsSUFBSSxDQUFJLEtBQUssV0FBTSxLQUFLLFFBQUssQ0FBQyxDQUFBO0lBQy9DLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsWUFBVSxHQUFLLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUE7SUFFM0Qsb0VBQW9FO0lBQ3BFLGdFQUFnRTtJQUNoRSxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxFQUFFLEVBQUUsQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1FBQzVCLENBQUMsQ0FBQyxVQUFRLENBQUcsQ0FBQyxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUE7SUFDM0MsQ0FBQztBQUNMLENBQUM7QUFFRCwyQkFBMkIsU0FBa0I7SUFDekMsRUFBRSxDQUFBLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQztRQUNYLENBQUMsQ0FBQyxXQUFXLENBQUMsQ0FBQyxJQUFJLEVBQUUsQ0FBQTtJQUN6QixDQUFDO0lBQUMsSUFBSSxDQUFDLENBQUM7UUFDSixDQUFDLENBQUMsV0FBVyxDQUFDLENBQUMsSUFBSSxFQUFFLENBQUE7SUFDekIsQ0FBQztBQUNMLENBQUM7QUFFRCxvQkFBb0IsQ0FBUTtJQUN4QixDQUFDLENBQUMsY0FBYyxFQUFFLENBQUM7SUFDbkIsQ0FBQyxDQUFDLFlBQVksQ0FBQyxDQUFDLE1BQU0sRUFBRSxDQUFDO0lBQ3pCLENBQUMsQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsQ0FBQztBQUNsRCxDQUFDIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qXG4gKiBDb3B5cmlnaHQgKGMpIDIwMTcgQWxsYW4gUGljaGFyZG8uXG4gKlxuICogUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGEgY29weSBvZiB0aGlzIHNvZnR3YXJlIGFuZCBhc3NvY2lhdGVkIGRvY3VtZW50YXRpb24gZmlsZXMgKHRoZSBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmcgd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLCBkaXN0cmlidXRlLCBzdWJsaWNlbnNlLCBhbmQvb3Igc2VsbCBjb3BpZXMgb2YgdGhlIFNvZnR3YXJlLCBhbmQgdG8gcGVybWl0IHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZSBmb2xsb3dpbmcgY29uZGl0aW9uczpcbiAqXG4gKiBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZCBpbiBhbGwgY29waWVzIG9yIHN1YnN0YW50aWFsIHBvcnRpb25zIG9mIHRoZSBTb2Z0d2FyZS5cbiAqXG4gKiBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0YgTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTiBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSwgREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEUgVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cbiAqL1xuXG4vLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vLi4vbm9kZV9tb2R1bGVzL0B0eXBlcy9qcXVlcnkvaW5kZXguZC50c1wiIC8+XG5cbmV4cG9ydCBpbnRlcmZhY2UgUGFnZWZyZWV6ZXJSZXNwb25zZSB7XG4gICAgc3RhdHVzOiBzdHJpbmc7XG4gICAgcmVzdWx0OiBSZXN1bHQ7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmVzdWx0IHtcbiAgICBzdGF0dXM6IHN0cmluZztcbiAgICBvdXRwdXQ6IE91dHB1dDtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBPdXRwdXQge1xuICAgIGh0bWw6IHN0cmluZztcbiAgICBkaWZmczogRGlmZjtcbiAgICByYXdIdG1sMjogc3RyaW5nO1xuICAgIHJhd0h0bWwxOiBzdHJpbmc7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgRGlmZiB7XG5cbiAgICBuZXc6IHN0cmluZztcbiAgICBvbGQ6IHN0cmluZztcbiAgICBjaGFuZ2U6IG51bWJlcjtcbiAgICBvZmZzZXQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGNsYXNzIFBhZ2VmcmVlemVyIHtcblxuICAgIHB1YmxpYyBzdGF0aWMgRElGRl9BUElfVVJMID0gXCIvZGlmZlwiO1xuICAgIHB1YmxpYyBzdGF0aWMgQVBJX0tFWSA9IFwiXCI7XG5cbiAgICBwdWJsaWMgc3RhdGljIGRpZmZQYWdlcyh1cmwxOiBzdHJpbmcsIHVybDI6IHN0cmluZywgY2FsbGJhY2s6IChyZXNwb25zZTogUGFnZWZyZWV6ZXJSZXNwb25zZSwgc3RhdHVzOiBzdHJpbmcpID0+IHZvaWQpIHtcblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogXCJHRVRcIixcbiAgICAgICAgICAgIHVybDogUGFnZWZyZWV6ZXIuRElGRl9BUElfVVJMLFxuICAgICAgICAgICAgZGF0YVR5cGU6IFwianNvblwiLFxuICAgICAgICAgICAganNvbnBDYWxsYmFjazogY2FsbGJhY2ssXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgb2xkX3VybDogdXJsMSxcbiAgICAgICAgICAgICAgICBuZXdfdXJsOiB1cmwyLFxuICAgICAgICAgICAgICAgIGFzOiBcImpzb25cIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdWNjZXNzOiBjYWxsYmFjayxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGVycm9yKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBoZWFkZXJzOiB7XCJ4LWFwaS1rZXlcIjogXCJcIn1cbiAgICAgICAgfSk7XG5cbiAgICB9XG5cbn0iLCIvKlxuICogQ29weXJpZ2h0IChjKSAyMDE3IEFsbGFuIFBpY2hhcmRvLlxuICpcbiAqIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGUgXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCwgZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdCBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGUgZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4gKlxuICogVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWQgaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4gKlxuICogVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTUyBPUiBJTVBMSUVELCBJTkNMVURJTkcgQlVUIE5PVCBMSU1JVEVEIFRPIFRIRSBXQVJSQU5USUVTIE9GIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU4gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sIERBTUFHRVMgT1IgT1RIRVIgTElBQklMSVRZLCBXSEVUSEVSIElOIEFOIEFDVElPTiBPRiBDT05UUkFDVCwgVE9SVCBPUiBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG4gKi9cblxuaW1wb3J0IHtQYWdlZnJlZXplcn0gZnJvbSBcIi4vUGFnZWZyZWV6ZXJcIjtcblxuJCggZG9jdW1lbnQgKS5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBjb25zb2xlLmxvZyhcInJlYWR5XCIpO1xuICAgIHRvZ2dsZVByb2dyZXNzYmFyKGZhbHNlKTtcblxuICAgICQoJyNzdWJtaXRCdXR0b24nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRvZ2dsZVByb2dyZXNzYmFyKHRydWUpO1xuICAgICAgICBQYWdlZnJlZXplci5kaWZmUGFnZXMoXG4gICAgICAgICAgICAkKCcjdXJsMScpLnZhbCgpLFxuICAgICAgICAgICAgJCgnI3VybDInKS52YWwoKSxcbiAgICAgICAgICAgIGZ1bmN0aW9uKGRhdGEsIHN0YXR1cykge1xuICAgICAgICAgICAgICAgICQoJyNwYWdlVmlldycpLmh0bWwoZGF0YS5yZXN1bHQub3V0cHV0Lmh0bWwpO1xuICAgICAgICAgICAgICAgICQoJyNwYWdlVmlldyBsaW5rW3JlbD1zdHlsZXNoZWV0XScpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHRvZ2dsZVByb2dyZXNzYmFyKGZhbHNlKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgJCgnI3RvZ2dsZV92aWV3JykuY2xpY2sodG9nZ2xlVmlldyk7XG5cbiAgICAvLyBMb2FkIEdvb2dsZSBhcGlcbiAgICBnYXBpLmxvYWQoJ2NsaWVudCcsIHN0YXJ0KTtcblxuICAgIHNldFBhZ2luYXRpb24oKVxufSlcblxuZnVuY3Rpb24gc2V0UGFnaW5hdGlvbigpIHtcbiAgICB2YXIgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICB2YXIgaW5kZXggPSBwYXJzZUludCh1cmxQYXJhbXMuZ2V0KCdpbmRleCcpKSB8fCA3O1xuICAgICQoJyNwcmV2X2luZGV4JykudGV4dChgPC0tIFJvdyAke2luZGV4LTF9YCkuYXR0cignaHJlZicsIGAvZGlmZmJ5aW5kZXg/aW5kZXg9JHtpbmRleC0xfWApO1xuICAgICQoJyNuZXh0X2luZGV4JykudGV4dChgUm93ICR7aW5kZXgrMX0gLS0+YCkuYXR0cignaHJlZicsIGAvZGlmZmJ5aW5kZXg/aW5kZXg9JHtpbmRleCsxfWApO1xufVxuXG5mdW5jdGlvbiBzdGFydCgpIHtcbiAgICAkLmdldEpTT04oJy4vY29uZmlnLmpzb24nLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICB2YXIgQVBJX0tFWSA9IGRhdGEuYXBpX2tleTtcbiAgICAgICAgLy8gMi4gSW5pdGlhbGl6ZSB0aGUgSmF2YVNjcmlwdCBjbGllbnQgbGlicmFyeS5cbiAgICAgICAgLy8gISEgV29yayBhcm91bmQgYmVjYXVzZSBnYXBpLmNsaWVudC5pbml0IGlzIG5vdCBpbiB0eXBlcyBmaWxlIFxuICAgICAgICAoZ2FwaSBhcyBhbnkpLmNsaWVudC5pbml0KHsgJ2FwaUtleSc6IEFQSV9LRVkgfSk7XG5cbiAgICAgICAgJCgnI2RpZmZfYnlfaW5kZXgnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgdXJsUGFyYW1zID0gbmV3IFVSTFNlYXJjaFBhcmFtcyh3aW5kb3cubG9jYXRpb24uc2VhcmNoKTtcbiAgICAgICAgICAgIHZhciBpbmRleCA9IHBhcnNlSW50KHVybFBhcmFtcy5nZXQoJ2luZGV4JykpO1xuICAgICAgICAgICAgc2hvd1BhZ2UoaW5kZXgpO1xuICAgICAgICB9KVxuICAgIH0pXG4gICAgLmZhaWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoJ0NvdWxkblxcJ3QgZmluZCBhcGkga2V5Jyk7XG4gICAgfSk7XG59O1xuXG5mdW5jdGlvbiBzaG93UGFnZShyb3dfaW5kZXg6IG51bWJlcikge1xuICAgIC8vIGxpbmsgdG8gdGVzdCBzcHJlYWRzaGVldDogaHR0cHM6Ly9kb2NzLmdvb2dsZS5jb20vc3ByZWFkc2hlZXRzL2QvMTdRQV9DMi1YaExlZnhabFJLdzc0S0RZM1ZOc3RiUHZLM0lIV2x1REpNR1EvZWRpdCNnaWQ9MFxuICAgIHZhciBzaGVldElEID0gJzE3UUFfQzItWGhMZWZ4WmxSS3c3NEtEWTNWTnN0YlB2SzNJSFdsdURKTUdRJ1xuICAgIHZhciByYW5nZSA9IGBBJHtyb3dfaW5kZXh9OkFHJHtyb3dfaW5kZXh9YFxuXG4gICAgLy8gSW5mbyBvbiBzcHJlYWRzaGVldHMudmFsdWVzLmdldDogaHR0cHM6Ly9kZXZlbG9wZXJzLmdvb2dsZS5jb20vc2hlZXRzL2FwaS9yZWZlcmVuY2UvcmVzdC92NC9zcHJlYWRzaGVldHMudmFsdWVzL2dldFxuICAgIHZhciBwYXRoID0gYGh0dHBzOi8vc2hlZXRzLmdvb2dsZWFwaXMuY29tL3Y0L3NwcmVhZHNoZWV0cy8ke3NoZWV0SUR9L3ZhbHVlcy8ke3JhbmdlfWA7XG4gICAgZ2FwaS5jbGllbnQucmVxdWVzdCh7XG4gICAgICAgICdwYXRoJzogcGF0aCxcbiAgICB9KS50aGVuKGZ1bmN0aW9uIChyZXNwb25zZTogYW55KSB7XG4gICAgICAgIC8vIElmIHdlIG5lZWQgdG8gd3JpdGUgdG8gc3ByZWFkc2hlZXRzOiBcbiAgICAgICAgLy8gMSkgR2V0IHN0YXJ0ZWQ6IGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3NoZWV0cy9hcGkvcXVpY2tzdGFydC9qc1xuICAgICAgICAvLyAyKSBSZWFkL3dyaXRlIGRvY3M6IGh0dHBzOi8vZGV2ZWxvcGVycy5nb29nbGUuY29tL3NoZWV0cy9hcGkvZ3VpZGVzL3ZhbHVlc1xuXG4gICAgICAgIHZhciB2YWx1ZXMgPSByZXNwb25zZS5yZXN1bHQudmFsdWVzO1xuICAgICAgICBpZiAodmFsdWVzKSB7XG4gICAgICAgICAgICB2YXIgcm93X2RhdGEgPSB2YWx1ZXNbMF07XG4gICAgICAgICAgICB2YXIgb2xkX3VybCA9IHJvd19kYXRhWzhdO1xuICAgICAgICAgICAgdmFyIG5ld191cmwgPSByb3dfZGF0YVs5XTtcblxuICAgICAgICAgICAgY29uc29sZS5sb2cocm93X2RhdGEpO1xuICAgICAgICAgICAgc2hvd0RpZmZNZXRhZGF0YShyb3dfZGF0YSk7XG4gICAgICAgICAgICBydW5EaWZmKG9sZF91cmwsIG5ld191cmwpO1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKCcjZGlmZl90aXRsZScpLnRleHQoJ05vIGRhdGEgZm91bmQnKVxuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24gKHJlc3BvbnNlOiBhbnkpIHtcbiAgICAgICAgY29uc29sZS5lcnJvcignRXJyb3I6ICcgKyByZXNwb25zZS5yZXN1bHQuZXJyb3IubWVzc2FnZSk7XG4gICAgfSk7XG59XG5cbmZ1bmN0aW9uIHJ1bkRpZmYob2xkX3VybDogc3RyaW5nLCBuZXdfdXJsOiBzdHJpbmcpIHtcbiAgICB0b2dnbGVQcm9ncmVzc2Jhcih0cnVlKTtcbiAgICBQYWdlZnJlZXplci5kaWZmUGFnZXMoXG4gICAgICAgIG9sZF91cmwsXG4gICAgICAgIG5ld191cmwsXG4gICAgICAgIGZ1bmN0aW9uKGRhdGEsIHN0YXR1cykge1xuICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSlcbiAgICAgICAgICAgIGxvYWRJZnJhbWUoZGF0YS5yZXN1bHQub3V0cHV0Lmh0bWwpO1xuICAgICAgICAgICAgdG9nZ2xlUHJvZ3Jlc3NiYXIoZmFsc2UpO1xuICAgIH0pO1xufVxuZnVuY3Rpb24gbG9hZElmcmFtZShodG1sX2VtYmVkOiBzdHJpbmcpIHtcbiAgICAvLyBpbmplY3QgaHRtbFxuICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncGFnZVZpZXcnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmNkb2MnLCBodG1sX2VtYmVkKTtcblxuICAgIGlmcmFtZS5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gaW5qZWN0IGRpZmYgY3NzXG4gICAgICAgIHZhciBmcm0gPSAoZnJhbWVzIGFzIGFueSlbJ3BhZ2VWaWV3J10uY29udGVudERvY3VtZW50O1xuICAgICAgICB2YXIgb3RoZXJoZWFkID0gZnJtLmdldEVsZW1lbnRzQnlUYWdOYW1lKFwiaGVhZFwiKVswXTtcbiAgICAgICAgdmFyIGxpbmsgPSBmcm0uY3JlYXRlRWxlbWVudChcImxpbmtcIik7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKFwicmVsXCIsIFwic3R5bGVzaGVldFwiKTtcbiAgICAgICAgbGluay5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwidGV4dC9jc3NcIik7XG4gICAgICAgIGxpbmsuc2V0QXR0cmlidXRlKFwiaHJlZlwiLCBgJHt3aW5kb3cubG9jYXRpb24ub3JpZ2lufS9jc3MvZGlmZi5jc3NgKTtcbiAgICAgICAgb3RoZXJoZWFkLmFwcGVuZENoaWxkKGxpbmspO1xuXG4gICAgICAgIC8vIHNldCBkaW1lbnNpb25zXG4gICAgICAgIC8vIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ3dpZHRoJywgKGlmcmFtZSBhcyBhbnkpLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxXaWR0aCk7XG4gICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2hlaWdodCcsKGlmcmFtZSBhcyBhbnkpLmNvbnRlbnRXaW5kb3cuZG9jdW1lbnQuYm9keS5zY3JvbGxIZWlnaHQpO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNob3dEaWZmTWV0YWRhdGEoZGF0YTogYW55KSB7XG4gICAgdmFyIGluZGV4ID0gZGF0YVswXSB8fCAnTm8gaW5kZXgnO1xuICAgIHZhciB0aXRsZSA9IGRhdGFbNV0gfHwgJ05vIHRpdGxlJztcbiAgICB2YXIgdXJsID0gZGF0YVs2XSB8fCAnTm8gdXJsJ1xuICAgICQoJyNkaWZmX3RpdGxlJykudGV4dChgJHtpbmRleH0gLSAke3RpdGxlfSA6IGApXG4gICAgJCgnI2RpZmZfcGFnZV91cmwnKS5hdHRyKCdocmVmJywgYGh0dHA6Ly8ke3VybH1gKS50ZXh0KHVybClcblxuICAgIC8vIE1hZ2ljIG51bWJlcnMhIE1hdGNoIHdpdGggY29sdW1uIGluZGV4ZXMgZnJvbSBnb29nbGUgc3ByZWFkc2hlZXQuXG4gICAgLy8gSGFjayBiZWNhdXNlIHdlIGRvbid0IGdldCBhbnkgdHlwZSBvZiBtZXRhZGF0YSwganVzdCBhbiBhcnJheVxuICAgIGZvciAodmFyIGkgPSAxNTsgaSA8PSAzMjsgaSsrKSB7XG4gICAgICAgICQoYCNjYm94JHtpfWApLnByb3AoJ2NoZWNrZWQnLCBkYXRhW2ldKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlUHJvZ3Jlc3NiYXIoaXNWaXNpYmxlOiBib29sZWFuKSB7XG4gICAgaWYoaXNWaXNpYmxlKSB7XG4gICAgICAgICQoJy5wcm9ncmVzcycpLnNob3coKVxuICAgIH0gZWxzZSB7XG4gICAgICAgICQoJy5wcm9ncmVzcycpLmhpZGUoKVxuICAgIH1cbn1cblxuZnVuY3Rpb24gdG9nZ2xlVmlldyhlOiBFdmVudCkge1xuICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAkKCcuaW5mby10ZXh0JykudG9nZ2xlKCk7XG4gICAgJCgnI2luc3BlY3RvclZpZXcnKS50b2dnbGVDbGFzcygnc2hvcnQtdmlldycpO1xufVxuXG4vLyBRdWljayB0eXBlIGZvciBVUkxTZWFyY2hQYXJhbXMgXG5kZWNsYXJlIGNsYXNzIFVSTFNlYXJjaFBhcmFtcyB7XG4gICAgLyoqIENvbnN0cnVjdG9yIHJldHVybmluZyBhIFVSTFNlYXJjaFBhcmFtcyBvYmplY3QuICovXG4gICAgY29uc3RydWN0b3IoaW5pdD86IHN0cmluZ3wgVVJMU2VhcmNoUGFyYW1zKTtcblxuICAgIC8qKiBSZXR1cm5zIHRoZSBmaXJzdCB2YWx1ZSBhc3NvY2lhdGVkIHRvIHRoZSBnaXZlbiBzZWFyY2ggcGFyYW1ldGVyLiAqL1xuICAgIGdldChuYW1lOiBzdHJpbmcpOiBzdHJpbmc7XG59XG4iXX0=
