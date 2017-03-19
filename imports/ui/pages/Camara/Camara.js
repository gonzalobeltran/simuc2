import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Camara } from '/imports/api/collections/collections.js';

import './Camara.html';
import './EditaGrupo.js';

Template.Camara.onCreated(function() {
  // Obtiene la lista de usuarios y la guarda en una variable de sesión
  Meteor.call('listaUsuarios', (err,res) => {
    if (!err) Session.set('usuarios', res);
  });

  Session.set('editaGrupo', '');

  this.autorun( () => {
    let handle = Subs.subscribe('camara');
    Session.set('ready', handle.ready());
  });
});

Template.Camara.helpers({
  grupos() {
    return Camara.find({});
  },
  editaGrupo() {
    return Session.get('editaGrupo');
  },
  ready(){
    return Session.get('ready');
  },
});

Template.Camara.events({
  'click .js-editaGrupo'() {
    Session.set('editaGrupo', this);
  }
});
