import { FlowRouter } from 'meteor/kadira:flow-router';
import { BlazeLayout } from 'meteor/kadira:blaze-layout';

// Carga los templates
import '/imports/ui/layouts/AppBody.js';
import '/imports/ui/pages/Reservas/Reservas.js';
import '/imports/ui/pages/PorSala/PorSala.js';
import '/imports/ui/pages/PorDia/PorDia.js';
import '/imports/ui/pages/Salas/Salas.js';
import '/imports/ui/pages/Camara/Camara.js';
import '/imports/ui/pages/Usuarios/Usuarios.js';
import '/imports/ui/pages/Log/Log.js';
import '/imports/ui/pages/Config/Config.js';

var userRoutes = FlowRouter.group({
  name: 'user',
  triggersEnter: [function(context, redirect) {
    if (!Roles.userIsInRole(Meteor.userId(), 'usuario')) redirect('/');
  }]
});

var adminRoutes = FlowRouter.group({
  name: 'admin',
  triggersEnter: [function(context, redirect) {
    if (!Roles.userIsInRole(Meteor.userId(), 'admin')) redirect('/');
  }]
});

var superadminRoutes = FlowRouter.group({
  name: 'superadmin',
  triggersEnter: [function(context, redirect) {
    if (!Roles.userIsInRole(Meteor.userId(), 'superadmin')) redirect('/');
  }]
});

FlowRouter.route('/', {
  name: 'home',
  action() {
    if (Meteor.userId()) {
      if (Roles.userIsInRole(Meteor.userId(), 'admin')) FlowRouter.go('/porsala');
      else if (Roles.userIsInRole(Meteor.userId(), 'display')) FlowRouter.go('/display');
      else if (Roles.userIsInRole(Meteor.userId(), 'usuario')) FlowRouter.go('/reservas');
      else FlowRouter.go('/porsala');
    }
    else {
      FlowRouter.go('/sign-in');
    }
  }
});

userRoutes.route('/reservas', {
  name: 'reservas',
  action() {
    BlazeLayout.render('AppBody', { main: 'Reservas' });
  },
});

FlowRouter.route('/porsala', {
  name: 'porsala',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    BlazeLayout.render('AppBody', { main: 'PorSala' });
  },
});

FlowRouter.route('/pordia', {
  name: 'pordia',
  triggersEnter: [AccountsTemplates.ensureSignedIn],
  action() {
    BlazeLayout.render('AppBody', { main: 'PorDia' });
  },
});

userRoutes.route('/salas', {
  name: 'salas',
  action() {
    BlazeLayout.render('AppBody', { main: 'Salas' });
  },
});


adminRoutes.route('/camara', {
  name: 'camara',
  action() {
    BlazeLayout.render('AppBody', { main: 'Camara' });
  },
});

adminRoutes.route('/usuarios', {
  name: 'usuarios',
  action() {
    BlazeLayout.render('AppBody', { main: 'Usuarios' });
  },
});

adminRoutes.route('/log', {
  name: 'log',
  action() {
    BlazeLayout.render('AppBody', { main: 'Log' });
  },
});

superadminRoutes.route('/config', {
  name: 'config',
  action() {
    BlazeLayout.render('AppBody', { main: 'Config' });
  },
});

FlowRouter.notFound = {
  action() {
    FlowRouter.go('/');
  }
}
