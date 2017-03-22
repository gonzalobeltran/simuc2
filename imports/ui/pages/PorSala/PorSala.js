import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './PorSala.html';
import './Reserva.js';

Template.PorSala.onCreated(function(){
  // Obtiene la lista de usuarios y la guarda en una variable de sesión
  Meteor.call('listaUsuarios', (err,res) => {
    if (!err) Session.set('usuarios', res);
  });

  Session.set('soloFijas', false);

  this.autorun( () => {
    let semana = Session.get('semana');

    Subs.subscribe('salas');
    let handle = Subs.subscribe('reservasSala', Session.get('sala'), semana[0], semana[6]);
    Session.set('ready', handle.ready());

  });
});

Template.PorSala.rendered = function() {
  $('#fecha').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es"
  });
}

Template.PorSala.helpers({
  salas() {
    let salas = Salas.find({}, {sort: {nombre: 1}}).map((d) => {return d.nombre});
    if (!Session.get('sala')) Session.set('sala', salas[0]);
    return salas;
  },
  isSelected(sala) {
    if (sala == Session.get('sala')) return 'selected';
  },
});

Template.PorSala.events({
  'change .js-salaSelect'(event) {
    Session.set('sala', event.target.value);
  }
});
