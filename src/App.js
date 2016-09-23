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
    this.setState({deckName : val});
    //  change back to default
    $(e.target).val('view another deck');
  },
  render () {
    let decks = [];
    if (this.state && this.state.decks) {
      // TODO: remove ".key" field from decks object
      decks = Object.keys(this.state.decks);
      decks.splice(decks.indexOf('.key'), 1);
      decks = decks.map((e, i)=>{
        let props = {value:e, key:e};
        return <option {...props}>{e}</option>;
      });
    }
    let deck = <Deck deckName={this.state.deckName} key={this.state.deckName}/>;
    return (
      <div className="App">
        <h1 className="DeckTitle">
          {this.state.deckName}
        </h1>
        <div className="DeckToolbar">
          <select
            className="DeckSelector"
            onChange={this.viewDeck}
            defaultValue="view another deck">
            <option value="view another deck">view another deck</option>
            {decks}
          </select>
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
