import { Template } from 'meteor/templating';

import './SelectorDeHorario.html';

Template.SelectorDeHorario.onCreated(function() {
  let txts = ['1', '2', '3', 'A', '4', '5', '6', '7', '8'];
  let mods = Session.get('modulos');
  let selBox = [];
  let horario = Session.get('horario');

  for(let m = 0; m < 9; m += 1) {
    selBox[m] = [];
    for (let d = 0; d < 7; d += 1) {
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
    let horario = [];
    let modulos = Session.get('modulos');

    for (let m in selBox) {
      let dias = _.pluck( _.filter(selBox[m], (d) => {return d.marca}), 'dia');
      if (dias.length) horario.push({modulo: modulos[m], dias: dias});
    }

    Session.set('horario', horario);
  },
});
