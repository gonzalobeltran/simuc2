import { Meteor } from 'meteor/meteor';

import { Reservas } from '/imports/api/collections/collections.js';

import './Reservas.html';
import './EliminarReserva.js';
import './Buscador.js';

Template.Reservas.onCreated(function() {
  this.autorun( () => {
    let semana = Session.get('semanaDesdeHoy');

    if (Meteor.user()) {
      //Revisa si el usuario está amonestado
      Meteor.call('revisaAmonestacion');

      let amonestado = Meteor.user().profile.amonestado;
      Session.set('amonestado', amonestado);

      //Se suscribe a los grupos de música de cámara (para ver si el usuario puede reservar salas grandes)
      Subs.subscribe('camara');

      //Se suscribe a las reservas del usuario en la semana activa
      let handle = Subs.subscribe('reservasUsuario', Session.get('usuario'), semana[0], semana[6]);
      Session.set('ready', handle.ready());
    }

  });
});

Template.Reservas.helpers({
  tablaReservas() { //Retorna la tabla con todas las reservas
    let semana = Session.get('semanaDesdeHoy');
    let modulos = Session.get('modulos');

    let usuario = '';
    if (Meteor.user())
      usuario = Meteor.user().profile.nombre;

    let celdas = [];

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna = 0; columna < 7; columna += 1) { //7 días

        //Módulo vacío
        celdas[fila][columna] = [{
          sala: (modulos[fila] == 'almuerzo') ? ' ' : '-',
          fecha: semana[columna],
          modulo: modulos[fila],
        }];

        let reservas = Reservas.find({fechas: semana[columna], modulos: modulos[fila], integrantes: usuario}).fetch();

        for (let i in reservas) {
          celdas[fila][columna][i] = reservas[i];
        }

      }
    }

    return celdas;
  },
  diasSemana() { //Retorna los días de la semana
    return Session.get('diasSemanaDesdeHoy');
  },
  modulo(index) { //Retorna los nombres y horarios de los módulos
    let modulo = Session.get('textoModulo');
    return modulo[index];
  },
  repite() { //Agrega un pin si es una reserva con repetición
    if (this.fechas && this.fechas.length > 1) return true;
    return false;
  },
  color() { //Cambia el color dependiendo de la reserva
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
  accion() {
    //Cambia la acción del click dependiendo de la fecha y el módulo
    //No puede reservar antes de 24 horas, en el módulo de almuerzo y los fines de semana
    if ((this.fecha <= Session.get('hoy')) ||
        (this.modulo == 'almuerzo')) return 'desactivado';
    if (this.fecha && (moment(this.fecha).weekday() > 4)) return 'desactivado';
    if (this.fechas && this.fechas.length > 1) return 'desactivado';

    return 'js-editaModulo';
  },
  amonestado() {
    return Session.get('amonestado');
  }
});

Template.Reservas.events({
  'click .js-editaModulo'() { //Muestra el modal para editar reservas
    if (this.sala == '-') {
      Modal.show('Buscador', this);
    } else {
      Modal.show('EliminarReserva', this);
    }
  },
});
