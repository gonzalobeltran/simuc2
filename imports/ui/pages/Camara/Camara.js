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
  txtHorario() {
    let horario = this.horario;
    if (!horario) return false;

    let hayHorario = horario.reduce((a,b) => a+b);
    if (!hayHorario) return ('Sin sala asignada');

    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    let modulos = Session.get('modulos');

    for (let dia in horario) {
      if (horario[dia]) txt = this.sala + ' - ' + dias[dia] + ': ' + modulos[Math.log2(horario[dia])];
    }

    return txt;
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
