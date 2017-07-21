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

  //Calcula el matiz de un color, 0% es el color original, 100% es blanco
  function shadeColor(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  }

  //Decide si el texto debe ser negro o blanco dependiendo de la luminosidad del color de fondo
  colorTexto = function(color) {
    //Calcula la luminosidad del color
    let r = parseInt(color.slice(1,3), 16) / 255; let g = parseInt(color.slice(3,5), 16) / 255; let b = parseInt(color.slice(5,7), 16) / 255;
    r = (r < 0.03928) ? (r / 12.92) : Math.pow( (r + 0.055) / 1.055 , 2.4);
    g = (g < 0.03928) ? (g / 12.92) : Math.pow( (g + 0.055) / 1.055 , 2.4);
    b = (b < 0.03928) ? (b / 12.92) : Math.pow( (b + 0.055) / 1.055 , 2.4);

    let lum = 0.2126*r + 0.7152*g + 0.0722*b;

    //Decide si el texto será oscuro o claro, dependiendo de la luminosidad
    let txtColor = (lum > 0.179) ? 'black' : 'white;'

    return txtColor;
  }

  //Calcula un color dependiendo del texto
  textoColor = function(txt) {
    //Posibilidades de colores
    let colores = [
      '#DC4C46', //Grenadine
      '#F6D155', //Primrose Yellow
      '#004B8D', //Lapis Blue
      '#F2552C', //Flame
      '#578CA9', //Niagara
      '#5A7247', //Kale
      '#005960', //Shaded Spruce
      '#223A5E', //Navy Peony
      '#95DEE3', //Island Paradise
      '#92B558', //Greenery
      '#AD5D5D', //Dusty Cedar
    ];

    let max = (txt.length < 4) ? txt.length : 4;
    let sum1 = 0; sum2 = 0;

    //Elige el color con las tres primeras letras y el matiz con el resto del texto
    for (let i = 0; i < max; i += 1) sum1 += txt.charCodeAt(i);
    for (let i = max; i < txt.length; i += 1) sum2 += txt.charCodeAt(i);

    let i1 = sum1 % colores.length; //para elegir el color
    let i2 = (30 - (sum2 % 60)) / 100; //para elegir el matiz

    let color = shadeColor(colores[i1], i2);

    //Decide si el texto será oscuro o claro, dependiendo de la luminosidad
    let txtColor = colorTexto(color);

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
