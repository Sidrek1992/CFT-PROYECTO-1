/**
 * Script de sincronización de empleados usando Firebase Web SDK
 * Ejecutar con: node scripts/sync_employees_web.mjs
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
    apiKey: 'AIzaSyBvRGiSWUdnZ88NsUX0EsLdnXwJk5AXVSA',
    authDomain: 'app-correo-cft.firebaseapp.com',
    projectId: 'app-correo-cft',
    storageBucket: 'app-correo-cft.firebasestorage.app',
    messagingSenderId: '140293468941',
    appId: '1:140293468941:web:5e0ac40c2587880b34f644'
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLLECTION_NAME = 'employees';

const csvData = `N°,Nombres,Primer Apellido,Segundo Apellido,Rut,Fecha de Nacimiento,Género,Hijos,Télefono,Contacto Familiar,Estado Civil,Email Personal,Domicilio,Licencia Conducir,Profesión,Postgrado,Cargo,Dirección,Área,Estamento,Correo Institucional,Fecha Ingreso,Fecha Término,Tipo de Contrato
1,Susan Scarleth,Aguilar,Martínez,21.142.239-1,2002-09-28,F,No,920193955,"983976079, Gloria Martinez (madre)",Soltera,Susanscarleth.1@gmail.com,"Población Industriales 1, Pasaje Alicahue",¨-,Trabajadora Social,,Profesional de Servicio Social Estudiantil (Reemplazo),DIAC,Subdirección Académica de Asuntos Estudiantiles,Profesional Asistente,s.aguilar@cftestatalaricayparinacota.cl,2025-09-29,2025-12-31,Plazo Fijo
2,Carlos Alberto,Araos,Uribe,9.877.239-1,1964-12-08,M,Si,984756266,,Casado,araos.alberto@gmail.com,Acapulco 676,,Periodista,Doctor en Ciencias de la Información,Rector,RECTORÍA,Rectoría,Rectoría,rector@cftestatalaricayparinacota.cl,2025-04-23,2029-04-22,Plazo Fijo
3,Gloria Noemí,Bolaño,Gavia,12.209.583-5,1972-02-16,F,Si,57595617,"87370902, Carlos Millán (Cónyuge)",Casada,gloriabgavia@hotmail.com,"Santiago Arata N°4085, Block A3, Departamento 45",---,TNS en Enfermería,,Encargada de Sala de Estudios,DIAC,Dirección Académica,Técnico Encargado,g.bolano@cftestatalaricayparinacota.cl,2024-11-01,2026-10-31,Plazo Fijo
4,Rubén Boris,Calderón,Jaques,10.163.343-8,1965-06-21,M,Sí,999564338,"991775111, Vivian Cisternas (Cónyuge)",Casado,calderonjaque@gmail.com,"Monza N°582, Villa Pedro Lagos",-,Licencia Educación Media Humanística Científica,,Auxiliar de Compras Públicas,DEA,Adquisiciones y Compras Públicas,Auxiliar,r.calderon@cftestatalaricayparinacota.cl,2025-04-01,2026-03-31,Plazo Fijo
5,David Alberto,Campos,Araya,12.513.632-K,1973-10-16,M,Si,997633323,"962322662, Carolina Vega (Esposa)",Casado,daca73@hotmail.com,José Morales Cares N°4508,---,Contador Auditor-Contador Público,,Subdirector de Contabilidad y Presupuesto,DEA,Subdirección de Contabilidad y Presupuesto,Profesional Jefatura,contabilidad@cftestatalaricayparinacota.cl,2022-01-10,2022-12-31,Indefinido
6,Jennifer Roxana,Cancino,Andrade,15.741.751-7,1984-01-23,F,Si,99571681,"99571681, Javier Marquez (Amigo)",Soltera,cancinojennifer5@gmail.com,Curacautín N°834,---,Licencia Educación Media Técnico Profesional,,Auxiliar,DEA,Servicios Generales y Operación,Auxiliar,jennifer.cancino@cftestatalaricayparinacota.cl,2023-02-01,,Indefinido
7,Marcelo Alejandro,Cárdenas,Neira,15.561.005-0,1983-05-26,M,Si,963370631,"54056951, Fiorella Vargas (Cónyuge)",Casado,mcardenasn@mtecnodata.cl,"Hualles N°3134, Casa 1",---,Ingeniero en Informática,,Jefe de Carrera TNS en Informática y Aplicaciones Tecnológicas,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.informatica@cftestatalaricayparinacota.cl,2021-03-08,,Indefinido
8,Aníbal Raúl,Carrasco,Mamani,13.005.431-5,1976-01-23,M,No,61789177,"66535672, Adriana Mamani (Madre)",Soltero,arcam230@gmail.com,Coquimbo N°2066,---,Licencia Educación Media Técnico Profesional,,Asistente en Conectividad,DEA,Conectividad y Soporte,Administrativo,asis.conectividad@cftestatalaricayparinacota.cl,2023-02-01,,Indefinido
9,Jacqueline Carmen,Castillo,Roblero,12.434.705-K,1972-12-09,F,Si,942105620,"944601068, David Zapata (Cónyuge)",Divorciada,jacquelinecastillor@gmail.com,"Independencia N°370, Block B2, Departamento 203",---,Planificador Social,,Subdirector(a) de Vinculación con el Medio,DIAC,DIAC,Profesional Jefatura,vinculacion@cftestatalaricayparinacota.cl,2023-09-05,,Indefinido
10,Juan Carlos,Cejas,Rivera,10.787.205-1,1968-05-10,M,Si,95938029,"86897666, Carolina Cejas Pizarro(Hija)",Soltero,juancari10@yahoo.es,"Calle Juan Coeymans Ratjens N°4906, Condominio 3 - Nuevo Norte I, Torre 5, departamento 524",Clase B,TNS en Control de Gestión y Logística,,Encargado de Adquisiciones,DEA,Adquisiciones y Compras Públicas,Técnico Encargado,adquisiciones@cftestatalaricayparinacota.cl,2021-04-01,,Indefinido
11,Mercedes Del Carmen,Corrales,Salas,10.410.653-6,1966-05-16,F,Si,982598433,"Marco Pizarro, esposo: 963537462",Casada,mercedescorrales9@gmail.com,"Puntilla Saucache, Pasaje Hernán Albretch N°2469",,Profesora de Castellano,Magíster en Educación con mención en Administración,Subdirectora Académica de Docencia - Directora Académica(S),DIAC,Dirección Académica,Director,diac@cftestatalaricayparinacota.cl,2023-01-06,,Indefinido
12,Sebastián Alejandro,Díaz,Campos,14.105.126-1,1981-11-05,M,Si,950637932,"991417183, Julia Roldán (Conviviente)",Soltero,sediazcampos@gmail.com,Francisco Urzúa N°3457,---,Ingeniero Comercial,,Profesional Encargado de Adquisiones y Compras Públicas,DEA,Adquisiciones y Compras Públicas,Profesional Encargado,compraspublicas@cftestatalaricayparinacota.cl,2022-01-01,2022-12-31,Indefinido
13,Karen Yanira,Díaz,Corona,17.369.013-4,1989-12-11,F,No,962545678,"55221128, Marcos Vergara (Cónyuge)",Casada,karendiazcorona6@gmail.com,"Santiago Arata N°4065, block 5, departamento 32",---,Trabajadora Social,Magíster en Trabajo Social Clínico,Profesional Servicio Social Estudiantil,DIAC,Subdirección Académica de Asuntos Estudiantiles,Profesional Asistente,serviciosocial@cftestatalaricayparinacota.cl,2021-08-16,,Indefinido
14,Nicol Camila,Díaz,Tupa,18.787.184-0,1994-01-11,F,No,931495175,"951687394, Ariel Díaz (Padre)",Soltera,nicole.cdt94@gmail.com,Los Piñones N°2048,---,Contadora Auditora - Contadora Pública,,Asistente de Contabilidad,DEA,Subdirección de Contabilidad y Presupuesto,Técnico Asistente,asistente.contable@cftestatalaricayparinacota.cl,2025-04-21,2027-03-31,Plazo Fijo
15,Diana Andrea,Delgado,Caro,18.943.520-7,1994-11-09,F,Si,958980642,"937890866, Miguel (Pareja)",Soltera,dianadcdelgado@gmail.com,Los Artesanos N°825,----,Trabajadora Social,,Técnica Encargada de Servicio Social Estudiantil en Calidad de Reemplazo,DIAC,Subdirección Académica de Asuntos Estudiantiles,Técnico Encargado,,2026-01-16,2026-03-31,Plazo Fijo
16,Waldo Alexis,Echeverría,Rivera,16.468.515-2,1987-02-17,M,No,934117640,"950532624, David Tabilo (Pareja)",Soltero,echeverria.agronomo@gmail.com,Jurasi N°1981,---,Ingeniero Agrónomo,,Jefe de Carrera de Tns Veterinaria y Tns Agronomia,,,,,,,
17,Silvia Yanet,Esquivel,Díaz,13.211.790-K,1977-04-19,F,Si,978667957,"71942314, Aracely Esquivel (Hija)",Soltera,sesquivel24@hotmail.com,"Maracaibo N°1585, Departamento 42-F, 4to piso.",---,"Ingeniería de Ejecución de Administración de Empresas, Mención Finanzas",,Asistente de Rectoría,RECTORÍA,Rectoría,Técnico Encargado,asistente.rectoria@cftestatalaricayparinacota.cl,2021-08-12,,Indefinido
18,Marcela Alejandra,Fernández,Llantén,18.712.529-4,1993-12-05,F,Si,942890739,976959412 Patricia Llantén (Madre),Soltera,marcela.fernandez0105@gmail.com,"Humberto Arellano N°010, block E, dpto 21",---,TNS en Educación Parvularia y Primer ciclo de Eduación Básica,,Asistente de Admisión,DIAC,Subdirección Académico de Vinculación con el Medio,Técnico Asistente,m.fernandez@cftestatalaricayparinacota.cl,2025-10-01,2025-12-31,Plazo Fijo
19,Alfonso Eleazar,Fuentes,Díaz,21.436.809-9,2003-10-31,M,No,978967788,"986833161, Aracelly Díaz (Madre)",Soltero,fuentesdiazalfonso@gmail.com,"Pellehue N°372, Fuerte Ciudadela",,TNS en Control de Gestión y Logística,,Asistente de Logísticia,DEA,Servicios Generales y Operación,Técnico Asistente,a.fuentes@cftestatalaricayparinacota.cl,2025-02-01,2027-01-31,Plazo Fijo
20,Jeremy Andrey Aron,Gee,Melo,19.868.851-7,1998-05-10,M,No,931484308,"978647660, Susan Melo (Madre)",Soltero,jeremygeemelo10@mail.com,Monumento Nacional N°250,--,Ingeniero en Información y Control de Gestión,,Analista de Cobranza y Tesorería,DEA,Subdirección de Contabilidad y Presupuesto,Técnico Asistente,cobranza_tesoreria@cftestatalaricayparinacota.cl,2025-04-01,2025-12-31,Plazo Fijo
21,Alejandra,González,,,,,,,,,,,,,,,,,,,,,
22,Pablo Antonio,González,Villegas,15.695.266-4,1984-04-23,M,No,988062715,"99662886, Alejandro González (Hermano)",Soltero,p_gonzalez_villegas@hotmail.com,Pasaje Alto Saboya N°665,Clase B y C,Ingeniero de Ejecución en Administración de Empresa,,Profesional de Conectividad y Soporte,DEA,Conectividad y Soporte,Profesional Encargado,conectividad.soporte@cftestatalaricayparinacota.cl,2021-03-16,,Indefinido
23,Jorge Andrés,Guillen,Álvarez,17.553.924-7,1991-10-31,M,No,938819909,"979032413, Ruth Álvarez (madre)",Soltero,jrgvndre@gmail.com,"Ninhue N°3638, Ancolacane 4",,TNS en Fabricación y Montaje de Estructuras Metálicas,,Pañol,DIAC,Subdirección Académica de Áreas Formativas,Técnico Asistente,panol@cftestatalaricayparinacota.cl,2025-04-01,,Indefinido
24,Maximiliano Andrés,Guzmán,Ahumada,18.313.090-0,1992-09-21,M,No,993488076,998806611 (Padre),Soltero,mguzmanahumada@gmail.com,"Pasaje 15 N°940, Población Juan Noé",Clase B,Psicológo,,Asistente Administrativo Gestión de Personas,DEA,Subdirección Gestión de Personas,Técnico Asistente,a.gestiondepersonas@cftestatalaricayparinacota.cl,2026-01-01,2026-12-31,Plazo Fijo
25,Rosa Eliana,Jarpa,Zamorano,11.815.474-6,1971-11-17,F,No,997914269,"944202351, Erika Jarpa Zamorano (Hermana)",Soltera,rosajarpa@gmail.com,Pasaje Demetrio Rios N°4163. Población Raúl Silva Henriquez,---,Profesora de Educación Media en Castellano,,Subdirectora de Areas Formativas,DIAC,Dirección Académica,Profesional Jefatura,r.jarpa@cftestatalaricayparinacota.cl,2025-08-14,2027-08-13,Plazo Fijo
26,María Soledad,Jarrin,Rojas,14.735.535-1,1983-05-26,F,Si,62602850,"93583963, Fabiola Rojas (Madre)",Soltera,maria.s.jarrin@gmail.com,"Calle Pedro Lagos 202, Casa 41, Condominio Pedro Lagos, Villa Frontera",Clase B,"Ingeniera en Administración de Empresas, mención Finanzas",Magíster en Gestión Empresarial,Subdirectora de Gestión de Personas - Directora Económica y Administrativa(s),DEA,Subdirección de Gestión de Personas,Profesional Jefatura,gestiondepersonas@cftestatalaricayparinacota.cl,2021-02-01,,Indefinido
27,Natalia Andrea,Jofre,jofré,17.431.097-1,1989-12-15,F,Si,989931792,995666158 Clara Vasquez (Suegra),Soltera,natalia.jofre.30@gmail.com,"Linderos N°1421, Torre 1, departamento 11",---,Abogada,,Asistente de Gestión de Personas,DEA,Subdirección de Gestión de Personas,Tecnico Asistente,asis.gestiondepersonas@cftestatalaricayparinacota.cl,2025-10-29,2025-12-31,Plazo Fijo
28,Paola Sojin,Kang,,23.116.955-5,1997-10-08,F,No,993029610,"936701189, Mi Ra Kwak (Madre)",Soltera,kangsojin97@gmail.com,21 de Mayo N°345- A,-,Ingeniera en Información y Control de Gestión,,Profesional Encargada de Calidad y Análisis Institucional,RECTORÍA,Rectoría,Profesional Encargado,p.kang@cftestatalaricayparinacota.cl,2025-04-01,2027-03-31,Plazo Fijo
29,Nicolás Esteban,Labbé,Yáñez,19.278.635-5,1996-02-18,M,Si,37140184,"32186462, Cecilia Yañez (Madre)",Soltero,nicolabbbbe@gmail.com,"Melias N°2384, Villa Las Araucarias",---,TNS en Agrícola,,Apoyo Técnico en Mantenimiento,DEA,Servicios Generales y Operación,Técnico Asistente,mantenimiento@cftestatalaricayparinacota.cl,2023-05-01,,Indefinido
30,Alejandra Paulina,Leiva,Martínez,15.947.507-7,1984-09-19,F,No,82961072,66093361 Tomislav Simunovic Vásquez (Cónyuge),Casada,aleiva0919@gmail.com,"Pasaje Molino N°1984, Población Camilo Henríquez",---,Química Laboratorista,,Jefe(a) de Carreras Área Formativa de Ciencias,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.ciencias@cftestatalaricayparinacota.cl,2023-11-30,,Indefinido
31,Constanza,López,López,,,,,,,,,,,,,,,,,,,,
32,Rodrigo Andrés,Marín,Quispe,15.004.408-1,1982-10-07,M,No,961290542,"995430705, Sergio Marin (Padre)",Soltero,rgomarin@yahoo.com,"Ramón Carnicer Oriente N°3246, Block H, Departamento 11 Condominio San Marcos",Clase B,Ingeniero de Ejecución en Computación e Informática,,Desarrollador de Programas y Aplicaciones (DEA),DEA,Dirección Económica y Administrativa,,desarrollador.dea@cftestatalaricayparinacota.cl,2025-12-01,2027-11-30,Plazo Fijo
33,Roxany Andrea,Mery,Guerra,13.638.423-6,1979-07-07,F,Si,84337735,"66213455, Rodrigo Consuegra (Pareja)",Soltera,roxany.mery@gmail.com,"San Antonio N°1600, Villa Cotacotani II",---,Profesora de Educación Media en Historia y Geografía,Magister en Psicología Educacional,Subdirectora Académica de Asuntos Estudiantiles,DIAC,Subdireción Académica de Asuntos Estudiantiles,Profesional Jefatura,asuntosestudiantiles@cftestatalaricayparinacota.cl,2021-12-01,,Indefinido
34,José Manuel,Montero,Medina,12.610.503-7,1974-10-30,M,Si,81492307,"76617567, Clodomiro Montero (Padre)",Soltero,montero1130@gmail.com,"Avenida La Concepcion N°4020, Block 7, departamento 42",---,Ingeniero Civil Mécanico,,Jefe de Carrera TNS en Fabricación y Montaje de Estructura Metálicas - TNS en Mantenimiento Electromecánico de Equipos Móviles,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.fabricacion@cftestatalaricayparinacota.cl,2021-03-16,,Indefinido
35,Claudio Andrés,Moraga,Contreras,17.516.701-3,1990-07-17,M,Si,984896699,"91744577, María Jessica Contreas (mamá)",Soltero,claudio.moraga.c@hotmail.com,"Coihueco N°550, departamento C-52, Condominio Panorama",-,Ingeniero Comercial,,Encargado de Control Interno,FISCALÍA,Fiscalía,Profesional Encargado,auditoria@cftestatalaricayparinacota.cl,2024-12-01,2026-11-30,Plazo Fijo
36,Ruth Noemí,Muñoz,Olivárez,17.369.615-9,1990-02-10,F,No,73900016,"84222046, Carlos Yevenes (Esposo)",Casada,ruthmunozolivarez@gmail.com,Pedro de Oña N°1979,---,Kinesióloga,Magister en Docencia para la Educación Superior,Jefa de Carrera de Área Formativa de Salud,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.enfermeria@cftestatalaricayparinacota.cl,2023-09-01,2023-12-31,Indefinido
37,Nicole Fernanda,Ortega,Vicencio,17.369.081-9,1989-12-14,F,Sí,934131939,"994317687, Camilo Villarroel (Pareja)",Soltera,nicole.ortegav@gmail.com,Pedro Blanquier N°3499,-,Abogada,,Encargada de Asuntos Legales,FISCALÍA,Fiscalía,Profesional Encargado,a.legales@cftestatalaricayparinacota.cl,2025-02-01,2027-01-31,Plazo Fijo
38,Martín Alonso,Pereda,Martínez,12.467.264-3,1973-03-24,M,Si,981573765,"998742678, María José Labarca (Cónyuge)",Casado,alonsopereda@gmail.com,"Guillermo Sánchez N°664, casa 20",,Arquitecto,,Profesional Encargado de Planificación y Proyectos,DEA,Dirección Económica y Administrativa,Profesional Encargado,infraestructura@cftestatalaricayparinacota.cl,2024-08-01,2026-07-31,Plazo Fijo
39,Alejandra Verónica,Pincheira,Varas,15.979.165-3,1984-12-19,F,No,963332628,"977906507, Andrea Pincheira Varas (Hermana)",Soltera,alepincheiravara@gmail.com,Avenida España N°3174,,Abogada,,Analista de Control Interno,FISCALÍA,Fiscalía,Profesional Asistente,,2026-01-05,2027-01-04,
40,Carolina Andrea,Prieto,González,16.197.162-6,1985-04-27,F,Si,71984909,"954173849, Roberto Pérez Contreras (Cónyuge).",Casada,carolinaprietog@gmail.com,Calle Iglesia San Francisco N°2377,Clase B,Ingeniera en Administración de Empresas,,Técnica Encargada de Análisis Institucional,RECTORÍA,Rectoría,Técnico Encargado,c.prieto@cftestatalaricayparinacota.cl,2025-08-01,2027-07-31,Plazo Fijo
41,Paola Guillermina,Reyes,Campos,10.777.786-5,1969-12-20,F,Si,64003481,"79085308, René Huerta (Hijo)",Soltera,pao.reyeesc@gmail.com,"Población Las Brisas, Pasaje Amatista N°2255",---,Licencia de Educación Media Humanístico Científica,,Auxiliar,DEA,Servicios Generales y Operación,Auxiliar,paola.reyes@cftestatalaricayparinacota.cl,2023-02-01,,Indefinido
42,Victor Ramón,Riquelme,Curín,12.168.767-4,1974-05-17,M,Si,981869163,"938662307, Lorena Bennios Vicencio (Pareja)",Soltero,histlogo@gmail.com,Manuel Blanco Encalada N°1075,Clase B,Profesor de Educación Media en Historia y Geografía,,Curriculista,DIAC,Subdirección Académica de Docencia,Profesional Encargado,,2025-08-20,2026-08-19,Plazo Fijo
43,Jorge Andree,Ríos,Barrera,15.005.933-K,1982-07-01,M,Si,,"950021408, Andrea Ordenes Ortiz (Pareja)",Soltera,Jorgerios82@gmail.com,,,Abogado,,Fiscal (s),FISCALÍA,Fiscalía,Director,fiscal@cftestatalaricayparinacota.cl,2025-07-15,2027-07-14,Plazo Fijo
44,Álvaro Andrés,Ron,Callejas,15.694.192-1,1983-12-10,M,Si,66291009,"92523662, Francis Jiménez (Pareja)",Soltero,alvaro.ron.callejas@gmail.com,"Santiago Arata N°3543, departamento 41",---,Profesor de Inglés,Magíster en Desarrollo Curricular y Proyectos Educativos,Encargado de Registro Curricular y Titulación,DIAC,Registro Curricular y Titulación,Profesional Encargado,regis@cftestatalaricayparinacota.cl,2021-03-01,,Indefinido
45,Romina Andrea Elizabeth,Ron,Morales,13.210.997-4,1977-01-02,F,Si,99200016,"96554750, Renato Del Real Lazo (Cónyuge)",Casada,romiron2@gmail.com,"Av. Senador Humberto Palza N°3609, Casa 5, Condominio La Huayca",,Educadora de Párvulos,Magíster en Psicología Educacional,Jefe(a) de Carreras Área Formativa de Humanidades,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.humanidades@cftestatalaricayparinacota.cl,2023-11-30,,Indefinido
46,María Alejandra,Sáez,Calderón,10.981.908-5,1972-08-31,F,Si,93090935,"98377877, Juan Sáez (Padre)",Soltera,alejandra.saez32@gmail.com,"Pedro Quintavalle N°2402, Saucache.",---,Profesor de Educación Media en Inglés,Magíster en Enseñanza Media en Inglés,Asesora Técnica Pedagógica,DIAC,Subdirección Acádemica de Docencia,Profesional Encargado,a.tecnicapedagogica@cftestatalaricayparinacota.cl,2021-03-22,,Indefinido
47,Ricardo Antonio,Segovia,Yampo,12.611.934-8,1974-07-29,M,Si,977910447,,Soltero,rsegoviay@gmail.com,"Javier Castro N°832, Cardenal Raúl Silva",,Ingeniero en Gestión Informática,,Profesional de Comunicaciones,DIAC,Subdirección Académica de Vinculación con el Medio,Profesional Asistente,comunicaciones@cftestatalaricayparinacota.cl,2025-10-06,2025-12-31,Plazo Fijo
48,Lay-Sin Romina,Siau,Sarricueta,16.465.996-8,1986-06-15,F,Si,961249326,"74738819, José Miguel Flores (Cónyuge)",Soltera,romyetd2703@gmail.com,"Amador Neghme N°551, Block 5, departamento 34",---,TNS en Atención de Menores,,Analista de Registro Curricular y Titulación,DIAC,Registro Curricular y Titulación,Técnico Asistente,analista.registro@cftestatalaricayparinacota.cl,2023-06-01,,Indefinido
49,Max Daniel Andrés,Tapia,Cifuentes,19.711.448-7,1998-01-07,M,No,986192888,"984164224, Cristina Cifuentes (madre)",Soltero,max.tapia.cifuentes98@gmail.com,"Villa Araucaria, Pasaje Araucaria N°2178",--,Abogado,,Analista de Gestión de Personas,DEA,Subdirección de Gestión de Personas,Profesional Asistente,analista.gp@cftestatalaricayparinacota.cl,2025-02-01,2027-01-31,Plazo Fijo
50,Patricio Andrés,Tapia,Muñoz,16.467.690-0,1986-11-21,M,Sí,986034668,"991067644, Carolina Álvarez, (cónyuge)",Casado,patriciotapiam86@gmail.com,Caupolicán N°1739,---,Ingeniero Civil Eléctrico,,Jefe de Carrera TNS en Proyectos Eléctricos de Distribución,DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.electrico@cftestatalaricayparinacota.cl,2023-07-17,2023-12-31,Indefinido
51,Yahivett Katalina,Tarque,Sosa,20.215.452-2,1999-07-10,F,No,977033678,990912025 Mirtha Sosa (madre),Soltera,yahivettt@gmail.com,Los Faisanes N°2540,Clase B,Contadora Auditora - Contadora Pública,,Asistente de Adquisiciones y Compras Públicas,DEA,Adquisiciones y Compras Públicas,Técnico Asistente,asistente.compraspublicas@cftestatalaricayparinacota.cl,2025-02-01,2027-01-31,Plazo Fijo
52,Vanessa De los Andes,Tavali,Cortés,18.315.488-5,1993-04-29,F,Si,67530182,"84981460, Angel Tavali (Padre) - 20384099, Suellen Tavali (Hermana)",Soltera,vanessa019@hotmail.es,"Pasaje Managua N°2405, Población Saucache",Clase B,TNS en Educación Especial,,Encargada de Admisión,DIAC,Subdirección Académica de Vinculación con el Medio,Técnico Encargado,admision@cftestatalaricayparinacota.cl,2023-05-01,,Indefinido
53,Sebastián Arturo,Troncoso,Bruna,16.909.345-8,1988-07-09,M,Si,968537736,"978443317, Silvana Bruna (Madre)",Soltero,troncosobruna@gmail.com,"Paris N°3095, Block 5, departamento 44",---,Ingeniero Civil Industrial,,Jefe de Carrera TNS Control de Gestión y Logística y TNS en Gestión de Comercio Exterior,DIAC,Subdirección Académica de Área Formativa,Profesioinal Encargado,jc.gestionycomercio@cftestatalaricayparinacota.cl,2023-03-13,,Indefinido
54,Mireya Fernanda,Urrutia,De la Fuente,15.475.773-2,1982-12-27,F,Si,69182662,957538502 Cecilia De la fuente Vera (Tía),Soltera,u.fernanda@gmail.com,"Manuel Castillo Ibaceta N°2925, depto 223, torre 2",Clase B,Ingeniera Comercial,,"Jefa de Carrera TNS en Administración de Empresas, TNS en Gestión de RRHH y TNS en Gestión Contable",DIAC,Subdirección Académica de Áreas Formativas,Profesional Encargado,jc.empresas@cftestatalaricayparinacota.cl,2022-06-01,,Indefinido
55,Nélida Patricia,Valderrama,Toro,14.111.126-4,1981-02-21,F,Si,71801873,"99764294, Nélida Toro (Madre)",Soltera,patricia_valderrama81@hotmail.com,Francisco Urzúa N°4551,---,Licencia de Educación Media Humanístico Científica,,Auxiliar,DEA,Servicios Generales y Operación,Auxiliar,nelida.valderrama@cftestatalaricayparinacota.cl,2023-02-01,,Indefinido
56,Reinaldo Ernesto,Valencia,Honores,10.674.389-4,1970-11-24,M,Si,74011673,59512599 Cecilia Hazaldine (Esposa),Casado,reinaldovalenciahonores@gmail.com,"Pasaje Munich 2142, Población Radio El Morro",---,Profesor de Educación Media en Inglés,Magíster en Didáctica para la Educación Superior,Asesor Técnico Pedagógico,DIAC,Subdirección Académica de Docencia,Profesional Encargado,atp@cftestatalaricayparinacota.cl,2021-02-17,,Indefinido
57,Benjamín Humberto,Vega,Navarro,15.000.514-0,1982-02-03,M,Si,950733596,"97548021, Cristina Navarro (Mamá)",Soltero,benix_2@hotmail.com,"Valle de Lluta Km. 18 1/2, Coop. Las Gaviotas, parcela 14",Clase B,TNS en Producción Industrial,,Coordinador de Campus,DIAC,Dirección Académica,Técnico Asistente,coordinacion@cftestatalaricayparinacota.cl,2025-03-01,2027-02-28,Plazo Fijo
58,Jean Carlo,Venegas,Jéldrez,19.435.009-0,1997-01-03,M,Si,954486641,54485432 - Luisa Jéldrez (Mamá),Soltero,jeanvenegasjeldrez@gmail.com,"Humberto Cross N°1807, Población Tucapel 7, Arica",,Ingeniero de Ejecución en Control de Gestión,,Profesional Encargado en Servicios Generales y Operación,DEA,Servicios Generales y Operación,Profesional Encargado,logistica@cftestatalaricayparinacota.cl,2024-11-01,2026-12-31,Plazo Fijo
59,Claudia Alejandra,Zamorano,Chia,12.611.330-7,1974-01-13,F,Si,99980473,"92194556, Aldo López Cavarrubias (Cónyuge)",Casada,cazamoranoch@gmail.com,"Avenida Senador Humberto Palza N°3148, departamento 705",---,Ingeniero Civil Industrial,Magíster en Gestión Empresarial,Directora Económica y Administrativa - Rectora(s),RECTORÍA,Rectoría,Rectoría,rectora@cftestatalaricayparinacota.cl,2021-03-08,,Indefinido
60,Angélica Del Rosario,Zenis,Altina,13.211.505-2,1976-10-23,F,Si,977417807,"Gloria Zenis Altina, hermana: 995253075",Soltera,azenisa@gmail.com,Tegucigalpa N°2430,,Contador Auditor - Contador Público,,Profesional Encargada de Tesorería y Contabilidad,DEA,Subdirección de Contabilidad y Presupuesto,Profesional Encargado,tesoreria@cftestatalaricayparinacota.cl,2023-03-06,2023-08-31,Indefinido
61,Gabriela Paola,Zorrilla,Neumann,16.294.697-8,1986-08-15,F,No,966796106,"982489167, José Zorrilla (Padre) / 992404753, Erna Neumann (Mamá)",Soltera,gabypaolaz@gmail.com,Yungay N°503,---,Psicopedagoga,Magister en Educación con mención en Gestión de Calidad,Asesora Técnica Pedagógica,DIAC,Subdirección Académica de Docencia,Profesional Encargado,asesora.t.pedagogica@cftestatalaricayparinacota.cl,2022-03-22,2022-07-31,Indefinido`;

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = [];
    let headerLine = lines[0];
    
    // Parse header
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < headerLine.length; i++) {
        const char = headerLine[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            headers.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    headers.push(current.trim());

    // Parse rows
    return lines.slice(1).map(row => {
        const values = [];
        current = '';
        inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current);
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current);

        const obj = {};
        headers.forEach((h, i) => {
            obj[h] = values[i] || '';
        });
        return obj;
    });
}

function getAvatarUrl(firstName, lastName) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(firstName + ' ' + lastName)}&background=random`;
}

async function sync() {
    const employees = parseCSV(csvData);
    console.log(`Parsed ${employees.length} employees from CSV.`);

    // Get existing employees
    const snapshot = await getDocs(collection(db, COLLECTION_NAME));
    const existingEmployees = {};
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.rut) {
            existingEmployees[data.rut] = { id: docSnap.id, ...data };
        }
    });
    console.log(`Found ${Object.keys(existingEmployees).length} existing employees in Firestore.`);

    let updated = 0;
    let added = 0;
    let skipped = 0;

    for (const emp of employees) {
        if (!emp.Rut || emp.Rut.trim() === '') {
            skipped++;
            continue;
        }

        const rut = emp.Rut.trim();
        const docId = rut.replace(/\./g, '').replace(/-/g, '').toLowerCase();

        const existing = existingEmployees[rut];
        
        const employeeData = {
            firstName: emp.Nombres || '',
            lastNamePaternal: emp['Primer Apellido'] || '',
            lastNameMaternal: emp['Segundo Apellido'] || '',
            rut: rut,
            position: emp.Cargo || '',
            department: emp['Área'] || emp['Dirección'] || '',
            birthDate: emp['Fecha de Nacimiento'] || '',
            hireDate: emp['Fecha Ingreso'] || '',
            email: emp['Correo Institucional'] || '',
            emailPersonal: emp['Email Personal'] || '',
            emergencyContact: emp['Contacto Familiar'] || '',
            avatarUrl: getAvatarUrl(emp.Nombres || '', emp['Primer Apellido'] || ''),
            // Preserve existing balances or use defaults
            totalVacationDays: existing?.totalVacationDays ?? 15,
            usedVacationDays: existing?.usedVacationDays ?? 0,
            totalAdminDays: existing?.totalAdminDays ?? 6,
            usedAdminDays: existing?.usedAdminDays ?? 0,
            totalSickLeaveDays: existing?.totalSickLeaveDays ?? 0,
            usedSickLeaveDays: existing?.usedSickLeaveDays ?? 0,
            jefaturaNombre: existing?.jefaturaNombre ?? '',
            jefaturaEmail: existing?.jefaturaEmail ?? '',
            id: docId
        };

        const docRef = doc(db, COLLECTION_NAME, docId);
        await setDoc(docRef, employeeData, { merge: true });
        
        if (existing) {
            updated++;
        } else {
            added++;
        }
        
        console.log(`${existing ? 'Updated' : 'Added'}: ${employeeData.firstName} ${employeeData.lastNamePaternal}`);
    }

    console.log(`\nSync complete: ${updated} updated, ${added} added, ${skipped} skipped (no RUT).`);
    process.exit(0);
}

sync().catch(err => {
    console.error('Error during sync:', err);
    process.exit(1);
});
