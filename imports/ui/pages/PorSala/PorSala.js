import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './PorSala.html';
import './EditaModulo.js';

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
  fecha() {
    return Session.get('fecha');
  },
  celdas() {

    let semana = Session.get('semana');
    let sala = Session.get('sala');
    let modulo = Session.get('modulo');

    let celdas = [];

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna = 0; columna < 7; columna += 1) { //7 días

        //Módulo vacío
        celdas[fila][columna] = [{
          sala: sala,
          fecha: semana[columna],
          modulo: modulo[fila],
          actividad: (modulo[fila] == 'almuerzo') ? '-' : 'Disponible',
          prioridad: 0,
          onClick: 'js-editaModulo'
        }];

        let reservas = Reservas.find({sala: sala, fecha: semana[columna], modulo: modulo[fila]}).fetch();

        for (let i in reservas) {
          celdas[fila][columna].push(reservas[i]);
        }

      }
    }

    return celdas;
  },
  showInfo() {
    if (this.length > 1) this.shift();

    return this;
  },
  diasSemana() {
    return Session.get('semana');
  },
  modulo(index) {
    let modulo = Session.get('textoModulo');
    return modulo[index];
  },
  color() {
    let clase = '';
    if (this.prioridad == 2) {
      clase = 'resCP';
    }
    else if (this.prioridad == 1) {
      clase = 'resSP';
    }

    if (this.cuenta > 1) {
      clase = 'superpuesta';
    }

    return clase;
  },
});

Template.PorSala.events({
  'change .js-salaSelect'(event) {
    Session.set('sala', event.target.value);
  },
  'change #fecha'(event) {
    updateFechas(event.target.value);
  },
  'click .js-editaModulo'() {
    console.log(this);
    Modal.show('EditaModulo', this);
  },
  'click .js-semanaAnt'() {
    cambiaFecha(-7);
  },
  'click .js-semanaSig'() {
    cambiaFecha(7);
  },
});
