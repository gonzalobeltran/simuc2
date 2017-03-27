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
  celdas() {

    let semana = Session.get('semana');
    let sala = Session.get('sala');
    let modulo = Session.get('modulo');
    let textoModulo = Session.get('textoModulo');
    let celdas = [];

    for (let fila = 0; fila < 10; fila += 1) { //10 filas: cabecera + 9 módulos
      celdas[fila] = [];
      for (let columna = 0; columna < 8; columna += 1) { //8 columnas: módulo + 7 días

        if (fila == 0) { //Primera fila: muestra las fechas

          celdas[fila][columna] = Session.get('diasSemana')[columna];

        } else if (columna == 0) { //Primera columna: muestra los horarios de los módulos

          celdas[fila][columna] = textoModulo[fila];

        } else {

          //Módulo vacío
          celdas[fila][columna] = {
            sala: sala,
            fecha: semana[columna],
            modulo: modulo[fila],
            texto: (modulo[fila] == 'almuerzo') ? '-' : 'Disponible',
            prioridad: 0,
            cuenta: 0,
            tipo: 'modulo',
            onClick: 'js-editaModulo'
          }

          let reservas = Reservas.find({sala: sala, fecha: semana[columna], modulo: modulo[fila] }).fetch();

          for (let i in reservas) {
            celdas[fila][columna].cuenta += 1;
            if (reservas[i].prioridad > celdas[fila][columna].prioridad) {
              celdas[fila][columna].texto = reservas[i].actividad;
              celdas[fila][columna].prioridad = reservas[i].prioridad;
            }
          }
        }
      }
    }

    return celdas;
  },
  color(prioridad, texto) {
    if (prioridad == 3) return 'resCP';
    if (prioridad == 1) return 'resSP';
    if (prioridad ==2) {
      let txt = texto.slice(0,3);
      switch(txt) {
        case 'MUC':
        case 'CE ':
          return 'curso';
          break;

        case 'SDA':
          return 'sda';
          break;

        case 'Aud':
          return 'audicion';
          break;

        case 'Cor':
          return 'correp';
          break;
      }
      return 'resFija';
    }
  },
  masDeUna() {
    return this.cuenta > 1;
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
  },
  'click .js-semanaAnt'() {
    cambiaFecha(-7);
  },
  'click .js-semanaSig'() {
    cambiaFecha(7);
  },
});
