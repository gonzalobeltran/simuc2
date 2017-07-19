import { Config } from '/imports/api/collections/collections.js';

// Espera la suscripción de los roles antes de iniciar las rutas
FlowRouter.wait();
Tracker.autorun(() => {
  if (Roles.subscription.ready() && !FlowRouter._initialized) {
    FlowRouter.initialize()
  }

  Meteor.subscribe('config');
  Session.set('config', Config.findOne({}));
});

Subs = new SubsManager({
    cacheLimit: 10,
    expireIn: 5
  });

Meteor.startup(function(){
  // Selecciona español
  T9n.setLanguage("es");
  T9n.map('es', {
    error: {
      accounts: {
        'Login forbidden': 'Usuario o contraseña inválido'
      }
    }
  });

//------- Variables de sesión
  // La sala seleccionada actualmente
  Session.set('sala', '');
  //Para la paginación del log
  Session.set('logStep', 0);
  //Filtro del log
  Session.set('logFiltro', '');
  //Para mostrar errores
  Session.set('err', '');
  //Para mostrar superposiciones
  Session.set('superpuestas', '');

  let actividades = ['-',
  'Música de Cámara',
  'Dirección Coral',
  'Composición',
  'Piano',
  'Violín',
  'Viola',
  'Cello',
  'Guitarra',
  'Flauta',
  'Oboe',
  'Clarinete',
  'Fagot',
  'Flauta Dulce',
  'Laúd',
  'Viola da Gamba',
  'Canto',
  'Contrabajo',
  'Clavecín',
  'Corno',
  'Trompeta',
  'Trombón',
  'Tuba',
  'Saxofón',
  'Percusión'];

  Session.set('actividades', actividades);

  let textoModulo = [
    '1 (08:30-09:50)',
    '2 (10:00-11:20)',
    '3 (11:30-12:50)',
    'Almuerzo',
    '4 (14:00-15:20)',
    '5 (15:30-16:50)',
    '6 (17:00-18:20)',
    '7 (18:30-19:50)',
    '8 (20:00-21:20)'
  ];

  let modulos = [
    '1',
    '2',
    '3',
    'almuerzo',
    '4',
    '5',
    '6',
    '7',
    '8'
  ];

  Session.set('modulos', modulos);
  Session.set('textoModulo', textoModulo);

  // La fecha de hoy, en formato largo y corto
  Session.set('hoy', moment().format('YYYY-MM-DD'));
  Session.set('hoyCorto', moment(Session.get('hoy')).format('dd D/M'));
  var semanaDesdeHoy = [];
  var diasSemanaDesdeHoy = [];
  for (let d = 0; d < 7; d+=1) {
    // Guarda las fechas de una semana a partir de hoy
    semanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("YYYY-MM-DD") );
    diasSemanaDesdeHoy.push( moment(Session.get('hoy')).add(d, 'day').format("dd D/M") );
  }
  Session.set('semanaDesdeHoy', semanaDesdeHoy);
  Session.set('diasSemanaDesdeHoy', diasSemanaDesdeHoy);

  // Cambia las variables de sesión de fecha en función de la fecha seleccionada
  updateFechas = function(fecha) {
    var semana = [];
    var diasSemana = [];
    for (let d = 0; d < 7; d+=1) {
      // Guarda las fechas de esta semana
      semana.push( moment(fecha).weekday(d).format("YYYY-MM-DD") );
      diasSemana.push( moment(fecha).weekday(d).format("dd D/M") );
    }
    Session.set('fecha', moment(fecha).format('YYYY-MM-DD'));
    Session.set('semana', semana);
    Session.set('diasSemana', diasSemana);
    Session.set('fechaCorta', moment(fecha).format('dd D/M'));
  }

  updateFechas(moment());

  cambiaFecha = function(dias) {
    let fecha = moment(Session.get('fecha')).add(dias, 'day').format('YYYY-MM-DD');
    updateFechas(fecha);
  }

  apellidos = function(lista) {
    let res = [];

    for (let i in lista) {
      let palabras = lista[i].split(' ');
      let apellido = palabras[palabras.length - 1];
      res.push(apellido);
    }

    return res.join(', ');
  }

  textoColor = function(txt) {
    if (txt.length < 3) return '#c42';

    let xr = (txt.charCodeAt(0) % 2) ? 1 : -1;
    let xg = (txt.charCodeAt(1) % 2) ? 1 : -1;
    let xb = (txt.charCodeAt(2) % 2) ? 1 : -1;

    let r = 122 + txt.charCodeAt(0) * xr;
    let g = 122 + txt.charCodeAt(1) * xg;
    let b = 122 + txt.charCodeAt(2) * xb;

    let rest = 0;
    for (let i = 3; i < txt.length; i += 1) {
      rest += txt.charCodeAt(i);
    }

    rest = rest % 30;

    r += rest; g += rest; b += rest;

    //Calcula la luminosidad del color
    let lum = 0.2126*r + 0.7152*g + 0.0722*b;

    //Decide si el texto será gris o blanco, dependiendo de la luminosidad
    let txtColor = (lum > 130) ? '#333' : 'white;'

    let color = 'rgb(' + r + ',' + g + ',' + b + ')';

    return 'background-color:' + color + '; color:' + txtColor + ';';
  }

//------- Helpers globales
  Handlebars.registerHelper('separaConComa', function(txt) {
    return txt.join(", ");
  });

  Handlebars.registerHelper('apellidos', function() {
    return apellidos(this.integrantes);
  });

  Handlebars.registerHelper('ready', function() {
    return Session.get('ready');
  });

  Handlebars.registerHelper('color', function() { //Cambia el color dependiendo de la reserva
    if (!this.actividad || this.actividad == '-' || this.actividad == 'Disponible') return 'background-color: white; color: black;';
    if (this.prioridad == 1) return 'background-color: #e90; color: white;'

    return textoColor(this.actividad);
  });
});
