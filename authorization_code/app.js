/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */
var List = require("collections/list");
var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

// Firebase App (the core Firebase SDK) is always required and
// must be listed before other Firebase SDKs
// var firebase = require("firebase/app");
// var admin = require('firebase-admin');
// var serviceAccount = require('./secret.json');
// require('firebase/database');

// admin.initializeApp({
//     credential: admin.credential.applicationDefault(serviceAccount),
//     databaseURL: 'https://spotifymatcher-a573d-default-rtdb.firebaseio.com'
//   });

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
// const firebaseConfig = {
//   apiKey: "AIzaSyABkUwLUIxlZUXkL0HwTXoAbWbMGn7cFAA",
//   authDomain: "spotifymatcher-a573d.firebaseapp.com",
//   databaseURL: "https://spotifymatcher-a573d-default-rtdb.firebaseio.com",
//   projectId: "spotifymatcher-a573d",
//   storageBucket: "spotifymatcher-a573d.appspot.com",
//   messagingSenderId: "228346491237",
//   appId: "1:228346491237:web:7d3775978d65cce2b7b18c",
//   measurementId: "G-45TGDE33XR"
// };

// Initialize Firebase
// firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
// var database = firebase.database();
// firebase.database.enableLogging(true);
// var database = admin.database();

const admin = require('firebase-admin');
const serviceAccount = require('./secret.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();


const { link, promises } = require('fs');

var client_id = '9667fe86430a494381408e97322a3bcb'; // Your client id
var client_secret = '90433ff24ae8495c860b16131d6c826e'; // Your secret
var redirect_uri = 'http://b31ec453b49f.ngrok.io/callback'; // Your redirect uri


var userInfo = {
    genres: new List(),
    songIds: new List(),
    songNames: new List(),
    songImgs: new List(),
    artistIds: new List(),
    artistNames: new List(),
    artistImgs: new List(),
    userId: "",
    userName: "",
    href: "",
    userImage: "",
    userDance: 0.0,
    userAcoust: 0.0,
    userEnergy: 0.0,
    userValence: 0.0,
    userInstrument: 0.0,
    userSpeech: 0.0,
    country: ""

};

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */


var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
    .use(cors())
    .use(cookieParser());

app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email user-library-read user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
        querystring.stringify({
            response_type: 'code',
            client_id: client_id,
            scope: scope,
            redirect_uri: redirect_uri,
            state: state
        }));
});

app.get('/showinfo', function(req, res) {
    // var doc = db.collection('users').doc('ffrosteh').get();
    // if (!doc.exists) {
    //     console.log('No such document!');
    // } else {
    //     console.log('Document data:', doc.data());
    // }
    res.redirect('http://b31ec453b49f.ngrok.io/yourinfo.html');
    console.log("working");
});

app.get('/callback', function(req, res) {

    // your application requests refresh and access tokens
    // after checking the state parameter

    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
        res.redirect('/#' +
            querystring.stringify({
                error: 'state_mismatch'
            }));
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
                code: code,
                redirect_uri: redirect_uri,
                grant_type: 'authorization_code'
            },
            headers: {
                'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        request.post(authOptions, function(error, response, body) {
            if (!error && response.statusCode === 200) {

                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                var link = 'https://api.spotify.com/v1/me/';
                var options = {
                    url: link,
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };



                request.get(options, function(error, response, body) {
                    userInfo.userId = body.id
                    userInfo.href = body.external_urls.spotify
                    userInfo.userName = body.display_name
                        //userInfo.userImage = body.images[0].url
                    userInfo.country = body.country
                });


                options.url = 'https://api.spotify.com/v1/me/top/artists'

                request.get(options, function(error, response, body) {
                    body.items.forEach(function(item) {
                        //console.log(item.name)
                        //console.log(item.id)
                        //console.log(item.genres)

                        userInfo.artistNames.push(item.name)
                        userInfo.artistIds.push(item.id)
                        userInfo.artistImgs.push(item.images[0].url)

                        item.genres.forEach(function(genre) {
                            userInfo.genres.push(genre)
                        });

                    });

                    //console.log(userInfo.genres.toArray())
                    //console.log(userInfo.artistIds.toArray())
                });

                options.url = 'https://api.spotify.com/v1/me/top/tracks';

                let myFirstPromise = new Promise((resolve, reject) => {
                    // We call resolve(...) when what we were doing asynchronously was successful, and reject(...) when it failed.
                    // In reality, you will probably be using something like XHR or an HTML5 API.

                    request.get(options, function(error, response, body) {
                        body.items.forEach(function(item) {
                            // console.log(item.name)
                            // console.log(item.id)
                            userInfo.songNames.push(item.name)
                            userInfo.songIds.push(item.id)
                            // console.log(item)
                            userInfo.songImgs.push(item.album.images[0].url)
                        });
                        resolve("Success!") // Yay! Everything went well!
                    });
                })

                myFirstPromise.then((successMessage) => {
                    var nOfSongs = 0;
                    let mySecondPromise = new Promise((resolve, reject) => {
                        let promises = userInfo.songIds.map(function(songID) {
                            nOfSongs++;
                            //console.log(songID)
                            options.url = 'https://api.spotify.com/v1/audio-features/' + songID;
                            let reqPromise = new Promise((resolve, reject) => {
                                request.get(options, function(error, response, body) {
                                    // console.log(body);
                                    userInfo.userAcoust += body.acousticness
                                    userInfo.userDance += body.danceability
                                    userInfo.userEnergy += body.energy
                                    userInfo.userSpeech += body.speechiness
                                    userInfo.userInstrument += body.instrumentalness
                                    userInfo.userValence += body.valence
                                    resolve("Success!")
                                });
                            });
                            return reqPromise
                        });
                        Promise.all(promises).then(() => resolve("Success"))
                    });

                    mySecondPromise.then((successMessage) => {
                        userInfo.userAcoust /= nOfSongs
                        userInfo.userDance /= nOfSongs
                        userInfo.userEnergy /= nOfSongs
                        userInfo.userSpeech /= nOfSongs
                        userInfo.userInstrument /= nOfSongs
                        userInfo.userValence /= nOfSongs

                        // console.log(userInfo)

                        console.log("testing 1")
                            //const docRef = db.collection('users').doc('alovelace');

                        db.collection('users').doc(userInfo.userId).set({
                            genres: userInfo.genres.toArray(),
                            songIds: userInfo.songIds.toArray(),
                            songNames: userInfo.songNames.toArray(),
                            songImgs: userInfo.songImgs.toArray(),
                            artistIds: userInfo.artistIds.toArray(),
                            artistNames: userInfo.artistNames.toArray(),
                            artistImgs: userInfo.artistImgs.toArray(),
                            userId: userInfo.userId,
                            userName: userInfo.userName,
                            href: userInfo.href,
                            userImage: userInfo.userImage,
                            userDance: userInfo.userDance,
                            userAcoust: userInfo.userAcoust,
                            userEnergy: userInfo.userEnergy,
                            userValence: userInfo.userValence,
                            userInstrument: userInfo.userInstrument,
                            userSpeech: userInfo.userSpeech,
                            country: userInfo.country
                        });
                        console.log("testing 2")
                    });


                    // successMessage is whatever we passed in the resolve(...) function above.
                    // It doesn't have to be a string, but if it is only a succeed message, it probably will be.
                    //console.log("Yay! " + successMessage)
                });

                // we can also pass the token to the browser to make requests from there
                res.redirect('/#' +
                    querystring.stringify({
                        access_token: access_token,
                        refresh_token: refresh_token
                    }));
            } else {
                res.redirect('/#' +
                    querystring.stringify({
                        error: 'invalid_token'
                    }));
            }
        });
    }
});

app.get('/refresh_token', function(req, res) {

    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
                'access_token': access_token
            });
        }
    });
});

console.log('Listening on 8888');
app.listen(8888);