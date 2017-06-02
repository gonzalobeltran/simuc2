import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Salas } from '/imports/api/collections/collections.js';

import './Salas.html';
import './EditaSala.js';

Template.Salas.onCreated(function(){
  this.autorun( () => {
    let handle = Subs.subscribe('salas');
    Session.set('ready', handle.ready());
  });
});

Template.Salas.helpers({
  salas() {
    return Salas.find({}, {sort: {orden: 1}});
  },
});

Template.Salas.events({
  'click .js-creaSala'() {
    Modal.show('EditaSala', '');
  },
  'click .js-editaSala'() {
    Modal.show('EditaSala', this);
  }
});
