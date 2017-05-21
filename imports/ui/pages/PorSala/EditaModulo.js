import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Reservas } from '/imports/api/collections/collections.js';

import './EditaModulo.html';

Template.EditaModulo.onCreated(function() {
  let mods = Session.get('modulos');
  let chkModulos = [];

  //Crea los objetos para el selector de módulos, marcando los previamente seleccionados
  for (let i in mods) {
    let marca = '';
    let txt = (mods[i] == 'almuerzo') ? 'A': mods[i];
    if ( _.contains(this.data.modulos, mods[i]) ) marca = 'marcado';
    chkModulos.push( {index: i, val: mods[i], txt: txt, marca: marca} );
  }

  //Guarda la lista del selector de módulos en una variable de sesión
  Session.set('chkModulos', chkModulos);
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
  repiteHasta() { //Retorna la última fecha de la reserva
    return this.fechas[this.fechas.length - 1];
  }
});

Template.EditaModulo.events({
  'click .chkMod'() { //Cambia la selección del selector de módulos
    let mods = Session.get('chkModulos');
    mods[this.index].marca = (mods[this.index].marca == '') ? 'marcado' : '';
    Session.set('chkModulos', mods);
  },
  'click .js-hastaFin'(event, template) {
    let fecha = moment().endOf('year').format('YYYY-MM-DD');
    $('#repiteHasta').datepicker('update', fecha);
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
    let mods = Session.get('chkModulos');
    let modulos = [];
    for (let i in mods) {
      if (mods[i].marca == 'marcado') modulos.push(mods[i].val);
    }

    if (!repiteHasta || !actividad || !modulos.length) return false;

    if (!id) { //Si es una nueva reserva
      Meteor.call('nuevaReservaAdmin', sala, fechas, modulos, 2, actividad, integrantes, repiteHasta, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    } else { //Si modifica una reserva existente
      Meteor.call('modificaReserva', id, actividad, integrantes, modulos, repiteHasta, (err,res) => {
        if (err) Session.set('err', err.reason);
      });
    }

    Modal.hide();
  },
  'click .js-eliminar'() {
    Meteor.call('eliminaReserva', this._id);
    Modal.hide();
  },
  'click .js-eliminaEstaFecha'() {
    Meteor.call('eliminaEstaFecha', this._id, this.estaFecha);
    Modal.hide();
  }
});
