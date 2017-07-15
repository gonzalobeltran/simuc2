import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Reservas } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';

import './Display.html';

Template.Display.onCreated(function(){
  this.autorun( () => {
    //Se suscribe a la lista de salas
    Subs.subscribe('salas');
    //Se suscribe a las reservas de la sala activa y la semana activa, de lunes a domingo
    let handle = Subs.subscribe('reservasDia', Session.get('fecha'));
    Session.set('ready', handle.ready());

    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    Session.set('salas', salas);

  });
});

//Fija el intervalo de actualización cada 15 segundos, cambiando las salas que se muestran
Template.Display.rendered = function() {
  intervalo = Meteor.setInterval(function() {
    let salas = Session.get('salas');
    let first = salas.shift();
    salas.push(first);
    Session.set('salas', salas);
  }, 3000);
}

Template.Display.helpers({
  salas() { //Lista de salas
    let salas = Session.get('salas');
    salas.splice(10); //Muestra 10 salas
    return salas;
  },
  fecha() { //Retorna la fecha seleccionada
    return moment().format('LLLL');
  },
  tablaReservas() { //Retorna la tabla con todas las reservas
    let semana = Session.get('semana');
    let salas = Session.get('salas');
    salas.splice(10); //Muestra 10 salas
    let modulos = Session.get('modulos');

    let celdas = [];

    for (let fila = 0; fila < 9; fila += 1) { //9 módulos
      celdas[fila] = [];
      for (let columna in salas) { //Todas las salas
        //Módulo vacío
        celdas[fila][columna] = [{
          sala: salas[columna],
          fechas: [Session.get('fecha')],
          estaFecha: Session.get('fecha'),
          modulos: [modulos[fila]],
          actividad: (modulos[fila] == 'almuerzo') ? '-' : 'Disponible',
        }];

        let reservas = Reservas.find({sala: salas[columna], fechas: Session.get('fecha'), modulos: modulos[fila]}).fetch();

        for (let i in reservas) {
          reservas[i].estaFecha = Session.get('fecha');
          celdas[fila][columna][i] = reservas[i];
        }

      }
    }

    return celdas;
  },
  modulo(index) { //Retorna los nombres y horarios de los módulos
    let modulo = Session.get('textoModulo');
    return modulo[index];
  },
  color() { //Cambia el color dependiendo de la reserva
    let clase = '';
    if (this.prioridad == 2) {
      clase = 'resCP';
    }
    else if (this.prioridad == 1) {
      clase = 'resSP';
    }

    return clase;
  },
  accion() { //Cambia la acción del click dependiendo de la fecha y del rol del usuario
    if (this.estaFecha < Session.get('hoy')) return 'desactivado';
    if (Roles.userIsInRole(Meteor.userId(), 'admin')) return 'js-editaModulo';
    return 'desactivado';
  },
  repite() { //Agrega un pin si es una reserva con repetición
    if (this.fechas.length > 1) return true;
    return false;
  },
  masDeUna(celda) {
    if (celda.length > 1) return 'amarillo';
    return '';
  }
});
