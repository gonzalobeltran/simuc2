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
  fecha1() {
    let config = Session.get('config');
    return config.fecha1;
  },
  fecha2() {
    let config = Session.get('config');
    return config.fecha2;
  },
  fecha3() {
    let config = Session.get('config');
    return config.fecha3;
  },
});

Template.EditaModulo.events({
  'click .chkBlock'() { //Cambia la selección del selector de módulos
    let mods = Session.get(this.sv);
    mods[this.index].marca = (mods[this.index].marca == '') ? 'marcado' : '';
    Session.set(this.sv, mods);
  },
  'click .js-fecha1'(event, template) {
    let config = Session.get('config');
    let fecha = config.fecha1;
    $('#repiteHasta').datepicker('update', fecha);
  },
  'click .js-fecha2'(event, template) {
    let config = Session.get('config');
    let fecha = config.fecha2;
    $('#repiteHasta').datepicker('update', fecha);
  },
  'click .js-fecha3'(event, template) {
    let config = Session.get('config');
    let fecha = config.fecha3;
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

    //Guarda los días marcados en el selector
    let chkDias = Session.get('chkDias');
    let dias = [];
    for (let i in chkDias) {
      if (chkDias[i].marca == 'marcado') dias.push(chkDias[i].val);
    }

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
