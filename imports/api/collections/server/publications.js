import { Salas } from '../collections.js';
import { Reservas } from '../collections.js';
import { Camara } from '../collections.js';
import { Config } from '../collections.js';

config = Config.findOne();

//Publica las reservas de una determinada sala en un rango de fechas (Si la fecha está en vacaciones, no muestra las reservas permanentes)
Meteor.publish('reservasSala', function(sala, ini, fin) {
  return Reservas.find({sala: sala, $or: [{fecha: {$gte: ini, $lte: fin}}, {fecha: '-'}]});
});

Meteor.publish('reservasFijas', function(sala) {
  return Reservas.find({sala: sala, fecha: '-'});
});

//Publica las reservas de un usuario en un rango de fechas
Meteor.publish('reservasUsuario', function(usuario, ini, fin) {
  return Reservas.find({
    fecha: {$gte: ini, $lte: fin},
    $or: [
      {'res1.integrantes': usuario},
      {'res2.integrantes': usuario}]
  });
});

//Publica las reservas de un módulo y fecha determinados (Si la fecha está en vacaciones, no muestra las reservas permanentes)
Meteor.publish('reservasModulo', function(fecha, dia, modulo) {
  if (fecha < config.sinCursosIni || fecha > config.sinCursosFin)
    return Reservas.find({modulo: modulo, $or: [{fecha: fecha}, {dia: dia, fecha: '-'}]});
  else
    return Reservas.find({modulo: modulo, fecha: fecha});
});

//Publica las reservas de un grupo de salas en una fecha determinada (Display) (Si la fecha está en vacaciones, no muestra las reservas permanentes)
Meteor.publish('reservasDisplay', function(fecha) {
  let dia = moment(fecha).weekday();
  return Reservas.find({$or: [{fecha: fecha}, {fecha: '-', dia: dia}]});
});

Meteor.publish('reservasLog', function(filtro, step) {
  let rxp = new RegExp(filtro, 'i');

  return Reservas.find({$or: [
    {sala: {$regex: rxp}},
    {fecha: {$regex: rxp}},
    {timestamp: {$regex: rxp}},
    {owner: {$regex: rxp}},
    {'res1.actividad': {$regex: rxp}},
    {'res2.actividad': {$regex: rxp}},
    {'perm.actividad': {$regex: rxp}},
  ]}, {sort: {timestamp: -1}, skip: step, limit: 15});

});

//Publica la lista con todas las salas
Meteor.publish('salas', function() {
  return Salas.find({});
});

//Publica la lista con los grupos de música de cámara
Meteor.publish('camara', function() {
  return Camara.find({});
});

//Publica la lista con los grupos de música de cámara en los que participa el usuario
Meteor.publish('camaraUsuario', function(user) {
  return Camara.find({ $or: [ {profesor: user}, {integrantes: user} ] });
});

//Publica la configuración
Meteor.publish('config', function() {
  return Config.find({});
});

//Publica una lista con las salas que aceptan una actividad determinada
Meteor.publish('salasAcepta', function(actividad) {
  return Salas.find({acepta: actividad});
});

//Publica todos los usuarios
Meteor.publish('usuarios', function(filtro){
  if (Roles.userIsInRole(this.userId, 'admin')) {
    if (filtro == "*") filtro = "";
    let rxp = new RegExp(filtro, 'i');
    return Meteor.users.find({
      $or: [
        {'profile.nombre': {$regex: rxp}},
        {'emails.0.address': {$regex: rxp}},
        {'profile.ocupacion': {$regex: rxp}},
        {'profile.instrumento': {$regex: rxp}},
        {'profile.amonestado': {$regex: rxp}}
      ],
      username: {$ne: 'display'},
    }, {fields: {emails: 1, profile: 1, roles: 1}});
  }
});
