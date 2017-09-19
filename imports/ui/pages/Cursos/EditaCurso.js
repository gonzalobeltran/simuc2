import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';
import { Salas } from '/imports/api/collections/collections.js';
import './EditaCurso.html';

Template.EditaCurso.onCreated(function() {
  let txts = ['1', '2', '3', 'A', '4', '5', '6', '7', '8'];
  let mods = Session.get('modulos');
  let selBox = [];
  let horario = this.data.horario;

  for(let m = 0; m < 9; m += 1) {
    selBox[m] = [];
    for (let d = 0; d < 5; d += 1) {
      //Marca el módulo si está seleccionado
      let marca =  ( horario && horario.some((o) => {return o.modulo == mods[m] && _.contains(o.dias, d)}) ) ? 'marcado' : '';
      selBox[m][d] = {
        txt: txts[m],
        marca: marca,
        dia: d,
        modulo: m,
      }
    }
  }
  Session.set('selBox', selBox);

});

Template.EditaCurso.helpers({
  salas() { //Lista de salas
    let salas = Salas.find({}, {sort: {orden: 1}}).map((d) => {return d.nombre});
    return salas;
  },
  isSelected(sala) { //Marca la sala seleccionada
    if (sala == this.sala) return 'selected';
  },
  dias() {
    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi'];
    return dias;
  },
  modulos() {
    return Session.get('selBox');
  }
});

Template.EditaCurso.events({
  'click .js-marcaModulo'() {
    let selBox = Session.get('selBox');
    selBox[this.modulo][this.dia].marca = (selBox[this.modulo][this.dia].marca == '') ? 'marcado' : '';
    Session.set('selBox', selBox);
  },
  'click .js-eliminaCurso'() {
    Meteor.call('eliminaCurso', this._id);
    Modal.hide();
  },
  'submit #editaCursoForm'(event, template) {
    event.preventDefault();

    let anio = Session.get('anio');
    let semestre = Session.get('semestre');
    let nombre = event.target.nombre.value;
    let profesor = event.target.profesor.value;
    let sala = event.target.sala.value;

    //Guarda los módulos marcados en el selector
    let selBox = Session.get('selBox');
    let horario = [];
    let modulos = Session.get('modulos');

    for (let m in selBox) {
      let dias = _.pluck( _.filter(selBox[m], (d) => {return d.marca}), 'dia');
      if (dias.length) horario.push({modulo: modulos[m], dias: dias});
    }

    if (!nombre || !profesor || !sala || !horario.length) return false;

    if (this._id) {
      Meteor.call('modificaCurso', this._id, anio, semestre, nombre, profesor, sala, horario);
    } else {
      Meteor.call('creaCurso', anio, semestre, nombre, profesor, sala, horario);
    }

    template.find("form").reset();
    Modal.hide();
  },
});
