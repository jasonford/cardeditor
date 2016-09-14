import firebase from 'firebase';
import credentials from './credentials';
// Initialize Firebase
firebase.initializeApp({
  apiKey: credentials.firebaseApiKey,
  authDomain: "fir-test-51aab.firebaseapp.com",
  databaseURL: "https://fir-test-51aab.firebaseio.com",
  storageBucket: "fir-test-51aab.appspot.com",
});

const Auth = firebase.auth();

Auth.onAuthStateChanged(function(authData) {
  if (Auth.currentUser == null) {
    var provider = new firebase.auth.GoogleAuthProvider();
    Auth.signInWithPopup(provider);
  }
});
//Auth.signOut();
