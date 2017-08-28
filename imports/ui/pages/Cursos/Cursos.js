import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Cursos } from '/imports/api/collections/collections.js';

import './Cursos.html';
import './EditaCurso.js';

Template.Cursos.onCreated(function() {
  this.autorun( () => {
    let handle = Subs.subscribe('cursos');
    Session.set('ready', handle.ready());
  });
});

Template.Cursos.helpers({
  cursos() {
    return Cursos.find({});
  },
});

Template.Cursos.events({
  'click .js-creaCurso'() {

  },
  'click .js-editaCurso'() {

  }
});
