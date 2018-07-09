import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';

Template.EditaModulo.onCreated(function() {
  //Crea los objetos para el selector de módulos, marcando los previamente seleccionados
  let mods = Session.get('modulos');
  let chkModulos = [];
  for (let i in mods) {
    let marca = '';
    let txt = (mods[i] == 'almuerzo') ? 'A': mods[i];
    if ( _.contains(this.data.modulos, mods[i]) ) marca = 'marcado';
    chkModulos.push( {sv: 'chkModulos', index: i, val: mods[i], txt: txt, marca: marca} );
  }

  //Guarda la lista del selector de módulos en una variable de sesión
  Session.set('chkModulos', chkModulos);

  //Crea los objetos para el selector de días, marcando los previamente seleccionados
  let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
  let chkDias = [];
  for (let i = 0; i<7; i+=1) {
    chkDias.push( {sv: 'chkDias', index: i, val: i, txt: dias[i], marca: ''} );
  }
  for (let d in this.data.fechas) {
    let dia = moment(this.data.fechas[d]).weekday();
    chkDias[dia].marca = 'marcado';
  }

  //Guarda la lista del selector de módulos en una variable de sesión
  Session.set('chkDias', chkDias);
});

Template.EditaModulo.rendered = function(){
  $('#integrantes').select2();
  $('#repiteHasta').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    startDate: new Date(),
    setDate: this.data.fechas[this.data.fechas.length - 1],
  });
}

Template.EditaModulo.helpers({
  usuarios() {
    return Session.get('usuarios');
  },
  esIntegrante(usuario) { //Marca como preseleccionados los usuarios que están en la reserva
    if ( _.contains(this.integrantes, usuario) ) return 'selected';
  },
  repite() { //Indica si es una reserva que tiene más de una fecha, para cambiar los botones que se muestran
    if (this.fechas.length > 1) return true;
    return false;
  },
  modulos() { //Retorna los objetos para el selector de módulos
    return Session.get('chkModulos');
  },
  dias() { //Retorna los objetos para el selector de días
    return Session.get('chkDias');
  },
  repiteHasta() { //Retorna la última fecha de la reserva
    return this.fechas[this.fechas.length - 1];
  },
});

Template.EditaModulo.events({
  'click .chkBlock'() { //Cambia la selección del selector de módulos
    let mods = Session.get(this.sv);
    mods[this.index].marca = (mods[this.index].marca == '') ? 'marcado' : '';
    Session.set(this.sv, mods);
  },
  'submit #reservaForm'(event, template) {
    event.preventDefault();

    let id = this._id;
    let sala = this.sala;
    let fechas = this.fechas;
    let actividad = event.target.actividad.value;
    let integrantes = _.pluck( _.filter(event.target.integrantes.options, (i) => {return i.selected}) , 'value');
    let repiteHasta = event.target.repiteHasta.value;

    //Guarda los módulos marcados en el selector
    let modulos = _.pluck( _.filter( Session.get('chkModulos'), (i) => {return i.marca == 'marcado'} ), 'val');

    //Guarda los días marcados en el selector
    let dias = _.pluck( _.filter( Session.get('chkDias'), (i) => {return i.marca == 'marcado'} ), 'val');

    if (!repiteHasta || !actividad || !modulos.length) return false;

    if (!id) { //Si es una nueva reserva
      Meteor.call('nuevaReservaAdmin', sala, fechas, modulos, 2, actividad, integrantes, repiteHasta, dias, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    } else { //Si modifica una reserva existente
      Meteor.call('modificaReserva', id, actividad, integrantes, modulos, repiteHasta, dias, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    }

    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  },
  'click .js-eliminaEstaFecha'() {
    Meteor.call('eliminaEstaFecha', this._id, this.estaFecha);
    Meteor.call('reservasSuperpuestas', 2, (err,res) => { Session.set('superpuestas', res); });
    Modal.hide();
  }
});
