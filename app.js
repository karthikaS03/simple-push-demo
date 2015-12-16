'use strict';

var textEncoder = require('text-encoding').TextEncoder;
var request = require('request-promise');
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

const GCM_ENDPOINT = 'https://android.googleapis.com/gcm/send';
const GCM_AUTHORIZATION = 'AIzaSyBBh4ddPa96rQQNxqiq_qQj7sq1JdsNQUQ';

var app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/', express.static('./dist'));

function generateServerKeys() {
  var ellipticCurve = crypto.createECDH('prime256v1');
  ellipticCurve.generateKeys();
  return {
    public: ellipticCurve.getPublicKey('base64'),
    private: ellipticCurve.getPrivateKey('base64')
  };
}

function encryptMessage(payload, keys) {
  if (crypto.getCurves().indexOf('prime256v1') === -1) {
    // We need the P-256 Diffie Hellman Elliptic Curve to generate the server
    // certificates
    // secp256r1 === prime256v1
    console.log('We don\'t have the right Diffie Hellman curve to work.');
    return;
  }

  var webClientPublicKey = keys.p256dh;
  var webClientAuth = keys.auth;

  var serverKeys = generateServerKeys();
  console.log(serverKeys);
}

function sendPushMessage(endpoint, keys) {
  if (keys) {
    // TODO: Handle Encryption
    encryptMessage('Please Work.', keys);
  }

  var options = {
    uri: endpoint,
    method: 'POST',
    resolveWithFullResponse: true
  };
  if (endpoint.indexOf('https://android.googleapis.com/gcm/send') === 0) {
    // Proprietary GCM
    var endpointParts = endpoint.split('/');
    var gcmRegistrationId = endpointParts[endpointParts.length - 1];

    // Rename the request URI to not include the GCM registration ID
    options.uri = GCM_ENDPOINT;

    options.headers = {};
    options.headers['Content-Type'] = 'application/json';
    options.headers.Authorization = 'key=' + GCM_AUTHORIZATION;

    // You can use a body of:
    // registration_ids: [<gcmRegistrationId>, <gcmRegistrationId>...]
    // for multiple registrations.
    options.body = JSON.stringify({
      'to': gcmRegistrationId
    });
  }

  return request(options)
  .then((response) => {
    if (response.body.indexOf('Error') === 0) {
      // GCM has a wonderful habit of returning 'Error=' for some problems
      // while keeping the status code at 200. This catches that case
      throw new Error('Problem with GCM. "' + response + '"');
    }

    if (response.statusCode !== 200 &&
      response.statusCode !== 201) {
      throw new Error('Unexpected status code from endpoint. "' +
        response.statusCode + '"');
    }

    if (options.uri === GCM_ENDPOINT) {
      try {
        var responseObj = JSON.parse(response);
        if (responseObj.failures) {
          // This endpoint needs to be removing from your database

        }
      } catch (exception) {
        // NOOP
      }
    }

    return response;
  });
}

/**
 *
 * Massive h/t to Martin Thompson for his web-push-client code
 * https://github.com/martinthomson/webpush-client/
 *
 */
app.post('/send_web_push', function(req, res) {
  var endpoint = req.body.endpoint;
  var keys = req.body.keys;
  if (!endpoint) {
    // If there is no endpoint we can't send anything
    return res.status(404).json({success: false});
  }

  sendPushMessage(endpoint, keys)
  .then((responseText) => {
    console.log('Request success');
    // Check the response from GCM

    res.json({success: true});
  })
  .catch((err) => {
    console.log('Problem with request', err);
    res.json({success: false});
  });

  /**





  // Create a public, private key pair on the client
  // This should be done per web client (i.e. per subscription)

  console.log('public key', serverPublicKey);
  console.log('private key', serverPrivateKey);

  var sharedSecret = ellipticCurve.computeSecret(webClientPublicKey, 'base64');
  console.log('shared secret', sharedSecret);

// TODO: Store client endpoint, client p256dh, client auth, server public key,
// and server shared key

  const salt = crypto.randomBytes(16);
  console.log('Salt: ', salt);

  //
  // The following code makes the pseudo random key
  var authInfo = UTF8.encode('Content-Encoding: auth\0');
  var byteLength = 32;

  var internalPseudoRandomKey = crypto.createHmac('SHA256', webClientAuth)
    .update(sharedSecret).digest('base64');
  var prkHmac = crypto.createHmac('SHA256', internalPseudoRandomKey);
  var UTF8 = textEncoder('utf-8');
  var info = new Uint8Array(authInfo.byteLength + 1);
  info.set(new Uint8Array(authInfo));
  info.set(new Uint8Array([1]), authInfo.byteLength);

  var hkdf = prkHmac.update(info).digest('base64');
  var pseudoRandomKey = hkdf.slice(0, byteLength);
  console.log('hkdfValue: ', pseudoRandomKey);



  internalPseudoRandomKey = crypto.createHmac('SHA256', salt)
    .update(pseudoRandomKey).digest('base64');
  var nonceHmac = crypto.createHmac('SHA256', internalPseudoRandomKey);

  var context = new Uint8Array(5 + 1 + 2 + 65 + 2 + 65);
  context.set([0x50, 0x2D, 0x32, 0x35, 0x36], 0);

  context.set([0x00, self.recipientPublicKey_.byteLength], 6);
  context.set(new Uint8Array(self.recipientPublicKey_), 8);

  context.set([0x00, senderPublic.byteLength], 73);
  context.set(new Uint8Array(senderPublic), 75)
  var cekInfo = new Uint8Array(27 + 1 + context.byteLength);
  info = new Uint8Array(authInfo.byteLength + 1);
  info.set(new Uint8Array(authInfo));
  info.set(new Uint8Array([1]), authInfo.byteLength);

  hkdf = nonceHmac.update(info).digest('base64');
  var pseudoRandomKey = hkdf.slice(0, byteLength);**/
});

var server = app.listen(3000, () => {
  var port = server.address().port;
  console.log('Server is listening at http://localhost:%s', port);
});

// Maybe prime256v1
// Maybe secp256k1
// var serverKeys = crypto.diffieHellman.generateKeys('binary');
// console.log(crypto.getCurves());
