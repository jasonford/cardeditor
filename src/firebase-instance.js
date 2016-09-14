import firebase from 'firebase';
// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBLOxk9Bx2dp9QNZmim10WCtnH-SajeQVw",
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