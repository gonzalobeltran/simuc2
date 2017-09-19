import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Camara } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './Camara.html';
import './EditaGrupo.js';

Template.Camara.onCreated(function() {
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a los grupos de cámara
    let handle = Subs.subscribe('camara');
    Session.set('ready', handle.ready());
  });
});

Template.Camara.helpers({
  grupos() {
    return Camara.find({}, {sort:{profesor:1}});
  },
  txtDia() {
    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'];
    return dias[this.horario.dias];
  }
});

Template.Camara.events({
  'click .js-creaGrupo'() {
    Modal.show('EditaGrupo', '');
  },
  'click .js-editaGrupo'() {
    Modal.show('EditaGrupo', this);
  }
});
