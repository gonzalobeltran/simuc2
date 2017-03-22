import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Salas } from '/imports/api/collections/collections.js';

import './Salas.html';
import './EditaSala.js';

Template.Salas.onCreated(function(){

  Session.set('estaSala', null);

  this.autorun( () => {
    let handle = Subs.subscribe('salas');
    Session.set('ready', handle.ready());
  });
});

Template.Salas.helpers({
  salas() {
    return Salas.find({}, {sort: {nombre: 1}});
  },
  estaSala() {
    return Session.get('estaSala');
  },
});

Template.Salas.events({
  'click .js-creaSala'() {
    Session.set('estaSala', '');
  },
  'click .js-editaSala'() {
    Session.set('estaSala', this);
  }
});
