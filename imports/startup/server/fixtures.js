import { Meteor } from 'meteor/meteor';

import { Config } from '../../api/collections/collections.js';
import { Salas } from '../../api/collections/collections.js';
import { Reservas } from '../../api/collections/collections.js';
import { Camara } from '../../api/collections/collections.js';

Meteor.startup(() => {
  //Crea la indexación para las colecciones
  Salas._ensureIndex({acepta: 1});
  Reservas._ensureIndex({sala: 1});
  Reservas._ensureIndex({fecha: 1});
  Reservas._ensureIndex({modulo: 1});

  //Crea un usuario si la lista de usuarios está vacía
  if ( Meteor.users.find({'username':'gbeltran'}).count() === 0 ) {
    let id = Accounts.createUser({
        email: 'gbeltran@uc.cl',
        username: 'gbeltran',
        password: '14011152',
        profile: {
            nombre: 'Gonzalo Beltrán',
            ocupacion: 'Profesor',
            instrumento: ['Violín']
        }
    });
    Roles.addUsersToRoles(id, ['usuario', 'admin', 'superadmin']);
  }

  //Crea el usuario 'display' si no existe
  if ( Meteor.users.find({'username':'display'}).count() === 0 ) {
    let id = Accounts.createUser({
        email: 'display@uc.cl',
        username: 'display',
        password: 'display',
        profile: {
          nombre: 'Display'
        }
    });
    Roles.addUsersToRoles(id, ['display']);
  }

  //Crea la configuración si no existe
  configuracion = {
    maxReservas: 1,
    maxCamaraPorSemana: 1,
    mensaje: '-'
  }

  if (Config.find().count() == 0) Config.insert(configuracion);
});
