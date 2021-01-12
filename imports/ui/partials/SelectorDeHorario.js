import { Template } from 'meteor/templating';

import './SelectorDeHorario.html';

Template.SelectorDeHorario.onCreated(function() {
  let txtBloques = Session.get('txtBloques');
  let mods = Session.get('modulos');
  let selBox = [];
  let horario = Session.get('horario');
  let numModulos = Session.get('numModulos');

  for(let m = 0; m < numModulos; m += 1) {
    selBox[m] = [];
    for (let d = 0; d < 7; d += 1) {
      //Marca el módulo si está seleccionado
      let marca =  ( horario[d] & Math.pow(2,m) ) ? 'marcado' : '';
      selBox[m][d] = {
        txt: txtBloques[m],
        marca: marca,
        dia: d,
        modulo: m,
      }
    }
  }
  Session.set('selBox', selBox);

});

Template.SelectorDeHorario.helpers({
  dias() {
    let dias = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
    return dias;
  },
  modulos() {
    return Session.get('selBox');
  }
});

Template.SelectorDeHorario.events({
  'click .js-marcaModulo'() {
    let selBox = Session.get('selBox');
    selBox[this.modulo][this.dia].marca = (selBox[this.modulo][this.dia].marca == '') ? 'marcado' : '';
    Session.set('selBox', selBox);

    //Guarda los módulos marcados en el selector
    let horario = [0,0,0,0,0,0,0];
    let modulos = Session.get('modulos');

    for (let m in selBox) {
      for (let d in selBox[m]) {
        if (selBox[m][d].marca) {
          horario[d] += Math.pow(2, selBox[m][d].modulo);
        }
      }
    }

    Session.set('horario', horario);
  },
});
