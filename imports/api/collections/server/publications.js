import { Salas } from '../collections.js';
import { Reservas } from '../collections.js';
import { Camara } from '../collections.js';
import { Config } from '../collections.js';
import { Log } from '../collections.js';

config = Config.findOne();

//Publica las reservas de una determinada sala en un rango de fechas
Meteor.publish('reservasSala', function(sala, ini, fin) {
  return Reservas.find({sala: sala, fechas: {$gte: ini, $lte: fin}});
});

//Publica las reservas de un usuario en un rango de fechas
Meteor.publish('reservasUsuario', function(usuario, ini, fin) {
  return Reservas.find({fechas: {$gte: ini, $lte: fin}, integrantes: usuario});
});

//Publica las reservas de un módulo y fecha determinados
Meteor.publish('reservasModulo', function(fecha, modulo) {
  return Reservas.find({fechas: fecha, modulos: modulo});
});

//Publica las reservas de todas las salas en una fecha determinada
Meteor.publish('reservasDia', function(fecha) {
  return Reservas.find({fechas: fecha});
});

//Publica el log con un filtro determinado
Meteor.publish('log', function(filtro, step) {
  let rxp = new RegExp(filtro, 'i');

  return Log.find({$or: [
    {ts: {$regex: rxp}},
    {usuario: {$regex: rxp}},
    {sala: {$regex: rxp}},
    {accion: {$regex: rxp}},
    {actividad: {$regex: rxp}},
    {fechas: {$regex: rxp}},
    {modulos: {$regex: rxp}},
  ]}, {sort: {ts: -1}, skip: step, limit: 30});

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

//Publica todos los usuarios (con un filtro determinado)
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
