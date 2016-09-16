import React, { Component } from 'react';
import firebase from 'firebase';
import ReactFireMixin from 'reactfire';
import './App.css';
import $ from 'jquery';
import {sanitize} from 'dompurify';
import katex from 'katex';
import "!style!css!katex/dist/katex.min.css";
import "./katex.css";

const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();
const uploadsPrefix = '/uploads';

function triggerUpload(callback) {
  let input = document.createElement('input');
  input.type = "file";
  input.addEventListener('change', function (event) {
    callback(input.files[0]);
  });
  setTimeout(()=>{$(input).click();});
}

//  based on "label(...content...)" parse out "...content..." and replace label() form with
//  the result of the function given
function replaceFunction (source, label, fn) {
  source = source || '';
  let startIndex = source.indexOf(label + '(');
  let index = startIndex;
  let toClose = 0;
  while (index > -1) {
    index += 1;
    if (index >= source.length) return source;
    else if (source[index] === '(') toClose += 1;
    else if (source[index] === ')') {
      toClose -= 1;
      if (toClose === 0) {
        let inputStart = startIndex+label.length+1;
        let input = source.slice(inputStart, index);
        try {
          input = fn(input);
        }
        catch (parseError) {
          input = parseError.toString();
        }
        source = source.slice(0, startIndex)
               + input
               + source.slice(index+1);
        startIndex = source.indexOf(label + '(');
        index = startIndex;
      }
    }
  }
  return source
}

class Card extends Component {
  constructor () {
    super();
    this.state = {};
  }
  update (field) {
    return (event) => { 
      const value = $(event.target).val();
      let update = {};
      let url = uploadsPrefix + '/' + auth.currentUser.uid + '/' + Date.now();
      let ref = storage.ref(url);
      let that = this;

      //  TODO: show upload progress and allow multiple uploads...
      update[field] = replaceFunction(value, 'upload', () => {return 'UPLOADING';});
      //  trigger upload and create an update
      if (update[field] !== value) {
        triggerUpload((file)=> {
          let metadata = {'contentType': file.type};
          ref.put(file, metadata).then(function () {
            //  TODO: make short link to file if possible
            ref.getDownloadURL().then((downloadURL) => {
              update[field] = update[field].replace('UPLOADING', downloadURL);
              //  put in eventual value
              db.ref('cards/'+that[".key"]).update(update);
            });
          });
        });
      }
      db.ref('cards/'+this[".key"]).update(update);
    };
  }
  safeMarkup (field) {
    let markup = this.props[field];

    //  render katex fields
    markup = replaceFunction(markup, 'katex', function (input) {
      return katex.renderToString(input, {
        displayMode : true,
        throwOnError : false
      });
    });
    //  insert image
    markup = replaceFunction(markup, 'image', function (input) {
      return '<img style="width:100%" src="'+input+'">';
    });
    //  sanitize as final step
    markup = sanitize(markup);
    return {__html : markup};
  }
  toggleForm () {
    let that = this;
    return () => {
      that.setState({open:!that.state.open});
    }
  }
  render() {
    let form;
    if (this.state && this.state.open) {
      form = <CardForm {...this.props} update={this.update}/>
    }
    return (
      <div className="CardDisplay">
        <div className="Card"
             onClick={this.toggleForm()}>
          <div className="CardHeader">
            <span className="CardID">{this.props.id}</span>
            {this.props.title}
          </div>
          <div className="CardImage">
            <div dangerouslySetInnerHTML={this.safeMarkup("image")}></div>
          </div>
          <div>
            <div className="CardSetInfo">
              <span>{this.props.class}</span>
              <span>{this.props.type}</span>
            </div>
          </div>
          <div className="CardText">
            <div dangerouslySetInnerHTML={this.safeMarkup("description")}></div>
            <div className="CardPrerequisites">
              {this.props.prerequsites}
            </div>
          </div>
          <div>
            <div className="CardAuthorization">
              <span className="CardLearner">Learner</span>
              <span className="CardTeacher">Teacher</span>
              <span className="CardDate">/&nbsp;&nbsp;&nbsp;/&nbsp;&nbsp;&nbsp;</span>
            </div>
          </div>
        </div>
        {form}
      </div>
    );
  }
}

class CardForm extends Component {
  constructor () {
    super();
    this.state = {};
  }
  remove () {
    let that = this;
    return function () {
      if (that.state.tryingToRemove) {
        setTimeout(() => {
          db.ref('cards/'+that.props[".key"]).remove();
        });
      }
      that.setState({tryingToRemove:!that.state.tryingToRemove});
    }
  }
  cancelRemove () {
    let that = this;
    return () => {
      that.setState({tryingToRemove:false});
    }
  }
  render () {
    let removeButtons = <button onClick={this.remove()}>remove</button>
    if (this.state.tryingToRemove) {
      removeButtons = (
        <div>
          <button onClick={this.cancelRemove()}>cancel</button>
          <button onClick={this.remove()}>sure you want to remove this card?</button>
        </div>
      );
    }
    return (<div className="CardForm">
      <input
        className="CardFormTitle"
        placeholder="title"
        value={this.props.title}
        onChange={this.props.update("title")} />
      <input
        placeholder="ID"
        value={this.props.id}
        onChange={this.props.update("id")} />
      <textarea
        placeholder="image"
        value={this.props.image}
        onChange={this.props.update("image")}></textarea>
      <input
        placeholder="class name"
        value={this.props.class}
        onChange={this.props.update("class")}/>
      <input
        placeholder="card type"
        value={this.props.type}
        onChange={this.props.update("type")}/>
      <textarea
        placeholder="description"
        value={this.props.description}
        onChange={this.props.update("description")}></textarea>
      <input
        placeholder="prerequsites"
        value={this.props.prerequsites}
        onChange={this.props.update("prerequsites")}/>
      <div className="CardFormOptions">
        {removeButtons}
      </div>
    </div>);
  }
}

const App = React.createClass({
  mixins : [ReactFireMixin],
  componentWillMount() {
    var ref = firebase.database().ref("cards");
    this.bindAsArray(ref, "cards");
  },
  onAddCard() {
    this.firebaseRefs.cards.push({title:""});
  },
  render () {
    var cards = this.state.cards.map((e, i)=>{return <Card {...e} key={e['.key']}/>});
    return (
      <div className="App">
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
