import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import './CreaUsuario.html';

Template.CreaUsuario.rendered = function(){
  $('#creaOcupacion').select2();
  $('#creaInstrumento').select2();
  //Inicializa el selector de fecha para amonestación
  $('#amonestado').datepicker({
    format: 'yyyy-mm-dd',
    autoclose: true,
    todayBtn: "linked",
    todayHighlight: true,
    weekStart: 1,
    disableTouchKeyboard: true,
    maxViewMode: 2,
    language: "es",
    setDate: new Date(),
  });
}

Template.CreaUsuario.helpers({
  instrumentos() {
    return Session.get('actividades');
  },
});

Template.CreaUsuario.events({
  'submit #creaUsuarioForm'(event, template) {
    event.preventDefault();

    let nombre = event.target.nombre.value;
    let email = event.target.email.value;
    let ocupacion = event.target.ocupacion.value;
    let instrumento = _.pluck( _.filter(event.target.instrumento.options, (i) => {return i.selected}) , 'value');

    Meteor.call('creaUsuario', nombre, email, ocupacion, instrumento);

    template.find("form").reset();
    Modal.hide();
  },
});
