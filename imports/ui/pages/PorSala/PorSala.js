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
    let handle = Subs.subscribe('reservasSala', Session.get('sala'), semana[1], semana[7]);
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
  modulos() {
    return [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
  },
  celdas(fila) {

    //Si es la primera fila, retorna los días de la semana escogida
    if (fila == 0) {
      return Session.get('diasSemana');
    }

    //La primera celda de la fila indíca el número de módulo y las horas
    let textoModulo = Session.get('textoModulo')[fila];
    let modulo = Session.get('modulo')[fila];
    let celdas = [];
    celdas.push({texto: textoModulo, tipo: 'dark center smallText'});

    let semana = Session.get('semana');
    let sala = Session.get('sala');

    //Rellena la fila con reservas vacías
    for (let n = 1; n <= 7; n+=1) {
      celdas[n] = {
        sala: sala,
        fecha: semana[n],
        modulo: modulo,
        texto: (modulo == 'almuerzo') ? '-' : 'Disponible',
        prioridad: 0,
        cuenta: 0,
        tipo: 'modulo',
        onClick: 'js-editaModulo'
      }
    }

    //Busca en la base de datos reservas hechas en esa sala para la semana escogida en el módulo actual
    let reservas = Reservas.find({sala: sala, fecha: {$gte: semana[1], $lte: semana[7]}, modulo: modulo}).fetch();

    for (let i in reservas) {
      //Ve en qué día de la semana se hizo la reserva
      let dia = semana.indexOf(reservas[i].fecha);
      //Almacena la reserva encontrada en 'celdas' si tiene más prioridad que almacenada
      celdas[dia].cuenta += 1;
      if (reservas[i].prioridad > celdas[dia].prioridad) {
        celdas[dia].texto = reservas[i].actividad;
        celdas[dia].prioridad = reservas[i].prioridad;
      }
    }

    return celdas;

  }
});

Template.PorSala.events({
  'change .js-salaSelect'(event) {
    Session.set('sala', event.target.value);
  },
  'change #fecha'(event) {
    updateFechas(event.target.value);
  },
  'click .js-editaModulo'() {
    Modal.show('EditaModulo', this);
  }
});
