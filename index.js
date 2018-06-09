var fs = require('fs');
var https = require('https');
var express = require("express");
var bodyParser = require("body-parser");
var api = require("./private/credentials.js");

var serverConfig = {
    key: fs.readFileSync('./server.key'),
    cert: fs.readFileSync('./server.crt'),
};

var subscriptionKey = api.key;
var host = 'api.cognitive.microsofttranslator.com';
var path = '/translate?api-version=3.0';
var params = '&to=en&to=fr&to=it';
var text = '';

var translator = false;

var app = express();
var HTTPS_PORT = 443;

var httpsServer = https.createServer(serverConfig, app).listen(HTTPS_PORT);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
        extended: true
        }));

var lang = "es-ES";

var get_guid = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

app.get(/^(.+)$/, function(req, res){ 
    switch(req.params[0]) {
        case '/prueba.html':
            res.send("prueba ok");
            break;
	case '/lang':
	    res.send(lang);
	    break;
    default: res.sendFile( __dirname + "/index.html"); 
    }
 });

app.post(/^(.+)$/, function(req, res){
    switch(req.params[0]) {
        case '/chatbot':
	  if (!translator){
		var received = (req.body.message).toLowerCase();
		console.log(received);
		if (received.includes("hola")) {
			res.send("Hola. ¿Como te puedo ayudar?");
		} else if (received.includes("temperatura") && received.includes("living")) {
		 	res.send("24 grados");
		} else if (received.includes("modo") && received.includes("traductor")) {
		 	translator = true;	
			lang = "en-EN";
			res.send("Modo traductor activado");
		} else {
			res.send("Perdón, no entiendo");
			}
		} else {
			var response_handler = function (response) {
			    var body = '';
			    response.on ('data', function (d) {
			    body += d;
			    });
		    response.on ('end', function () {
		    var json = JSON.stringify(JSON.parse(body), null, 4);
	            var raw = [];
	            raw = JSON.parse(json);
		    console.log(raw[0].translations[0].text);
		    res.send(raw[0].translations[0].text);
			    });
		    response.on ('error', function (e) {
		        console.log ('Error: ' + e.message);
			    });
			};

		var Translate = function (content) {
		    var request_params = {
		       method : 'POST',
		        hostname : host,
	        path : path + params,
        	headers : {
	            'Content-Type' : 'application/json',
	            'Ocp-Apim-Subscription-Key' : subscriptionKey,
	            'X-ClientTraceId' : get_guid (),
	        }
	    };

	    var req = https.request (request_params, response_handler);
	    req.write (content);
	    req.end ();
		}
	Translate(JSON.stringify ([{'Text' : (req.body.message).toLowerCase()}]));
		}
            break;
    default: res.send("¿Podrías explicarlo de otra manera?"); 
    }
 });
console.log('Servidor corriendo');
