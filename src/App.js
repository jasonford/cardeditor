import React from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import './App.css';
import $ from 'jquery';
import compare from "./compare.js";
import {Card} from "./Card.js"

const App = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    //  get reference to all deck names
    var ref = firebase.database().ref("/");
    //  Choose first deck name
    this.state = {
      deckName : "cards"
    };
    this.bindAsObject(ref, "decks");
  },
  viewDeck(e) {
    var val = $(e.target).val();
    if (val === '/createNewDeck/') {
      this.setState({creatingDeck : true});
    }
    else {
      this.setState({deckName : val});
      $(e.target).val(val);
    }
  },
  createDeck(e) {
    if (e.key === 'Enter') {
      var val = $(e.target).val();
      if (val) {
        this.setState({deckName : val});
      }
      this.setState({creatingDeck : false});
    }
  },
  render () {
    let decks = [];
    if (this.state && this.state.decks) {
      // TODO: remove ".key" field from decks object
      decks = Object.keys(this.state.decks);
      if (decks.indexOf(this.state.deckName) == -1) {
        decks.push(this.state.deckName);
      }
      decks.splice(decks.indexOf('.key'), 1);
      decks = decks.map((e, i)=>{
        let props = {value:e, key:e};
        return <option {...props}>{e}</option>;
      });
    }
    let deck = <Deck deckName={this.state.deckName} key={this.state.deckName}/>;
    let deckSelector = 
        <select
          className="DeckSelector"
          onChange={this.viewDeck}
          value={this.state.deckName}>
          {decks}
          <option value="/createNewDeck/">Create a New Deck</option>
        </select>;
    if (this.state && this.state.creatingDeck) {
      deckSelector =
          <input className="NewDeckNameInput"
                 onKeyPress={this.createDeck}
                 placeholder="new deck name"
                 autoFocus />
    }
    return (
      <div className="App">
        <div className="DeckToolbar">
          {deckSelector}
        </div>
        {deck}
      </div>
    );
  }
});

const Deck = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    var ref = firebase.database().ref(this.props.deckName);
    this.bindAsArray(ref, "deck");
  },
  onAddCard() {
    this.firebaseRefs.deck.push({title:""});
  },
  render () {
    let cardData = this.state.deck.sort(function (a, b) {
      if (!a.id) return 1;
      else if (!b.id) return -1;
      else if (a.id === b.id) return a.title < b.title;
      else return compare.versions(a.id, b.id);
    });
    let cards = cardData.map((e, i)=>{return <Card {...e} deckName={this.props.deckName} key={e['.key']}/>});
    return (
      <div className="Deck">
        {cards}
        <div
          onClick={this.onAddCard}
          className="CardAdder">
          &#43;
        </div>
      </div>
    );
  }
});

export default App;
