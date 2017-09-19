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
    if (!this.horario) return false;

    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    let horario = this.horario;

    let txt = horario.map((m) => {
      return m.dias.map((d) => {return dias[d]}).join(', ') + ': ' + m.modulo;
    });

    return txt.join('; ');
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
