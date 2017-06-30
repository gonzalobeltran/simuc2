import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Camara } from '/imports/api/collections/collections.js';

import './Camara.html';
import './EditaGrupo.js';

Template.Camara.onCreated(function() {
  this.autorun( () => {
    let handle = Subs.subscribe('camara');
    Session.set('ready', handle.ready());
  });
});

Template.Camara.helpers({
  grupos() {
    return Camara.find({});
  },
});

Template.Camara.events({
  'click .js-creaGrupo'() {
    Modal.show('EditaGrupo', '');
  },
  'click .js-editaGrupo'() {
    Modal.show('EditaGrupo', this);
  }
});
