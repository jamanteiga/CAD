// Textos de las funciones v8 (multilíneas, sólidos, vistas, instalaciones, SIG/DWG, colaboración, tableta)
// en los cinco idiomas. Se incorporan a las tablas generales al cargar i18n.js.

// Interfaz: castellano | galego | English | português | català
const UI8 = `
Achaflanar arista | Achafranar aresta | Chamfer Edge | Chanfrar aresta | Xamfranar aresta
Aislamiento (m²) | Illamento (m²) | Insulation (m²) | Isolamento (m²) | Aïllament (m²)
Altura del nivel sobre la bomba (m, negativo si aspira) | Altura do nivel sobre a bomba (m, negativo se aspira) | Liquid level above pump (m, negative for suction lift) | Altura do nível sobre a bomba (m, negativo se aspira) | Alçada del nivell sobre la bomba (m, negatiu si aspira)
Altura libre (m) | Altura libre (m) | Clear height (m) | Pé-direito (m) | Alçada lliure (m)
Asociativo | Asociativo | Associative | Associativo | Associatiu
Atributo único | Atributo único | Single attribute | Atributo único | Atribut únic
Aéreo (Esri World Imagery) | Aéreo (Esri World Imagery) | Aerial (Esri World Imagery) | Aéreo (Esri World Imagery) | Aeri (Esri World Imagery)
Bloques del dibujo | Bloques do debuxo | Drawing blocks | Blocos do desenho | Blocs del dibuix
Brida EN 1092-1 | Brida EN 1092-1 | EN 1092-1 Flange | Flange EN 1092-1 | Brida EN 1092-1
Buenas prácticas de ingeniería; sin marcado CE | Boas prácticas de enxeñaría; sen marcado CE | Sound engineering practice; no CE marking | Boas práticas de engenharia; sem marcação CE | Bones pràctiques d'enginyeria; sense marcatge CE
Calefacción (W) | Calefacción (W) | Heating (W) | Aquecimento (W) | Calefacció (W)
Capas reservadas: {0} | Capas reservadas: {0} | Reserved layers: {0} | Camadas reservadas: {0} | Capes reservades: {0}
Cargas térmicas | Cargas térmicas | Thermal Loads | Cargas térmicas | Càrregues tèrmiques
Cargas térmicas por recinto (orientativo) | Cargas térmicas por recinto (orientativo) | Room thermal loads (guidance) | Cargas térmicas por espaço (indicativo) | Càrregues tèrmiques per recinte (orientatiu)
Categoría PED | Categoría PED | PED category | Categoria PED | Categoria PED
Clave de acceso (opcional) | Clave de acceso (opcional) | Access key (optional) | Chave de acesso (opcional) | Clau d'accés (opcional)
Colaboración | Colaboración | Collaboration | Colaboração | Col·laboració
Colaborar en directo | Colaborar en directo | Live Collaboration | Colaborar em direto | Col·laborar en directe
Comentar | Comentar | Comment | Comentar | Comentar
Comentario | Comentario | Comment | Comentário | Comentari
Comentario sobre {0}: | Comentario sobre {0}: | Comment on {0}: | Comentário sobre {0}: | Comentari sobre {0}:
Comentarios | Comentarios | Comments | Comentários | Comentaris
Condiciones | Condicións | Conditions | Condições | Condicions
Conductos 3D | Condutos 3D | 3D Ducts | Condutas 3D | Conductes 3D
Conversor DWG | Conversor DWG | DWG Converter | Conversor DWG | Convertidor DWG
Conversor DWG externo (opcional) | Conversor DWG externo (opcional) | External DWG converter (optional) | Conversor DWG externo (opcional) | Convertidor DWG extern (opcional)
Convertir en malla | Converter en malla | Convert to Mesh | Converter em malha | Convertir en malla
Corte | Corte | Slice | Corte | Tall
Cota de conducto | Cota de conduto | Duct Elevation | Cota da conduta | Cota de conducte
Cuadro del anexo II | Cadro do anexo II | Annex II table | Quadro do anexo II | Quadre de l'annex II
Cálculo de tubería | Cálculo de tubaxe | Pipe calculation | Cálculo de tubagem | Càlcul de canonada
Cálculo de tubería (agua) | Cálculo de tubaxe (auga) | Pipe calculation (water) | Cálculo de tubagem (água) | Càlcul de canonada (aigua)
Código de diseño | Código de deseño | Design code | Código de projeto | Codi de disseny
DN (tuberías) | DN (tubaxes) | DN (piping) | DN (tubagens) | DN (canonades)
Desde archivo (referencia) | Desde ficheiro (referencia) | From file (reference) | De ficheiro (referência) | Des de fitxer (referència)
Desnivel a vencer (m) | Desnivel a vencer (m) | Static head (m) | Desnível a vencer (m) | Desnivell a vèncer (m)
Diámetro interior (mm) | Diámetro interior (mm) | Inner diameter (mm) | Diâmetro interior (mm) | Diàmetre interior (mm)
Editar multilínea | Editar multiliña | Edit Multiline | Editar multilinha | Editar multilínia
Empalmar arista | Empalmar aresta | Fillet Edge | Concordar aresta | Arrodonir aresta
Envolvente | Envolvente | Envelope | Envolvente | Envolupant
Escala (unidades del archivo → dibujo) | Escala (unidades do ficheiro → debuxo) | Scale (file units → drawing) | Escala (unidades do ficheiro → desenho) | Escala (unitats del fitxer → dibuix)
Estado del fluido | Estado do fluído | Fluid state | Estado do fluido | Estat del fluid
Estilos y normas | Estilos e normas | Styles and Standards | Estilos e normas | Estils i normes
Etiquetar P&ID | Etiquetar P&ID | Tag P&ID | Etiquetar P&ID | Etiquetar P&ID
Factor de fricción (Colebrook) | Factor de fricción (Colebrook) | Friction factor (Colebrook) | Fator de atrito (Colebrook) | Factor de fricció (Colebrook)
Factor solar g | Factor solar g | Solar factor g | Fator solar g | Factor solar g
Fluido | Fluído | Fluid | Fluido | Fluid
Fracción acristalada | Fracción envidrada | Glazed fraction | Fração envidraçada | Fracció vidrada
Fracción de perímetro exterior | Fracción de perímetro exterior | Exterior perimeter fraction | Fração de perímetro exterior | Fracció de perímetre exterior
Gas, gas licuado o vapor | Gas, gas licuado ou vapor | Gas, liquefied gas or vapour | Gás, gás liquefeito ou vapor | Gas, gas liquat o vapor
Grupo 1 (peligroso) | Grupo 1 (perigoso) | Group 1 (dangerous) | Grupo 1 (perigoso) | Grup 1 (perillós)
Grupo 2 | Grupo 2 | Group 2 | Grupo 2 | Grup 2
Grupo de fluido | Grupo de fluído | Fluid group | Grupo de fluido | Grup de fluid
Guardar como DWG | Gardar como DWG | Save as DWG | Guardar como DWG | Desa com a DWG
HOJA DE DATOS | FOLLA DE DATOS | DATASHEET | FOLHA DE DADOS | FULL DE DADES
Hoja de datos — equipo a presión (PED 2014/68/UE) | Folla de datos — equipo a presión (PED 2014/68/UE) | Datasheet — pressure equipment (PED 2014/68/EU) | Folha de dados — equipamento sob pressão (PED 2014/68/UE) | Full de dades — equip a pressió (PED 2014/68/UE)
Hoja PED | Folla PED | PED Datasheet | Folha PED | Full PED
Importar IFC/STEP | Importar IFC/STEP | Import IFC/STEP | Importar IFC/STEP | Importar IFC/STEP
Importar modelo 3D | Importar modelo 3D | Import 3D model | Importar modelo 3D | Importar model 3D
Importar SHP/GeoJSON | Importar SHP/GeoJSON | Import SHP/GeoJSON | Importar SHP/GeoJSON | Importar SHP/GeoJSON
Importar y exportar | Importar e exportar | Import and Export | Importar e exportar | Importar i exportar
Insertar tabla de dimensiones | Inserir táboa de dimensións | Insert dimension table | Inserir tabela de dimensões | Inserir taula de dimensions
Insertar vista | Inserir vista | Insert View | Inserir vista | Inserir vista
Isométrica | Isométrica | Isometric | Isométrica | Isomètrica
La capa {0} está reservada por {1}. ¿Liberarla igualmente? | A capa {0} está reservada por {1}. Liberala igualmente? | Layer {0} is reserved by {1}. Release it anyway? | A camada {0} está reservada por {1}. Libertá-la mesmo assim? | La capa {0} està reservada per {1}. Alliberar-la igualment?
Lista de materiales | Lista de materiais | Bill of Materials | Lista de materiais | Llista de materials
Lista de válvulas | Lista de válvulas | Valve List | Lista de válvulas | Llista de vàlvules
Líquido | Líquido | Liquid | Líquido | Líquid
Margen (m) | Marxe (m) | Margin (m) | Margem (m) | Marge (m)
Material | Material | Material | Material | Material
Modo tableta | Modo tableta | Tablet Mode | Modo tablet | Mode tauleta
Módulos de evaluación | Módulos de avaliación | Conformity modules | Módulos de avaliação | Mòduls d'avaluació
NPSH (tramo de aspiración) | NPSH (tramo de aspiración) | NPSH (suction line) | NPSH (troço de aspiração) | NPSH (tram d'aspiració)
NPSH requerido (m) | NPSH requirido (m) | NPSH required (m) | NPSH requerido (m) | NPSH requerit (m)
Nadie respondió en la sesión {0}: se comparte el dibujo actual. | Ninguén respondeu na sesión {0}: compártese o debuxo actual. | Nobody answered in session {0}: the current drawing is shared. | Ninguém respondeu na sessão {0}: partilha-se o desenho atual. | Ningú no ha respost a la sessió {0}: es comparteix el dibuix actual.
No hay comentarios. Use COMENTAR para añadir uno. | Non hai comentarios. Use COMENTAR para engadir un. | There are no comments. Use COMMENT to add one. | Não há comentários. Use COMENTAR para adicionar um. | No hi ha comentaris. Utilitzeu COMENTAR per afegir-ne un.
Nombre visible para los demás | Nome visible para os demais | Name shown to others | Nome visível para os outros | Nom visible per als altres
Nota | Nota | Note | Nota | Nota
Ocupantes | Ocupantes | Occupants | Ocupantes | Ocupants
Orientación del hueco | Orientación do oco | Window orientation | Orientação do vão | Orientació del buit
Orientativo: verifique con el anexo II de la Directiva 2014/68/UE. | Orientativo: verifique co anexo II da Directiva 2014/68/UE. | Guidance only: check against Annex II of Directive 2014/68/EU. | Indicativo: verifique com o anexo II da Diretiva 2014/68/UE. | Orientatiu: verifiqueu amb l'annex II de la Directiva 2014/68/UE.
Presión absoluta en el depósito (bar) | Presión absoluta no depósito (bar) | Absolute tank pressure (bar) | Pressão absoluta no depósito (bar) | Pressió absoluta al dipòsit (bar)
Presión de prueba (bar) | Presión de proba (bar) | Test pressure (bar) | Pressão de ensaio (bar) | Pressió de prova (bar)
Presión de vapor (kPa) | Presión de vapor (kPa) | Vapour pressure (kPa) | Pressão de vapor (kPa) | Pressió de vapor (kPa)
Presión y P&ID | Presión e P&ID | Pressure and P&ID | Pressão e P&ID | Pressió i P&ID
Pulse F1 para obtener más ayuda | Prema F1 para obter máis axuda | Press F1 for more help | Prima F1 para obter mais ajuda | Premeu F1 per obtenir més ajuda
PS — presión máxima admisible (bar) | PS — presión máxima admisible (bar) | PS — maximum allowable pressure (bar) | PS — pressão máxima admissível (bar) | PS — pressió màxima admissible (bar)
Pérdida de carga y NPSH | Perda de carga e NPSH | Head Loss and NPSH | Perda de carga e NPSH | Pèrdua de càrrega i NPSH
Pérdida lineal (m.c.a.) | Perda lineal (m.c.a.) | Friction loss (m H2O) | Perda linear (m.c.a.) | Pèrdua lineal (m.c.a.)
Pérdida singular (m.c.a.) | Perda singular (m.c.a.) | Minor loss (m H2O) | Perda localizada (m.c.a.) | Pèrdua singular (m.c.a.)
Pérdida total (m.c.a.) | Perda total (m.c.a.) | Total loss (m H2O) | Perda total (m.c.a.) | Pèrdua total (m.c.a.)
Recinto | Recinto | Room | Espaço | Recinte
Recipiente | Recipiente | Vessel | Recipiente | Recipient
Refrigeración latente (W) | Refrixeración latente (W) | Latent cooling (W) | Arrefecimento latente (W) | Refrigeració latent (W)
Refrigeración sensible (W) | Refrixeración sensible (W) | Sensible cooling (W) | Arrefecimento sensível (W) | Refrigeració sensible (W)
Reservar capa | Reservar capa | Reserve Layer | Reservar camada | Reservar capa
Responder | Responder | Reply | Responder | Respondre
Rotular cada recinto | Rotular cada recinto | Label each room | Rotular cada espaço | Retolar cada recinte
Rugosidad (mm) | Rugosidade (mm) | Roughness (mm) | Rugosidade (mm) | Rugositat (mm)
Sección | Sección | Section | Secção | Secció
Sección de nube | Sección de nube | Cloud Section | Secção de nuvem | Secció de núvol
Sesión {0}: dibujo recibido. | Sesión {0}: debuxo recibido. | Session {0}: drawing received. | Sessão {0}: desenho recebido. | Sessió {0}: dibuix rebut.
SIG y DWG | SIX e DWG | GIS and DWG | SIG e DWG | SIG i DWG
Sobreespesor de corrosión (mm) | Sobreespesor de corrosión (mm) | Corrosion allowance (mm) | Sobre-espessura de corrosão (mm) | Sobregruix de corrosió (mm)
Suma de coeficientes K singulares | Suma de coeficientes K singulares | Sum of minor loss K | Soma dos coeficientes K | Suma de coeficients K singulars
T exterior invierno (°C) | T exterior inverno (°C) | Winter outdoor T (°C) | T exterior inverno (°C) | T exterior hivern (°C)
T exterior verano (°C) | T exterior verán (°C) | Summer outdoor T (°C) | T exterior verão (°C) | T exterior estiu (°C)
T interior invierno (°C) | T interior inverno (°C) | Winter indoor T (°C) | T interior inverno (°C) | T interior hivern (°C)
T interior verano (°C) | T interior verán (°C) | Summer indoor T (°C) | T interior verão (°C) | T interior estiu (°C)
Temperatura del agua (°C) | Temperatura da auga (°C) | Water temperature (°C) | Temperatura da água (°C) | Temperatura de l'aigua (°C)
Tiempo real | Tempo real | Real Time | Tempo real | Temps real
Tiempo real en la nube no disponible ({0}); se usa el canal local del navegador. | Tempo real na nube non dispoñible ({0}); úsase a canle local do navegador. | Cloud real time unavailable ({0}); using the browser's local channel. | Tempo real na nuvem indisponível ({0}); usa-se o canal local do navegador. | Temps real al núvol no disponible ({0}); s'utilitza el canal local del navegador.
Tornillos | Parafusos | Bolts | Parafusos | Cargols
TOTAL | TOTAL | TOTAL | TOTAL | TOTAL
TS — temperatura máx./mín. (°C) | TS — temperatura máx./mín. (°C) | TS — max./min. temperature (°C) | TS — temperatura máx./mín. (°C) | TS — temperatura màx./mín. (°C)
U hueco (W/m²K) | U oco (W/m²K) | U window (W/m²K) | U vão (W/m²K) | U buit (W/m²K)
U muro (W/m²K) | U muro (W/m²K) | U wall (W/m²K) | U parede (W/m²K) | U mur (W/m²K)
URL del servicio (POST con el DXF, devuelve DWG) | URL do servizo (POST co DXF, devolve DWG) | Service URL (POST the DXF, returns DWG) | URL do serviço (POST com o DXF, devolve DWG) | URL del servei (POST amb el DXF, retorna DWG)
Uso | Uso | Use | Utilização | Ús
V — volumen (L) | V — volume (L) | V — volume (L) | V — volume (L) | V — volum (L)
Velocidad (m/s) | Velocidade (m/s) | Velocity (m/s) | Velocidade (m/s) | Velocitat (m/s)
Ventilación (l/s·persona) | Ventilación (l/s·persoa) | Ventilation (l/s·person) | Ventilação (l/s·pessoa) | Ventilació (l/s·persona)
Ventilación (m³/h) | Ventilación (m³/h) | Ventilation (m³/h) | Ventilação (m³/h) | Ventilació (m³/h)
Versión DWG | Versión DWG | DWG version | Versão DWG | Versió DWG
Vista base | Vista base | Base View | Vista base | Vista base
Vistas de dibujo | Vistas de debuxo | Drawing Views | Vistas de desenho | Vistes de dibuix
anclado a {0} | ancorado a {0} | anchored to {0} | ancorado a {0} | ancorat a {0}
canal local (pestañas de este navegador) | canle local (lapelas deste navegador) | local channel (tabs in this browser) | canal local (separadores deste navegador) | canal local (pestanyes d'aquest navegador)
gas | gas | gas | gás | gas
grupo | grupo | group | grupo | grup
líquido | líquido | liquid | líquido | líquid
objeto borrado | obxecto borrado | erased object | objeto apagado | objecte esborrat
Δp total con desnivel (kPa) | Δp total con desnivel (kPa) | Total Δp with static head (kPa) | Δp total com desnível (kPa) | Δp total amb desnivell (kPa)
Ir | Ir | Go | Ir | Anar
Resolver | Resolver | Resolve | Resolver | Resoldre
Reabrir | Reabrir | Reopen | Reabrir | Reobrir
Suprimir | Suprimir | Delete | Suprimir | Suprimir
Comando | Comando | Command | Comando | Ordre
Texto M | Texto M | MText | Texto M | Text M
Mover con línea de cota | Mover con liña de cota | Move with Dim Line | Mover com linha de cota | Moure amb línia de cota
Mover solo texto | Mover só texto | Move Text Only | Mover só texto | Moure només el text
Encima de línea de cota | Enriba da liña de cota | Above Dim Line | Acima da linha de cota | A sobre de la línia de cota
Centrar verticalmente | Centrar verticalmente | Center Vertically | Centrar verticalmente | Centrar verticalment
Restablecer posición de texto | Restablecer posición do texto | Reset Text Position | Repor posição do texto | Restablir la posició del text
Cota continua | Cota continua | Continue Dimension | Cota contínua | Cota contínua
Cota de línea base | Cota de liña base | Baseline Dimension | Cota de linha de base | Cota de línia base
Mecánica | Mecánica | Mechanical | Mecânica | Mecànica
Tubería | Tubaxe | Piping | Tubagem | Canonada
Especificación | Especificación | Specification | Especificação | Especificació
Especificación de tubería | Especificación de tubaxe | Piping specification | Especificação de tubagem | Especificació de canonada
Brida | Brida | Flange | Flange | Brida
Bridas ASME B16.5 | Bridas ASME B16.5 | ASME B16.5 Flanges | Flanges ASME B16.5 | Brides ASME B16.5
Brida ASME B16.5 | Brida ASME B16.5 | ASME B16.5 flange | Flange ASME B16.5 | Brida ASME B16.5
Cuello para soldar (WN) | Colo para soldar (WN) | Weld neck (WN) | Pescoço para soldar (WN) | Coll per soldar (WN)
Plana deslizante (SO) | Plana deslizante (SO) | Slip-on (SO) | Plana deslizante (SO) | Plana lliscant (SO)
Cuello largo (LWN) | Colo longo (LWN) | Long weld neck (LWN) | Pescoço longo (LWN) | Coll llarg (LWN)
Ciega | Cega | Blind | Cega | Cega
Cara | Cara | Facing | Face | Cara
Cara con resalte (RF) | Cara con resalte (RF) | Raised face (RF) | Face com ressalto (RF) | Cara amb ressalt (RF)
Cara plana (FF) | Cara plana (FF) | Flat face (FF) | Face plana (FF) | Cara plana (FF)
Junta de anillo (RTJ) | Xunta de anel (RTJ) | Ring type joint (RTJ) | Junta de anel (RTJ) | Junta d'anell (RTJ)
Clase | Clase | Class | Classe | Classe
Clase de bridas | Clase de bridas | Flange class | Classe das flanges | Classe de brides
Norma del tubo | Norma do tubo | Pipe standard | Norma do tubo | Norma del tub
Diámetro (NPS) | Diámetro (NPS) | Size (NPS) | Diâmetro (NPS) | Diàmetre (NPS)
Serie (schedule) | Serie (schedule) | Schedule | Série (schedule) | Sèrie (schedule)
Diámetro exterior (mm) | Diámetro exterior (mm) | Outside diameter (mm) | Diâmetro exterior (mm) | Diàmetre exterior (mm)
Espesor (mm) | Espesor (mm) | Wall thickness (mm) | Espessura (mm) | Gruix (mm)
Longitud LWN (pulgadas) | Lonxitude LWN (polgadas) | LWN length (inches) | Comprimento LWN (polegadas) | Longitud LWN (polzades)
Lateral (alzado) | Lateral (alzado) | Side (elevation) | Lateral (alçado) | Lateral (alçat)
Frontal | Frontal | Front | Frontal | Frontal
Codo | Cóbado | Elbow | Curva | Colze
Codo ASME B16.9 | Cóbado ASME B16.9 | ASME B16.9 elbow | Curva ASME B16.9 | Colze ASME B16.9
Radio largo (1,5 D) | Raio longo (1,5 D) | Long radius (1.5 D) | Raio longo (1,5 D) | Radi llarg (1,5 D)
Radio corto (1 D) | Raio curto (1 D) | Short radius (1 D) | Raio curto (1 D) | Radi curt (1 D)
radio largo | raio longo | long radius | raio longo | radi llarg
radio corto | raio curto | short radius | raio curto | radi curt
de radio largo | de raio longo | long radius | de raio longo | de radi llarg
de radio corto | de raio curto | short radius | de raio curto | de radi curt
Sin codo (inglete) | Sen cóbado (inglete) | No elbow (mitre) | Sem curva (meia-esquadria) | Sense colze (biaix)
Codos en los quiebros | Cóbados nos cambios de dirección | Elbows at bends | Curvas nas mudanças de direção | Colzes als canvis de direcció
Codos | Cóbados | Elbows | Curvas | Colzes
Mostrar espesor (ocultas) | Mostrar espesor (ocultas) | Show wall (hidden lines) | Mostrar espessura (ocultas) | Mostrar gruix (ocultes)
Representación | Representación | Representation | Representação | Representació
Doble línea | Dobre liña | Double line | Linha dupla | Doble línia
Unifilar | Unifilar | Single line | Unifilar | Unifilar
Reducción | Redución | Reducer | Redução | Reducció
Reducción ASME B16.9 | Redución ASME B16.9 | ASME B16.9 reducer | Redução ASME B16.9 | Reducció ASME B16.9
Reducción concéntrica | Redución concéntrica | Concentric Reducer | Redução concêntrica | Reducció concèntrica
Reducción excéntrica | Redución excéntrica | Eccentric Reducer | Redução excêntrica | Reducció excèntrica
Concéntrica | Concéntrica | Concentric | Concêntrica | Concèntrica
Excéntrica | Excéntrica | Eccentric | Excêntrica | Excèntrica
concéntrica | concéntrica | concentric | concêntrica | concèntrica
excéntrica | excéntrica | eccentric | excêntrica | excèntrica
excentricidad | excentricidade | eccentricity | excentricidade | excentricitat
Generatriz plana | Xeratriz plana | Flat side | Geratriz plana | Generatriu plana
Abajo (FOB) | Abaixo (FOB) | Bottom (FOB) | Em baixo (FOB) | A baix (FOB)
Arriba (FOT) | Arriba (FOT) | Top (FOT) | Em cima (FOT) | A dalt (FOT)
Extremo pequeño (NPS) | Extremo pequeno (NPS) | Small end (NPS) | Extremo pequeno (NPS) | Extrem petit (NPS)
Extremo pequeño Ø (mm) | Extremo pequeno Ø (mm) | Small end Ø (mm) | Extremo pequeno Ø (mm) | Extrem petit Ø (mm)
Espesor extremo pequeño (mm) | Espesor extremo pequeno (mm) | Small end wall (mm) | Espessura do extremo pequeno (mm) | Gruix extrem petit (mm)
Te | Te | Tee | Tê | Te
Te ASME B16.9 | Te ASME B16.9 | ASME B16.9 tee | Tê ASME B16.9 | Te ASME B16.9
Cruz | Cruz | Cross | Cruzeta | Creu
Cruz ASME B16.9 | Cruz ASME B16.9 | ASME B16.9 cross | Cruzeta ASME B16.9 | Creu ASME B16.9
Igual | Igual | Equal | Igual | Igual
Reducida | Reducida | Reducing | Reduzida | Reduïda
igual | igual | equal | igual | igual
reducida | reducida | reducing | reduzida | reduïda
Derivación (NPS) | Derivación (NPS) | Branch (NPS) | Derivação (NPS) | Derivació (NPS)
Derivación Ø (mm) | Derivación Ø (mm) | Branch Ø (mm) | Derivação Ø (mm) | Derivació Ø (mm)
Espesor derivación (mm) | Espesor derivación (mm) | Branch wall (mm) | Espessura da derivação (mm) | Gruix derivació (mm)
Casquete | Casquete | Cap | Tampão | Casquet
Casquete ASME B16.9 | Casquete ASME B16.9 | ASME B16.9 cap | Tampão ASME B16.9 | Casquet ASME B16.9
Manguito | Manguito | Coupling | Uniões | Maniguet
Medio manguito | Medio manguito | Half coupling | Meia união | Mig maniguet
Manguito ASME B16.11 | Manguito ASME B16.11 | ASME B16.11 coupling | União ASME B16.11 | Maniguet ASME B16.11
Completo socket weld | Completo socket weld | Full coupling, socket weld | Completa socket weld | Complet socket weld
Medio socket weld | Medio socket weld | Half coupling, socket weld | Meia socket weld | Mig socket weld
Completo roscado NPT | Completo roscado NPT | Full coupling, NPT threaded | Completa roscada NPT | Complet roscat NPT
Medio roscado NPT | Medio roscado NPT | Half coupling, NPT threaded | Meia roscada NPT | Mig roscat NPT
roscado NPT | roscado NPT | NPT threaded | roscada NPT | roscat NPT
Tubo | Tubo | Pipe | Tubo | Tub
Accesorios | Accesorios | Fittings | Acessórios | Accessoris
Listados | Listaxes | Lists | Listagens | Llistats
Tabla de bridas | Táboa de bridas | Flange Table | Tabela de flanges | Taula de brides
Tabla de bridas ASME B16.5 | Táboa de bridas ASME B16.5 | ASME B16.5 flange table | Tabela de flanges ASME B16.5 | Taula de brides ASME B16.5
Pos. | Pos. | Item | Pos. | Pos.
Cant. | Cant. | Qty | Qtd. | Quant.
Ud. | Ud. | Unit | Un. | Ut.
ud | ud | pcs | un | ut
Peso (kg) | Peso (kg) | Weight (kg) | Peso (kg) | Pes (kg)
Taladros | Furados | Holes | Furos | Forats
taladro | furado | hole | furo | forat
círculo | círculo | bolt circle | círculo | cercle
Círculo | Círculo | Bolt circle | Círculo | Cercle
centro a cara | centro a cara | center to face | centro a face | centre a cara
centro a centro | centro a centro | center to center | centro a centro | centre a centre
cortado | cortado | cut | cortada | tallat
interior | interior | inside | interior | interior
aprox. | aprox. | approx. | aprox. | aprox.
mín. | mín. | min. | mín. | mín.
diámetros | diámetros | sizes | diâmetros | diàmetres
Diámetro no disponible. | Diámetro non dispoñible. | Size not available. | Diâmetro não disponível. | Diàmetre no disponible.
Sin brida B16.5 para este diámetro y clase | Sen brida B16.5 para este diámetro e clase | No B16.5 flange for this size and class | Sem flange B16.5 para este diâmetro e classe | Sense brida B16.5 per a aquest diàmetre i classe
No existe brida de clase {0} para {1} en ASME B16.5. | Non existe brida de clase {0} para {1} en ASME B16.5. | ASME B16.5 has no Class {0} flange for {1}. | Não existe flange de classe {0} para {1} na ASME B16.5. | No hi ha brida de classe {0} per a {1} a ASME B16.5.
ASME B16.5 no incluye bridas SO de clase {0} en {1}. | ASME B16.5 non inclúe bridas SO de clase {0} en {1}. | ASME B16.5 has no Class {0} slip-on flange in {1}. | A ASME B16.5 não inclui flanges SO de classe {0} em {1}. | ASME B16.5 no inclou brides SO de classe {0} en {1}.
No hay anillo RTJ normalizado para clase {0} en {1}. | Non hai anel RTJ normalizado para clase {0} en {1}. | No standard RTJ ring for Class {0} in {1}. | Não há anel RTJ normalizado para classe {0} em {1}. | No hi ha anell RTJ normalitzat per a classe {0} en {1}.
No hay codo {0} de {1} en ASME B16.9. | Non hai cóbado {0} de {1} en ASME B16.9. | ASME B16.9 has no {0} elbow in {1}. | Não há curva {0} de {1} na ASME B16.9. | No hi ha colze {0} de {1} a ASME B16.9.
ASME B16.9 no define codos de 45° de radio corto. | ASME B16.9 non define cóbados de 45° de raio curto. | ASME B16.9 does not cover 45° short radius elbows. | A ASME B16.9 não define curvas de 45° de raio curto. | ASME B16.9 no defineix colzes de 45° de radi curt.
No hay reducción en ASME B16.9 para {0}. | Non hai redución en ASME B16.9 para {0}. | ASME B16.9 has no reducer for {0}. | Não há redução na ASME B16.9 para {0}. | No hi ha reducció a ASME B16.9 per a {0}.
El extremo pequeño debe ser menor que el grande. | O extremo pequeno debe ser menor có grande. | The small end must be smaller than the large end. | O extremo pequeno deve ser menor que o grande. | L'extrem petit ha de ser més petit que el gran.
La derivación no puede ser mayor que el colector. | A derivación non pode ser maior có colector. | The branch cannot be larger than the run. | A derivação não pode ser maior que o coletor. | La derivació no pot ser més gran que el col·lector.
ASME B16.11 no incluye este manguito en clase {0}. | ASME B16.11 non inclúe este manguito en clase {0}. | ASME B16.11 does not cover this coupling in Class {0}. | A ASME B16.11 não inclui esta união na classe {0}. | ASME B16.11 no inclou aquest maniguet en classe {0}.
Abrazadera en U | Abrazadeira en U | U-bolt | Abraçadeira em U | Abraçadora en U
Accesorio forjado ASME B16.11 | Accesorio forxado ASME B16.11 | ASME B16.11 forged fitting | Acessório forjado ASME B16.11 | Accessori forjat ASME B16.11
Accionamiento | Accionamento | Operator | Acionamento | Accionament
Actuador eléctrico | Actuador eléctrico | Electric actuator | Atuador elétrico | Actuador elèctric
Actuador neumático | Actuador pneumático | Pneumatic actuator | Atuador pneumático | Actuador pneumàtic
Agua (líquido) | Auga (líquido) | Water (liquid) | Água (líquido) | Aigua (líquid)
Aislamiento | Illamento | Insulation | Isolamento | Aïllament
Aislamiento térmico | Illamento térmico | Thermal insulation | Isolamento térmico | Aïllament tèrmic
Altura / longitud de varilla (mm) | Altura / lonxitude de variña (mm) | Height / rod length (mm) | Altura / comprimento do varão (mm) | Alçada / longitud de vareta (mm)
Altura total | Altura total | Overall height | Altura total | Alçada total
Altura total aprox. | Altura total aprox. | Approx. overall height | Altura total aprox. | Alçada total aprox.
Alzado a escala | Alzado a escala | Scaled elevation | Alçado à escala | Alçat a escala
Anchura del símbolo (mm) | Anchura do símbolo (mm) | Symbol width (mm) | Largura do símbolo (mm) | Amplada del símbol (mm)
Anillo RTJ octogonal (B16.20) | Anel RTJ octogonal (B16.20) | Octagonal RTJ ring (B16.20) | Anel RTJ octogonal (B16.20) | Anell RTJ octogonal (B16.20)
Anillo espaciador | Anel espaciador | Paddle spacer | Anel espaçador | Anell espaiador
Anillo espaciador (paddle spacer) | Anel espaciador (paddle spacer) | Paddle spacer | Anel espaçador (paddle spacer) | Anell espaiador (paddle spacer)
Apoyos | Apoios | Supports | Apoios | Suports
Aspiración | Aspiración | Suction | Aspiração | Aspiració
Aspiración (NPS) | Aspiración (NPS) | Suction (NPS) | Aspiração (NPS) | Aspiració (NPS)
Automática (sin escala) | Automática (sen escala) | Automatic (not to scale) | Automática (sem escala) | Automàtica (sense escala)
Bola | Bóla | Ball | Esfera | Bola
Bomba | Bomba | Pump | Bomba | Bomba
Bomba centrífuga | Bomba centrífuga | Centrifugal pump | Bomba centrífuga | Bomba centrífuga
Brida opuesta | Brida oposta | Mating flange | Flange oposta | Brida oposada
Bridas | Bridas | Flanges | Flanges | Brides
Bridas FF | Bridas FF | Flanged FF | Flangeadas FF | Brides FF
Bridas RF | Bridas RF | Flanged RF | Flangeadas RF | Brides RF
Bridas RTJ | Bridas RTJ | Flanged RTJ | Flangeadas RTJ | Brides RTJ
Bridas de orificio | Bridas de orificio | Orifice flanges | Flanges de orifício | Brides d'orifici
Bridas de orificio ASME B16.36 | Bridas de orificio ASME B16.36 | ASME B16.36 orifice flanges | Flanges de orifício ASME B16.36 | Brides d'orifici ASME B16.36
Bridas en los extremos | Bridas nos extremos | Flanges at ends | Flanges nas extremidades | Brides als extrems
Cara RTJ solo disponible en ASME B16.5. | Cara RTJ só dispoñible en ASME B16.5. | RTJ facing only available in ASME B16.5. | Face RTJ só disponível na ASME B16.5. | Cara RTJ només disponible a ASME B16.5.
Codo 45° | Cóbado 45° | 45° elbow | Curva 45° | Colze 45°
Codo 90° | Cóbado 90° | 90° elbow | Curva 90° | Colze 90°
Colgador de muelle | Colgador de resorte | Spring hanger | Suporte de mola | Penjador de molla
Colgador de varilla | Colgador de variña | Rod hanger | Suspensão por varão | Penjador de vareta
Compuerta | Comporta | Gate | Cunha | Comporta
Conjunto de bridas de orificio | Conxunto de bridas de orificio | Orifice flange union | Conjunto de flanges de orifício | Conjunt de brides d'orifici
Derivación (olet) | Derivación (olet) | Branch (olet) | Derivação (olet) | Derivació (olet)
Derivación MSS SP-97 | Derivación MSS SP-97 | MSS SP-97 branch connection | Derivação MSS SP-97 | Derivació MSS SP-97
Despiece por spool | Despece por spool | Spool breakdown | Divisão em spools | Especejament per spool
Dibujar espárragos | Debuxar espárragos | Draw stud bolts | Desenhar pernos | Dibuixar espàrrecs
Dimensiones orientativas. | Dimensións orientativas. | Indicative dimensions. | Dimensões indicativas. | Dimensions orientatives.
Disco ciego | Disco cego | Paddle blind | Disco cego | Disc cec
Disco ciego (paddle blind) | Disco cego (paddle blind) | Paddle blind | Disco cego (paddle blind) | Disc cec (paddle blind)
Envolvente orientativa: verifique con el plano del fabricante. | Envolvente orientativa: verifique co plano do fabricante. | Indicative envelope: check against the manufacturer's drawing. | Envolvente indicativa: verifique com o desenho do fabricante. | Envolupant orientativa: verifiqueu amb el plànol del fabricant.
Escala de la isométrica | Escala da isométrica | Isometric scale | Escala da isométrica | Escala de la isomètrica
Espesor | Espesor | Thickness | Espessura | Gruix
Espesor de aislamiento (mm) | Espesor de illamento (mm) | Insulation thickness (mm) | Espessura do isolamento (mm) | Gruix d'aïllament (mm)
Espesor del tubo (mm) | Espesor do tubo (mm) | Pipe wall (mm) | Espessura do tubo (mm) | Gruix del tub (mm)
Espirometálica (B16.20) | Espirometálica (B16.20) | Spiral wound (B16.20) | Espirometálica (B16.20) | Espiromètal·lica (B16.20)
Espuma elastomérica | Escuma elastomérica | Elastomeric foam | Espuma elastomérica | Escuma elastomèrica
Espárrago | Espárrago | Stud bolt | Perno | Espàrrec
Extremo para brida loca | Extremo para brida tola | Stub end | Extremidade para flange solta | Extrem per a brida boja
Extremo para brida loca (stub end) | Extremo para brida tola (stub end) | Stub end | Extremidade para flange solta (stub end) | Extrem per a brida boja (stub end)
Extremos | Extremos | Ends | Extremidades | Extrems
Figura en ocho | Figura en oito | Spectacle blind | Figura em oito | Figura en vuit
Figura en ocho (spectacle) | Figura en oito (spectacle) | Spectacle blind | Figura em oito (spectacle) | Figura en vuit (spectacle)
Figura en ocho y discos ASME B16.48 | Figura en oito e discos ASME B16.48 | ASME B16.48 line blanks | Figura em oito e discos ASME B16.48 | Figura en vuit i discos ASME B16.48
Filtro | Filtro | Strainer | Filtro | Filtre
Filtro de cesta | Filtro de cesta | Basket strainer | Filtro de cesto | Filtre de cistella
Filtro en Y | Filtro en Y | Y-strainer | Filtro em Y | Filtre en Y
Fondos | Fondos | Heads | Fundos | Fons
Forjados B16.11 | Forxados B16.11 | B16.11 Forged | Forjados B16.11 | Forjats B16.11
Globo | Globo | Globe | Globo | Globus
ISOMÉTRICA | ISOMÉTRICA | ISOMETRIC | ISOMÉTRICA | ISOMÈTRICA
Instrumento | Instrumento | Instrument | Instrumento | Instrument
Instrumento o accesorio de línea | Instrumento ou accesorio de liña | Instrument or line item | Instrumento ou acessório de linha | Instrument o accessori de línia
Introduzca los puntos en planta y la cota Z de cada uno. Use Subir/Bajar para tramos verticales. | Introduza os puntos en planta e a cota Z de cada un. Use Subir/Baixar para tramos verticais. | Enter plan points and the Z elevation of each. Use Up/Down for vertical runs. | Introduza os pontos em planta e a cota Z de cada um. Use Subir/Descer para troços verticais. | Introduïu els punts en planta i la cota Z de cadascun. Feu servir Pujar/Baixar per a trams verticals.
Isométrica | Isométrica | Isometric | Isométrica | Isomètrica
Isométrica de tubería | Isométrica de tubaxe | Piping isometric | Isométrica de tubagem | Isomètrica de canonada
Isométricas y listados | Isométricas e listaxes | Isometrics and Lists | Isométricas e listagens | Isomètriques i llistats
Junta | Xunta | Gasket | Junta | Junta
Junta y tornillería | Xunta e parafusaría | Gasket and Bolting | Junta e parafusaria | Junta i cargols
Tornillería de bridas | Parafusaría de bridas | Flange Bolting | Parafusaria de flanges | Cargols de brides
Tornillo, tuerca o arandela | Parafuso, porca ou arandela | Bolt, Nut or Washer | Parafuso, porca ou anilha | Cargol, femella o volandera
Lana mineral | La mineral | Mineral wool | Lã mineral | Llana mineral
Las bridas socket weld de ASME B16.5 llegan hasta NPS 3 (2½ en Class 1500). | As bridas socket weld de ASME B16.5 chegan ata NPS 3 (2½ en Class 1500). | ASME B16.5 socket weld flanges go up to NPS 3 (2½ in Class 1500). | As flanges socket weld da ASME B16.5 vão até NPS 3 (2½ na Class 1500). | Les brides socket weld d'ASME B16.5 arriben fins a NPS 3 (2½ en Class 1500).
Latrolet (45°) | Latrolet (45°) | Latrolet (45°) | Latrolet (45°) | Latrolet (45°)
Loca (lap joint) | Tola (lap joint) | Lap joint | Solta (lap joint) | Boja (lap joint)
Longitud (mm) | Lonxitude (mm) | Length (mm) | Comprimento (mm) | Longitud (mm)
Longitud de corte (mm) | Lonxitude de corte (mm) | Cut length (mm) | Comprimento de corte (mm) | Longitud de tall (mm)
Longitud entre tangentes (mm) | Lonxitude entre tanxentes (mm) | Tangent-to-tangent length (mm) | Comprimento entre tangentes (mm) | Longitud entre tangents (mm)
Longitud máx. de spool (m) | Lonxitude máx. de spool (m) | Max. spool length (m) | Comprimento máx. de spool (m) | Longitud màx. de spool (m)
Macho | Macho | Plug | Macho | Mascle
Manual (volante / palanca) | Manual (volante / panca) | Manual (handwheel / lever) | Manual (volante / alavanca) | Manual (volant / palanca)
Manómetro con válvula | Manómetro con válvula | Pressure gauge with valve | Manómetro com válvula | Manòmetre amb vàlvula
Mariposa | Bolboreta | Butterfly | Borboleta | Papallona
Mirilla | Visor | Sight glass | Visor | Visor
Norma de la brida | Norma da brida | Flange standard | Norma da flange | Norma de la brida
Pieza | Peza | Piece | Peça | Peça
Plana sin amianto (B16.21) | Plana sen amianto (B16.21) | Non-asbestos flat (B16.21) | Plana sem amianto (B16.21) | Plana sense amiant (B16.21)
Potencia del motor (kW) | Potencia do motor (kW) | Motor power (kW) | Potência do motor (kW) | Potència del motor (kW)
Proyección | Proxección | Projection | Projeção | Projecció
Proyección desde la pared (mm) | Proxección desde a parede (mm) | Projection from wall (mm) | Projeção a partir da parede (mm) | Projecció des de la paret (mm)
Purga (válvula y tapón) | Purga (válvula e tapón) | Drain (valve and plug) | Purga (válvula e tampão) | Purga (vàlvula i tap)
Purgador termodinámico | Purgador termodinámico | Thermodynamic steam trap | Purgador termodinâmico | Purgador termodinàmic
Recipiente | Recipiente | Vessel | Recipiente | Recipient
Reducción de enchufe (MSS SP-95) | Redución de enchufe (MSS SP-95) | Swage nipple (MSS SP-95) | Redução de encaixe (MSS SP-95) | Reducció d'endoll (MSS SP-95)
Retención | Retención | Check | Retenção | Retenció
Retención de clapeta | Retención de clapeta | Swing check | Retenção de portinhola | Retenció de clapeta
Retención de pistón | Retención de pistón | Lift check | Retenção de pistão | Retenció de pistó
Roscada (NPT) | Roscada (NPT) | Threaded (NPT) | Roscada (NPT) | Roscada (NPT)
Roscados NPT | Roscados NPT | NPT threaded | Roscados NPT | Roscats NPT
Se dibuja a trazos sobre el contorno del tubo; la lista de materiales suma los metros por espesor. | Debúxase a trazos sobre o contorno do tubo; a lista de materiais suma os metros por espesor. | Drawn dashed around the pipe outline; the bill of materials totals metres by thickness. | Desenha-se a tracejado sobre o contorno do tubo; a lista de materiais soma os metros por espessura. | Es dibuixa a traços sobre el contorn del tub; la llista de materials suma els metres per gruix.
Semielíptico DIN 28013 (Korbbogen) | Semielíptico DIN 28013 (Korbbogen) | Semi-elliptical DIN 28013 (Korbbogen) | Semielíptico DIN 28013 (Korbbogen) | Semiel·líptic DIN 28013 (Korbbogen)
Separación máx. ASME B31.1 | Separación máx. ASME B31.1 | Max. span ASME B31.1 | Espaçamento máx. ASME B31.1 | Separació màx. ASME B31.1
Servicio | Servizo | Service | Serviço | Servei
Sin dividir | Sen dividir | Not split | Sem dividir | Sense dividir
Socket weld (SW) | Socket weld (SW) | Socket weld (SW) | Socket weld (SW) | Socket weld (SW)
Socket weld: clases 3000 y 6000. | Socket weld: clases 3000 e 6000. | Socket weld: Class 3000 and 6000. | Socket weld: classes 3000 e 6000. | Socket weld: classes 3000 i 6000.
Soldar a tope (BW) | Soldar a tope (BW) | Butt weld (BW) | Soldar topo a topo (BW) | Soldar a tope (BW)
Soporte | Soporte | Support | Suporte | Suport
Soporte de tubería | Soporte de tubaxe | Pipe support | Suporte de tubagem | Suport de canonada
Soportes por separación | Soportes por separación | Supports by Span | Suportes por espaçamento | Suports per separació
Soportes según separación ASME B31.1 | Soportes segundo separación ASME B31.1 | Supports by ASME B31.1 span | Suportes segundo espaçamento ASME B31.1 | Suports segons separació ASME B31.1
Soportes y equipos | Soportes e equipos | Supports and Equipment | Suportes e equipamentos | Suports i equips
Símbolo P&ID | Símbolo P&ID | P&ID symbol | Símbolo P&ID | Símbol P&ID
Símbolo P&ID (ISA 5.1) | Símbolo P&ID (ISA 5.1) | P&ID symbol (ISA 5.1) | Símbolo P&ID (ISA 5.1) | Símbol P&ID (ISA 5.1)
Tabla 121.5 de ASME B31.1 (tubo STD). En la práctica, apoye también junto a válvulas, cambios de dirección y cargas concentradas. | Táboa 121.5 de ASME B31.1 (tubo STD). Na práctica, apoie tamén xunto a válvulas, cambios de dirección e cargas concentradas. | ASME B31.1 Table 121.5 (STD pipe). In practice, also support next to valves, changes of direction and concentrated loads. | Tabela 121.5 da ASME B31.1 (tubo STD). Na prática, apoie também junto a válvulas, mudanças de direção e cargas concentradas. | Taula 121.5 d'ASME B31.1 (tub STD). A la pràctica, suporteu també al costat de vàlvules, canvis de direcció i càrregues concentrades.
Tapón hexagonal | Tapón hexagonal | Hex head plug | Tampão hexagonal | Tap hexagonal
Termómetro bimetálico con vaina | Termómetro bimetálico con vaíña | Bimetal thermometer with thermowell | Termómetro bimetálico com bainha | Termòmetre bimetàl·lic amb beina
Tipo 01: plana para soldar | Tipo 01: plana para soldar | Type 01: plate | Tipo 01: plana para soldar | Tipus 01: plana per soldar
Tipo 05: ciega | Tipo 05: cega | Type 05: blind | Tipo 05: cega | Tipus 05: cega
Tipo 11: cuello para soldar | Tipo 11: colo para soldar | Type 11: weld neck | Tipo 11: pescoço para soldar | Tipus 11: coll per soldar
Tipo de soporte | Tipo de soporte | Support type | Tipo de suporte | Tipus de suport
Torisférico DIN 28011 (Klöpper) | Torisférico DIN 28011 (Klöpper) | Torispherical DIN 28011 (Klöpper) | Torisférico DIN 28011 (Klöpper) | Torisfèric DIN 28011 (Klöpper)
Tubería 3D | Tubaxe 3D | 3D Piping | Tubagem 3D | Canonada 3D
Tubuladura | Tubuladura | Nozzle | Tubuladura | Tubuladura
Tubuladura inferior | Tubuladura inferior | Bottom nozzle | Tubuladura inferior | Tubuladura inferior
Tubuladura lateral | Tubuladura lateral | Side nozzle | Tubuladura lateral | Tubuladura lateral
Tubuladura superior | Tubuladura superior | Top nozzle | Tubuladura superior | Tubuladura superior
Unión bridada | Unión bridada | Flanged joint | União flangeada | Unió embridada
Vaina termométrica | Vaíña termométrica | Thermowell | Bainha termométrica | Beina termomètrica
Vapor, gas o aire | Vapor, gas ou aire | Steam, gas or air | Vapor, gás ou ar | Vapor, gas o aire
Venteo (válvula y tapón) | Venteo (válvula e tapón) | Vent (valve and plug) | Respiro (válvula e tampão) | Ventilació (vàlvula i tap)
Vidrio celular | Vidro celular | Cellular glass | Vidro celular | Vidre cel·lular
Válvula | Válvula | Valve | Válvula | Vàlvula
Válvulas | Válvulas | Valves | Válvulas | Vàlvules
Zapata | Zapata | Shoe | Sapata | Sabata
Zapata guiada | Zapata guiada | Guided shoe | Sapata guiada | Sabata guiada
Anclaje | Ancoraxe | Anchor | Ancoragem | Ancoratge
Ø exterior (mm) | Ø exterior (mm) | Outside Ø (mm) | Ø exterior (mm) | Ø exterior (mm)
Disposición | Disposición | Arrangement | Disposição | Disposició
Patas | Patas | Legs | Pernas | Potes
Faldón | Faldón | Skirt | Saia | Faldó
Cunas | Berces | Saddles | Berços | Bressols
Ninguno | Ningún | None | Nenhum | Cap
Derivación | Derivación | Branch | Derivação | Derivació
Patrón | Patrón | Pattern | Padrão | Patró
Largo (paso total) | Longo (paso total) | Long (full bore) | Longo (passagem total) | Llarg (pas total)
Corto | Curto | Short | Curto | Curt
Regular | Regular | Regular | Regular | Regular
Corto (MSS SP-43) | Curto (MSS SP-43) | Short (MSS SP-43) | Curto (MSS SP-43) | Curt (MSS SP-43)
Largo (ASME B16.9) | Longo (ASME B16.9) | Long (ASME B16.9) | Longo (ASME B16.9) | Llarg (ASME B16.9)
Insertar brida igual enfrentada | Inserir brida igual enfrontada | Insert matching flange | Inserir flange igual oposta | Inserir brida igual encarada
Línea | Liña | Line | Linha | Línia
Niple | Niple | Nipple | Niple | Mugró
Unión (MSS SP-83) | Unión (MSS SP-83) | Union (MSS SP-83) | União (MSS SP-83) | Unió (MSS SP-83)
Unión | Unión | Union | União | Unió
Reducción de enchufe | Redución de enchufe | Swage nipple | Redução de encaixe | Reducció d'endoll
Válvula de compuerta | Válvula de comporta | Gate valve | Válvula de cunha | Vàlvula de comporta
Accesorio forjado | Accesorio forxado | Forged fitting | Acessório forjado | Accessori forjat
como globo | como globo | as globe | como globo | com a globus
con 2 tuercas | con 2 porcas | with 2 nuts | com 2 porcas | amb 2 femelles
eje a | eixe a | shaft at | eixo a | eix a
espirometálica | espirometálica | spiral wound | espirometálica | espiromètal·lica
espuma elastomérica | escuma elastomérica | elastomeric foam | espuma elastomérica | escuma elastomèrica
espárrago | espárrago | stud bolt | perno | espàrrec
forjada (API 602), aprox. | forxada (API 602), aprox. | forged (API 602), approx. | forjada (API 602), aprox. | forjada (API 602), aprox.
impulsión | impulsión | discharge | descarga | impulsió
lana mineral | la mineral | mineral wool | lã mineral | llana mineral
loca | tola | lap joint | solta | boja
ninguna | ningunha | none | nenhuma | cap
piezas de tubo | pezas de tubo | pipe pieces | peças de tubo | peces de tub
placa | placa | plate | placa | placa
plana | plana | plate | plana | plana
poliuretano | poliuretano | polyurethane | poliuretano | poliuretà
proyección | proxección | projection | projeção | projecció
roscada | roscada | threaded | roscada | roscada
sobre | sobre | on | sobre | sobre
tomas | tomas | taps | tomadas | preses
tuercas | porcas | nuts | porcas | femelles
vidrio celular | vidro celular | cellular glass | vidro celular | vidre cel·lular
volumen aprox. | volume aprox. | approx. volume | volume aprox. | volum aprox.
agua | auga | water | água | aigua
en | en | on | em | en
Separación máx. | Separación máx. | Max. span | Espaçamento máx. | Separació màx.
Anillo espaciador (paddle spacer) | Anel espaciador (paddle spacer) | Paddle spacer | Anel espaçador (paddle spacer) | Anell espaiador (paddle spacer)
No hay dimensión cara a cara para este tipo, clase y diámetro. | Non hai dimensión cara a cara para este tipo, clase e diámetro. | No face-to-face dimension for this type, class and size. | Não há dimensão face a face para este tipo, classe e diâmetro. | No hi ha dimensió cara a cara per a aquest tipus, classe i diàmetre.
ASME B16.11 no incluye este diámetro en clase {0}. | ASME B16.11 non inclúe este diámetro en clase {0}. | ASME B16.11 does not cover this size in Class {0}. | A ASME B16.11 não inclui este diâmetro na classe {0}. | ASME B16.11 no inclou aquest diàmetre en classe {0}.
ASME B16.36: bridas de orificio desde Class 300. | ASME B16.36: bridas de orificio desde Class 300. | ASME B16.36: orifice flanges from Class 300. | ASME B16.36: flanges de orifício a partir da Class 300. | ASME B16.36: brides d'orifici des de Class 300.
ASME B16.47 serie A | ASME B16.47 serie A | ASME B16.47 Series A | ASME B16.47 série A | ASME B16.47 sèrie A
ASME B16.48 no incluye este diámetro en clase {0}. | ASME B16.48 non inclúe este diámetro en clase {0}. | ASME B16.48 does not cover this size in Class {0}. | A ASME B16.48 não inclui este diâmetro na classe {0}. | ASME B16.48 no inclou aquest diàmetre en classe {0}.
Derivación (olet) | Derivación (olet) | Branch (olet) | Derivação (olet) | Derivació (olet)
Imagen PNG | Imaxe PNG | PNG image | Imagem PNG | Imatge PNG
Poligonal | Poligonal | Polygonal | Poligonal | Poligonal
Modelado 3D | Modelado 3D | 3D Modeling | Modelação 3D | Modelatge 3D
Plano de trabajo | Plano de traballo | Work Plane | Plano de trabalho | Pla de treball
Superior (XY) | Superior (XY) | Top (XY) | Superior (XY) | Superior (XY)
Frontal (XZ) | Frontal (XZ) | Front (XZ) | Frontal (XZ) | Frontal (XZ)
Lateral derecho (YZ) | Lateral dereito (YZ) | Right (YZ) | Lateral direito (YZ) | Lateral dret (YZ)
Lateral izquierdo | Lateral esquerdo | Left | Lateral esquerdo | Lateral esquerre
Paralelo a la vista | Paralelo á vista | Parallel to View | Paralelo à vista | Paral·lel a la vista
Origen | Orixe | Origin | Origem | Origen
Elevación | Elevación | Elevation | Elevação | Elevació
3 puntos | 3 puntos | 3 Point | 3 pontos | 3 punts
Girar X | Xirar X | Rotate X | Rodar X | Girar X
Girar Y | Xirar Y | Rotate Y | Rodar Y | Girar Y
Girar Z | Xirar Z | Rotate Z | Rodar Z | Girar Z
Objeto | Obxecto | Object | Objeto | Objecte
Planta del plano | Planta do plano | Plan View | Planta do plano | Planta del pla
Visor 3D aparte | Visor 3D á parte | Separate 3D Viewer | Visor 3D à parte | Visor 3D a part
Zoom extensión | Zoom extensión | Zoom Extents | Zoom extensão | Zoom extensió
Personalizada | Personalizada | Custom | Personalizada | Personalitzada
Frontal | Frontal | Front | Frontal | Frontal
Archivo: iso.lin | Arquivo: iso.lin | File: iso.lin | Arquivo: iso.lin | Fitxer: iso.lin
Importar alias (.pgp) | Importar alias (.pgp) | Import aliases (.pgp) | Importar alias (.pgp) | Importar àlies (.pgp)
Modelado 3D ISO — mm | Modelado 3D ISO — mm | 3D Modeling ISO — mm | Modelação 3D ISO — mm | Modelatge 3D ISO — mm
Examinar plantillas... | Examinar modelos... | Browse templates... | Procurar modelos... | Examinar plantilles...
Pirámide | Pirámide | Pyramid | Pirâmide | Piràmide
Cuña | Cuña | Wedge | Cunha | Falca
Toroide | Toroide | Torus | Toro | Tor
Sólido | Sólido | Solid | Sólido | Sòlid
Visualizar | Visualizar | Visualize | Visualizar | Visualitzar
Primitivas | Primitivas | Primitive | Primitivas | Primitives
Booleanas | Booleanas | Boolean | Booleanas | Booleanes
Navegación | Navegación | Navigate | Navegação | Navegació
Render | Render | Render | Render | Render
Estilos visuales | Estilos visuais | Visual Styles | Estilos visuais | Estils visuals
Vistas | Vistas | Views | Vistas | Vistes
Coordenadas | Coordenadas | Coordinates | Coordenadas | Coordenades
Sección | Sección | Section | Secção | Secció
SCP | SCP | UCS | SCP | SCP
Universal | Universal | World | Universal | Universal
Previo | Previo | Previous | Anterior | Previ
Superior | Superior | Top | Superior | Superior
Inferior | Inferior | Bottom | Inferior | Inferior
Izquierda | Esquerda | Left | Esquerda | Esquerra
Derecha | Dereita | Right | Direita | Dreta
Posterior | Posterior | Back | Posterior | Posterior
Isométrica SO | Isométrica SO | SW Isometric | Isométrica SO | Isomètrica SO
Isométrica SE | Isométrica SE | SE Isometric | Isométrica SE | Isomètrica SE
Isométrica NE | Isométrica NE | NE Isometric | Isométrica NE | Isomètrica NE
Isométrica NO | Isométrica NO | NW Isometric | Isométrica NO | Isomètrica NO
Realista | Realista | Realistic | Realista | Realista
Sombreado | Sombreado | Shaded | Sombreado | Ombrejat
Oculto | Oculto | Hidden | Oculto | Ocult
Estructura alámbrica | Estrutura de arames | Wireframe | Estrutura de arames | Estructura de filferro
Estilo visual | Estilo visual | Visual Style | Estilo visual | Estil visual
Vista 3D acoplada | Vista 3D acoplada | Docked 3D View | Vista 3D acoplada | Vista 3D acoblada
Ventanas del modelo | Xanelas do modelo | Model Viewports | Janelas do modelo | Finestres del model
Modelado | Modelado | Modeling | Modelação | Modelatge
Edición de sólidos | Edición de sólidos | Solid Editing | Edição de sólidos | Edició de sòlids
Montaje | Montaxe | Assembly | Montagem | Muntatge
Rosca | Rosca | Thread | Rosca | Rosca
Material | Material | Material | Material | Material
Vista | Vista | View | Vista | Vista
Diámetro | Diámetro | Diameter | Diâmetro | Diàmetre
Tipo | Tipo | Type | Tipo | Tipus
Arandela | Arandela | Washer | Anilha | Volandera
Arandelas | Arandelas | Washers | Anilhas | Volanderes
arandela | arandela | washer | anilha | volandera
Tornillería | Parafusaría | Bolting | Parafusaria | Cargols
Apriete | Aperte | Grip | Aperto | Estrenyiment
saliente | saínte | projection | saliência | sobresortint
calculada | calculada | calculated | calculado | calculada
hilos | fíos | threads | fios | fils
Tornillo | Parafuso | Bolt | Parafuso | Cargol
Tuerca | Porca | Nut | Porca | Femella
Tornillo hexagonal | Parafuso hexagonal | Hex bolt | Parafuso sextavado | Cargol hexagonal
Tuerca hexagonal | Porca hexagonal | Hex nut | Porca sextavada | Femella hexagonal
Espárrago (varilla roscada) | Espárrago (variña roscada) | Stud bolt (threaded rod) | Perno (varão roscado) | Espàrrec (vareta roscada)
Frontal | Frontal | Front | Frontal | Frontal
aprox. | aprox. | approx. | aprox. | aprox.
Sin junta (solo tornillería) | Sen xunta (só parafusaría) | No gasket (bolting only) | Sem junta (só parafusaria) | Sense junta (només cargols)
Tuerca + arandela + espárrago + arandela + tuerca | Porca + arandela + espárrago + arandela + porca | Nut + washer + stud + washer + nut | Porca + anilha + perno + anilha + porca | Femella + volandera + espàrrec + volandera + femella
Tornillo + arandela + tuerca | Parafuso + arandela + porca | Bolt + washer + nut | Parafuso + anilha + porca | Cargol + volandera + femella
Arandela bajo la cabeza | Arandela baixo a cabeza | Washer under head | Anilha sob a cabeça | Volandera sota el cap
Dibujar tornillería | Debuxar parafusaría | Draw bolting | Desenhar parafusaria | Dibuixar cargols
Americana UNC / 8UN | Americana UNC / 8UN | Inch UNC / 8UN | Americana UNC / 8UN | Americana UNC / 8UN
Métrica equivalente (ASME B16.5) | Métrica equivalente (ASME B16.5) | Metric equivalent (ASME B16.5) | Métrica equivalente (ASME B16.5) | Mètrica equivalent (ASME B16.5)
Métrica (ISO 261) | Métrica (ISO 261) | Metric (ISO 261) | Métrica (ISO 261) | Mètrica (ISO 261)
ASTM A320 L7 / A194 7 (baja temperatura) | ASTM A320 L7 / A194 7 (baixa temperatura) | ASTM A320 L7 / A194 7 (low temperature) | ASTM A320 L7 / A194 7 (baixa temperatura) | ASTM A320 L7 / A194 7 (baixa temperatura)
ASTM A193 B16 / A194 4 (alta temperatura) | ASTM A193 B16 / A194 4 (alta temperatura) | ASTM A193 B16 / A194 4 (high temperature) | ASTM A193 B16 / A194 4 (alta temperatura) | ASTM A193 B16 / A194 4 (alta temperatura)
ISO 3506 A4-70 (inoxidable) | ISO 3506 A4-70 (inoxidable) | ISO 3506 A4-70 (stainless) | ISO 3506 A4-70 (inoxidável) | ISO 3506 A4-70 (inoxidable)
ASTM A193 B7 / A194 2H (rosca métrica) | ASTM A193 B7 / A194 2H (rosca métrica) | ASTM A193 B7 / A194 2H (metric thread) | ASTM A193 B7 / A194 2H (rosca métrica) | ASTM A193 B7 / A194 2H (rosca mètrica)
`;

// Mensajes de petición: English | castellano | galego | português | català
const SENT8 = `
Specify new origin point | Precise el nuevo punto de origen | Precise o novo punto de orixe | Especifique o novo ponto de origem | Precisa el nou punt d'origen
Specify point on positive portion of X-axis | Precise un punto en la parte positiva del eje X | Precise un punto na parte positiva do eixe X | Especifique um ponto na parte positiva do eixo X | Precisa un punt a la part positiva de l'eix X
Specify point on positive-Y portion of the UCS XY plane | Precise un punto en la parte Y positiva del plano XY | Precise un punto na parte Y positiva do plano XY | Especifique um ponto na parte Y positiva do plano XY | Precisa un punt a la part Y positiva del pla XY
Specify elevation along the Z axis | Precise la elevación según el eje Z | Precise a elevación segundo o eixe Z | Especifique a elevação segundo o eixo Z | Precisa l'elevació segons l'eix Z
Specify rotation angle about X axis | Precise el ángulo de giro alrededor del eje X | Precise o ángulo de xiro arredor do eixe X | Especifique o ângulo de rotação em torno do eixo X | Precisa l'angle de gir al voltant de l'eix X
Specify rotation angle about Y axis | Precise el ángulo de giro alrededor del eje Y | Precise o ángulo de xiro arredor do eixe Y | Especifique o ângulo de rotação em torno do eixo Y | Precisa l'angle de gir al voltant de l'eix Y
Specify rotation angle about Z axis | Precise el ángulo de giro alrededor del eje Z | Precise o ángulo de xiro arredor do eixe Z | Especifique o ângulo de rotação em torno do eixo Z | Precisa l'angle de gir al voltant de l'eix Z
Press ESC or ENTER to exit. Drag to orbit; Shift+wheel button drags orbit at any time. | Pulse ESC o INTRO para salir. Arrastre para orbitar; Mayús + botón de la rueda orbita en cualquier momento. | Prema ESC ou INTRO para saír. Arrastre para orbitar; Maiús + botón da roda orbita en calquera momento. | Prima ESC ou ENTER para sair. Arraste para orbitar; Shift + botão da roda orbita a qualquer momento. | Premeu ESC o RETORN per sortir. Arrossegueu per orbitar; Maj + botó de la roda orbita en qualsevol moment.
Specify tube radius | Precise el radio del tubo | Precise o raio do tubo | Especifique o raio do tubo | Precisa el radi del tub
Specify other corner | Precise la otra esquina | Precise a outra esquina | Especifique o outro canto | Precisa l'altra cantonada
Specify center point of base | Precise el punto central de la base | Precise o punto central da base | Especifique o ponto central da base | Precisa el punt central de la base
Specify base radius | Precise el radio de la base | Precise o raio da base | Especifique o raio da base | Precisa el radi de la base
Specify radius | Precise el radio | Precise o raio | Especifique o raio | Precisa el radi
Enter scale | Indique la escala | Indique a escala | Indique a escala | Indiqueu l'escala
Enter view scale | Indique la escala de la vista | Indique a escala da vista | Indique a escala da vista | Indiqueu l'escala de la vista
Latitude | Latitud | Latitude | Latitude | Latitud
Longitude | Longitud | Lonxitude | Longitude | Longitud
Layer reservation | Reserva de capas | Reserva de capas | Reserva de camadas | Reserva de capes
Collaboration session | Sesión de colaboración | Sesión de colaboración | Sessão de colaboração | Sessió de col·laboració
Collaboration | Colaboración | Colaboración | Colaboração | Col·laboració
Tablet mode | Modo tableta | Modo tableta | Modo tablet | Mode tauleta
Select P&ID symbols | Designe los símbolos P&ID | Designe os símbolos P&ID | Selecione os símbolos P&ID | Designeu els símbols P&ID
Select closed polylines of rooms | Designe las polilíneas cerradas de los recintos | Designe as polilíñas pechadas dos recintos | Selecione as polilinhas fechadas dos espaços | Designeu les polilínies tancades dels recintes
Select ducts | Designe los conductos | Designe os condutos | Selecione as condutas | Designeu els conductes
Select objects to slice | Designe los objetos que desea cortar | Designe os obxectos que desexa cortar | Selecione os objetos a cortar | Designeu els objectes que voleu tallar
Select pipe polylines or lines | Designe las polilíneas o líneas de tubería | Designe as polilíñas ou liñas de tubaxe | Selecione as polilinhas ou linhas de tubagem | Designeu les polilínies o línies de canonada
Session code | Código de sesión | Código de sesión | Código de sessão | Codi de sessió
Specify Z elevation of the plane | Indique la cota Z del plano | Indique a cota Z do plano | Indique a cota Z do plano | Indiqueu la cota Z del pla
Specify comment location | Indique la posición del comentario | Indique a posición do comentario | Indique a posição do comentário | Indiqueu la posició del comentari
Select object to comment on | Designe el objeto que desea comentar | Designe o obxecto que desexa comentar | Selecione o objeto a comentar | Designeu l'objecte que voleu comentar
Comment number to reply to | Número del comentario al que responder | Número do comentario ao que responder | Número do comentário a responder | Número del comentari a respondre
Specify end point of section line | Indique el punto final de la línea de sección | Indique o punto final da liña de sección | Indique o ponto final da linha de secção | Indiqueu el punt final de la línia de secció
Specify start point of section line | Indique el punto inicial de la línea de sección | Indique o punto inicial da liña de sección | Indique o ponto inicial da linha de secção | Indiqueu el punt inicial de la línia de secció
Specify first point on plane | Indique el primer punto del plano | Indique o primeiro punto do plano | Indique o primeiro ponto do plano | Indiqueu el primer punt del pla
Specify second point on plane | Indique el segundo punto del plano | Indique o segundo punto do plano | Indique o segundo ponto do plano | Indiqueu el segon punt del pla
Specify insertion point for profile | Indique el punto de inserción del perfil | Indique o punto de inserción do perfil | Indique o ponto de inserção do perfil | Indiqueu el punt d'inserció del perfil
Specify insertion point for the isometric | Indique el punto de inserción de la isométrica | Indique o punto de inserción da isométrica | Indique o ponto de inserção da isométrica | Indiqueu el punt d'inserció de la isomètrica
Specify insertion point for the section | Indique el punto de inserción de la sección | Indique o punto de inserción da sección | Indique o ponto de inserção da secção | Indiqueu el punt d'inserció de la secció
Specify insertion point for the table | Indique el punto de inserción de la tabla | Indique o punto de inserción da táboa | Indique o ponto de inserção da tabela | Indiqueu el punt d'inserció de la taula
Specify section thickness | Indique el espesor de la sección | Indique o espesor da sección | Indique a espessura da secção | Indiqueu el gruix de la secció
Starting number | Número inicial | Número inicial | Número inicial | Número inicial
Enter duct axis elevation (mm) | Indique la cota del eje del conducto (mm) | Indique a cota do eixe do conduto (mm) | Indique a cota do eixo da conduta (mm) | Indiqueu la cota de l'eix del conducte (mm)
Enter mline editing option | Indique una opción de edición de multilínea | Indique unha opción de edición de multiliña | Indique uma opção de edição de multilinha | Indiqueu una opció d'edició de multilínia
Specify gasket face point | Indique el punto de la cara de junta | Indique o punto da cara de xunta | Indique o ponto da face de junta | Indiqueu el punt de la cara de junta
Specify inlet end point | Indique el extremo de entrada | Indique o extremo de entrada | Indique o extremo de entrada | Indiqueu l'extrem d'entrada
Specify large end point | Indique el extremo grande | Indique o extremo grande | Indique o extremo grande | Indiqueu l'extrem gran
Specify weld end point | Indique el extremo de soldadura | Indique o extremo de soldadura | Indique o extremo de soldadura | Indiqueu l'extrem de soldadura
Specify direction | Indique la dirección | Indique a dirección | Indique a direção | Indiqueu la direcció
Turn direction | Sentido del giro | Sentido do xiro | Sentido da curva | Sentit del gir
Select piping objects | Designe los objetos de tubería | Designe os obxectos de tubaxe | Selecione os objetos de tubagem | Designeu els objectes de canonada
Line number | Número de línea | Número de liña | Número da linha | Número de línia
Select pipe axes and elbows to insulate | Designe los ejes de tubo y los codos que desea aislar | Designe os eixes de tubo e os cóbados que desexa illar | Selecione os eixos de tubo e as curvas a isolar | Designeu els eixos de tub i els colzes que voleu aïllar
Select piping axes | Designe los ejes de tubería | Designe os eixes de tubaxe | Selecione os eixos de tubagem | Designeu els eixos de canonada
Specify bottom tangent line center | Indique el centro de la línea de tangencia inferior | Indique o centro da liña de tanxencia inferior | Indique o centro da linha de tangência inferior | Indiqueu el centre de la línia de tangència inferior
Specify branch side | Indique el lado de la derivación | Indique o lado da derivación | Indique o lado da derivação | Indiqueu el costat de la derivació
Specify point on the pipe axis | Indique un punto en el eje del tubo | Indique un punto no eixe do tubo | Indique um ponto no eixo do tubo | Indiqueu un punt a l'eix del tub
Specify point on the pipe axis or | Indique un punto en el eje del tubo o | Indique un punto no eixe do tubo ou | Indique um ponto no eixo do tubo ou | Indiqueu un punt a l'eix del tub o
Specify point on the run pipe axis | Indique un punto en el eje del colector | Indique un punto no eixe do colector | Indique um ponto no eixo do coletor | Indiqueu un punt a l'eix del col·lector
Specify vertical distance | Indique la distancia vertical | Indique a distancia vertical | Indique a distância vertical | Indiqueu la distància vertical
Specify elevation Z | Indique la cota Z | Indique a cota Z | Indique a cota Z | Indiqueu la cota Z
Select flange to joint | Designe la brida que desea unir | Designe a brida que desexa unir | Selecione a flange a unir | Designeu la brida que voleu unir
Specify inlet face point | Indique el punto de la cara de entrada | Indique o punto da cara de entrada | Indique o ponto da face de entrada | Indiqueu el punt de la cara d'entrada
Specify connection point | Indique el punto de conexión | Indique o punto de conexión | Indique o ponto de ligação | Indiqueu el punt de connexió
Specify lap face point | Indique el punto de la cara de asiento | Indique o punto da cara de asento | Indique o ponto da face de assento | Indiqueu el punt de la cara d'assentament
Specify orifice plate center | Indique el centro de la placa de orificio | Indique o centro da placa de orificio | Indique o centro da placa de orifício | Indiqueu el centre de la placa d'orifici
Specify suction flange face point | Indique la cara de la brida de aspiración | Indique a cara da brida de aspiración | Indique a face da flange de aspiração | Indiqueu la cara de la brida d'aspiració
Specify point on the vessel wall | Indique un punto en la pared del recipiente | Indique un punto na parede do recipiente | Indique um ponto na parede do recipiente | Indiqueu un punt a la paret del recipient
Specify insertion point for the isometric | Indique el punto de inserción de la isométrica | Indique o punto de inserción da isométrica | Indique o ponto de inserção da isométrica | Indiqueu el punt d'inserció de la isomètrica
Specify insertion point for the table or | Indique el punto de inserción de la tabla o | Indique o punto de inserción da táboa ou | Indique o ponto de inserção da tabela ou | Indiqueu el punt d'inserció de la taula o
Layer name | Nombre de capa | Nome de capa | Nome da camada | Nom de capa
Specify location of projected view | Indique la posición de la vista proyectada | Indique a posición da vista proxectada | Indique a posição da vista projetada | Indiqueu la posició de la vista projectada
Select an edge | Designe una arista | Designe unha aresta | Selecione uma aresta | Designeu una aresta
Specify start point of slicing plane | Indique el punto inicial del plano de corte | Indique o punto inicial do plano de corte | Indique o ponto inicial do plano de corte | Indiqueu el punt inicial del pla de tall
Specify a point on desired side | Indique un punto en el lado que desea conservar | Indique un punto no lado que desexa conservar | Indique um ponto no lado a manter | Indiqueu un punt al costat que voleu conservar
`;

// Opciones: English | castellano | galego | português | català
const KW8 = `
3point | 3puntos | 3puntos | 3pontos | 3punts
SWiso | isoSO | isoSO | isoSO | isoSO
SEiso | isoSE | isoSE | isoSE | isoSE
NEiso | isoNE | isoNE | isoNE | isoNE
NWiso | isoNO | isoNO | isoNO | isoNO
Sides | Lados | Lados | Lados | Costats
3points | 3puntos | 3puntos | 3pontos | 3punts
Left | Izquierda | Esquerda | Esquerda | Esquerra
Right | Derecha | Dereita | Direita | Dreta
Undo | desHacer | desFacer | anUlar | desFer
Up | Subir | Subir | Subir | Pujar
Down | Bajar | Baixar | Descer | Baixar
up | arriba | arriba | cima | amunt
Add vertex | Añadir vértice | Engadir vértice | Adicionar vértice | Afegir vèrtex
Aerial | Aéreo | Aéreo | Aéreo | Aeri
Closed cross | Cruz cerrada | Cruz pechada | Cruz fechada | Creu tancada
Open cross | Cruz abierta | Cruz aberta | Cruz aberta | Creu oberta
Merged cross | Cruz fusionada | Cruz fusionada | Cruz fundida | Creu fusionada
closed Tee | T cerrada | T pechada | T fechada | T tancada
open tEe | T aBierta | T aBerta | T aBerta | T oBerta
Merged tee | T fusioNada | T fusioNada | T fuNdida | T fusioNada
Corner joint | Unión en esquina | Unión en esquina | União em canto | Unió en cantonada
Delete vertex | Suprimir vértice | Suprimir vértice | Suprimir vértice | Suprimir vèrtex
Cut single | Cortar uno | Cortar un | Cortar um | Tallar un
cut All | cortar Todo | cortar Todo | cortar Tudo | tallar Tot
Weld all | Soldar todo | Soldar todo | Soldar tudo | Soldar tot
Copy code | Copiar código | Copiar código | Copiar código | Copiar codi
Leave | Salir | Saír | Sair | Sortir
Start | Iniciar | Iniciar | Iniciar | Iniciar
Join | Unirse | Unirse | Juntar-se | Unir-se
Users | Usuarios | Usuarios | Utilizadores | Usuaris
Name | Nombre | Nome | Nome | Nom
Reply | Responder | Responder | Responder | Respondre
Point | Punto | Punto | Ponto | Punt
Claim | Reservar | Reservar | Reservar | Reservar
Release | Liberar | Liberar | Libertar | Alliberar
release All | liberar Todas | liberar Todas | libertar Todas | alliberar Totes
List | Lista | Lista | Lista | Llista
Excel | Excel | Excel | Excel | Excel
Iso | Iso | Iso | Iso | Iso
Loop | Bucle | Bucle | Ciclo | Bucle
MOde | MOdo | MOdo | MOdo | MOde
Rgb | Rgb | Rgb | Rgb | Rgb
Surface | Superficie | Superficie | Superfície | Superfície
Ttr | Ttr | Ttr | Ttr | Ttr
Zaxis | ejeZ | eixoZ | eixoZ | eixZ
keep Both sides | conservar amBos lados | conservar os dous lados | manter amBos os lados | conservar amBdós costats
planar Object | Objeto plano | Obxecto plano | Objeto plano | Objecte pla
`;

// Mensajes de salida: English | castellano | galego | português | català
const MSG8 = `
The points are collinear. | Los puntos están alineados. | Os puntos están aliñados. | Os pontos estão alinhados. | Els punts estan alineats.
At least 2 solids are required. | Se necesitan al menos 2 sólidos. | Necesítanse polo menos 2 sólidos. | São necessários pelo menos 2 sólidos. | Calen almenys 2 sòlids.
Collaboration session closed. | Sesión de colaboración cerrada. | Sesión de colaboración pechada. | Sessão de colaboração fechada. | Sessió de col·laboració tancada.
DWG file created by the external converter. | Archivo DWG creado por el conversor externo. | Ficheiro DWG creado polo conversor externo. | Ficheiro DWG criado pelo conversor externo. | Fitxer DWG creat pel convertidor extern.
DWG writing needs an external converter service. Configure it with DWGCONVERTER (see tools/dwg-converter.md) or save as DXF 2000. | Para escribir DWG hace falta un servicio conversor externo. Configúrelo con CONVERSORDWG (vea tools/dwg-converter.md) o guarde como DXF 2000. | Para escribir DWG cómpre un servizo conversor externo. Configúreo con CONVERSORDWG (vexa tools/dwg-converter.md) ou garde como DXF 2000. | Para gravar DWG é preciso um serviço conversor externo. Configure-o com CONVERSORDWG (veja tools/dwg-converter.md) ou guarde como DXF 2000. | Per escriure DWG cal un servei convertidor extern. Configureu-lo amb CONVERTIDORDWG (vegeu tools/dwg-converter.md) o deseu com a DXF 2000.
No P&ID symbols. | No hay símbolos P&ID. | Non hai símbolos P&ID. | Não há símbolos P&ID. | No hi ha símbols P&ID.
No ducts. | No hay conductos. | Non hai condutos. | Não há condutas. | No hi ha conductes.
No points within the section. | No hay puntos en la sección. | Non hai puntos na sección. | Não há pontos na secção. | No hi ha punts a la secció.
Null solid created - deleted. | Se ha creado un sólido nulo: se ha eliminado. | Creouse un sólido nulo: eliminouse. | Foi criado um sólido nulo: eliminado. | S'ha creat un sòlid nul: s'ha suprimit.
Only vertical (profile) edges of extruded solids can be edited. | Solo se pueden editar las aristas verticales (de perfil) de sólidos extruidos. | Só se poden editar as arestas verticais (de perfil) de sólidos extruídos. | Só é possível editar as arestas verticais (de perfil) de sólidos extrudidos. | Només es poden editar les arestes verticals (de perfil) de sòlids extrudits.
Select two different multilines. | Designe dos multilíneas distintas. | Designe dúas multiliñas distintas. | Selecione duas multilinhas diferentes. | Designeu dues multilínies diferents.
Simplified loads (guidance only): transmission, solar through glazing, occupants, lighting, equipment and ventilation. | Cargas simplificadas (orientativas): transmisión, radiación solar por huecos, ocupantes, iluminación, equipos y ventilación. | Cargas simplificadas (orientativas): transmisión, radiación solar por ocos, ocupantes, iluminación, equipos e ventilación. | Cargas simplificadas (indicativas): transmissão, radiação solar pelos vãos, ocupantes, iluminação, equipamentos e ventilação. | Càrregues simplificades (orientatives): transmissió, radiació solar pels buits, ocupants, il·luminació, equips i ventilació.
There are no comments. | No hay comentarios. | Non hai comentarios. | Não há comentários. | No hi ha comentaris.
No piping components found. | No se han encontrado componentes de tubería. | Non se atoparon compoñentes de tubaxe. | Não foram encontrados componentes de tubagem. | No s'han trobat components de canonada.
Segment too short for the elbow: mitred joint used. | Tramo demasiado corto para el codo: se usa unión a inglete. | Tramo demasiado curto para o cóbado: úsase unión a inglete. | Troço demasiado curto para a curva: usa-se união em meia-esquadria. | Tram massa curt per al colze: s'utilitza unió en biaix.
Connected to the free end. | Conectado al extremo libre. | Conectado ao extremo libre. | Ligado à extremidade livre. | Connectat a l'extrem lliure.
No pipe axes selected. | No se han designado ejes de tubo. | Non se designaron eixes de tubo. | Não foram selecionados eixos de tubo. | No s'han designat eixos de tub.
Some segments are shorter than the elbows. | Algunos tramos son más cortos que los codos. | Algúns tramos son máis curtos cós cóbados. | Alguns troços são mais curtos que as curvas. | Alguns trams són més curts que els colzes.
The selected object is not a piping component. | El objeto designado no es un componente de tubería. | O obxecto designado non é un compoñente de tubaxe. | O objeto selecionado não é um componente de tubagem. | L'objecte designat no és un component de canonada.
There are no 3D piping lines. Draw them with MPIPE3D. | No hay líneas de tubería 3D. Dibújelas con TUBERIA3D. | Non hai liñas de tubaxe 3D. Debúxeas con TUBAXE3D. | Não há linhas de tubagem 3D. Desenhe-as com TUBAGEM3D. | No hi ha línies de canonada 3D. Dibuixeu-les amb CANONADA3D.
This flange has no dimension data (insert it again with MFLANGE). | Esta brida no tiene datos dimensionales (insértela de nuevo con BRIDAASME). | Esta brida non ten datos dimensionais (insíraa de novo con BRIDAASME). | Esta flange não tem dados dimensionais (insira-a de novo com FLANGEASME). | Aquesta brida no té dades dimensionals (inseriu-la de nou amb BRIDAASME).
No layers are reserved. | No hay capas reservadas. | Non hai capas reservadas. | Não há camadas reservadas. | No hi ha capes reservades.
`;
// Mensajes con valores: patrón, castellano, galego, português, català
const MSGRE8 = [
  [/^Work plane: origin (\S+), normal (\S+)\.$/, 'Plano de trabajo: origen $1, normal $2.', 'Plano de traballo: orixe $1, normal $2.', 'Plano de trabalho: origem $1, normal $2.', 'Pla de treball: origen $1, normal $2.'],
  [/^(\d+) support\(s\) placed\.$/, '$1 soporte(s) colocado(s).', '$1 soporte(s) colocado(s).', '$1 suporte(s) colocado(s).', '$1 suport(s) col·locat(s).'],
  [/^(\d+) spool\(s\), (\d+) field weld\(s\)\.$/, '$1 spool(s), $2 soldadura(s) de campo.', '$1 spool(s), $2 soldadura(s) de campo.', '$1 spool(s), $2 soldadura(s) de campo.', '$1 spool(s), $2 soldadura(s) de camp.'],
  [/^Flanged joint: (.+), (\d+) stud bolts (.+) x (.+)\.$/, 'Unión bridada: $1, $2 espárragos $3 × $4.', 'Unión bridada: $1, $2 espárragos $3 × $4.', 'União flangeada: $1, $2 pernos $3 × $4.', 'Unió embridada: $1, $2 espàrrecs $3 × $4.'],
  [/^Flanged joint: (.+), (\d+) bolts (.+) x (.+)\.$/, 'Unión bridada: $1, $2 tornillos $3 × $4.', 'Unión bridada: $1, $2 parafusos $3 × $4.', 'União flangeada: $1, $2 parafusos $3 × $4.', 'Unió embridada: $1, $2 cargols $3 × $4.'],
  [/^Insulation: ([\d.]+) m\.$/, 'Aislamiento: $1 m.', 'Illamento: $1 m.', 'Isolamento: $1 m.', 'Aïllament: $1 m.'],
  [/^Isometric (\S+): (\d+) spool\(s\), (\d+) pipe piece\(s\), (\d+) weld\(s\)\.$/, 'Isométrica $1: $2 spool(s), $3 pieza(s) de tubo, $4 soldadura(s).', 'Isométrica $1: $2 spool(s), $3 peza(s) de tubo, $4 soldadura(s).', 'Isométrica $1: $2 spool(s), $3 peça(s) de tubo, $4 soldadura(s).', 'Isomètrica $1: $2 spool(s), $3 peça(ces) de tub, $4 soldadura(es).'],
  [/^Line (\S+): ([\d.]+) m, (\d+) elbow\(s\)\. Use MISO for the isometric\.$/, 'Línea $1: $2 m, $3 codo(s). Use ISOMETRICA para la isométrica.', 'Liña $1: $2 m, $3 cóbado(s). Use ISOMETRICA para a isométrica.', 'Linha $1: $2 m, $3 curva(s). Use ISOMETRICA para a isométrica.', 'Línia $1: $2 m, $3 colze(s). Feu servir ISOMETRICA per a la isomètrica.'],
  [/^(.+): ([\d.]+) m, (\d+) elbow\(s\)\.$/, '$1: $2 m, $3 codo(s).', '$1: $2 m, $3 cóbado(s).', '$1: $2 m, $3 curva(s).', '$1: $2 m, $3 colze(s).'],
  [/^No (LR|SR) elbow in ASME B16\.9 for this size: mitred joints used\.$/, 'No hay codo $1 en ASME B16.9 para este diámetro: se usan uniones a inglete.', 'Non hai cóbado $1 en ASME B16.9 para este diámetro: úsanse unións a inglete.', 'Não há curva $1 na ASME B16.9 para este diâmetro: usam-se uniões em meia-esquadria.', 'No hi ha colze $1 a ASME B16.9 per a aquest diàmetre: s\'utilitzen unions en biaix.'],
  [/^Piping spec: (.+), Class (\S+) (\S+), (\S+) elbows\.$/, 'Especificación de tubería: $1, clase $2 $3, codos $4.', 'Especificación de tubaxe: $1, clase $2 $3, cóbados $4.', 'Especificação de tubagem: $1, classe $2 $3, curvas $4.', 'Especificació de canonada: $1, classe $2 $3, colzes $4.'],
  [/^(.+): (\d+) object\(s\) imported with attributes\.$/, '$1: $2 objeto(s) importado(s) con atributos.', '$1: $2 obxecto(s) importado(s) con atributos.', '$1: $2 objeto(s) importado(s) com atributos.', '$1: $2 objecte(s) importat(s) amb atributs.'],
  [/^(.+): (\d+) object\(s\) imported\.$/, '$1: $2 objeto(s) importado(s).', '$1: $2 obxecto(s) importado(s).', '$1: $2 objeto(s) importado(s).', '$1: $2 objecte(s) importat(s).'],
  [/^(\d+) region\(s\) created\.$/, '$1 región(es) creada(s).', '$1 rexión(s) creada(s).', '$1 região(ões) criada(s).', '$1 regió(ns) creada(es).'],
  [/^(\d+) duct segment\(s\) created as 3D solids\.$/, '$1 tramo(s) de conducto creado(s) como sólidos 3D.', '$1 tramo(s) de conduto creado(s) como sólidos 3D.', '$1 troço(s) de conduta criado(s) como sólidos 3D.', '$1 tram(s) de conducte creat(s) com a sòlids 3D.'],
  [/^(\d+) duct\(s\) at elevation (.+)\.$/, '$1 conducto(s) a la cota $2.', '$1 conduto(s) á cota $2.', '$1 conduta(s) à cota $2.', '$1 conducte(s) a la cota $2.'],
  [/^(\d+) solid\(s\) exported to (IFC|STEP)\.$/, '$1 sólido(s) exportado(s) a $2.', '$1 sólido(s) exportado(s) a $2.', '$1 sólido(s) exportado(s) para $2.', '$1 sòlid(s) exportat(s) a $2.'],
  [/^(\d+) solid\(s\) imported\.$/, '$1 sólido(s) importado(s).', '$1 sólido(s) importado(s).', '$1 sólido(s) importado(s).', '$1 sòlid(s) importat(s).'],
  [/^(\d+) symbol\(s\) tagged\.$/, '$1 símbolo(s) etiquetado(s).', '$1 símbolo(s) etiquetado(s).', '$1 símbolo(s) etiquetado(s).', '$1 símbol(s) etiquetat(s).'],
  [/^(\d+) triangle\(s\) exported\.$/, '$1 triángulo(s) exportado(s).', '$1 triángulo(s) exportado(s).', '$1 triângulo(s) exportado(s).', '$1 triangle(s) exportat(s).'],
  [/^(\d+) point\(s\) in section\.$/, '$1 punto(s) en la sección.', '$1 punto(s) na sección.', '$1 ponto(s) na secção.', '$1 punt(s) a la secció.'],
  [/^Collaboration session (\S+) started \((.+)\)\. Share the code; others use COLLAB > Join\.$/, 'Sesión de colaboración $1 iniciada ($2). Comparta el código; los demás usan COLABORAR > Unirse.', 'Sesión de colaboración $1 iniciada ($2). Comparta o código; os demais usan COLABORAR > Unirse.', 'Sessão de colaboração $1 iniciada ($2). Partilhe o código; os outros usam COLABORAR > Juntar-se.', 'Sessió de col·laboració $1 iniciada ($2). Compartiu el codi; els altres fan servir COL·LABORAR > Unir-se.'],
  [/^Joined session (\S+) \((.+)\)\. Waiting for the drawing\.\.\.$/, 'Unido a la sesión $1 ($2). Esperando el dibujo...', 'Unido á sesión $1 ($2). Agardando o debuxo...', 'Ligado à sessão $1 ($2). A aguardar o desenho...', 'Unit a la sessió $1 ($2). S\'espera el dibuix...'],
  [/^DWG conversion failed: (.*)$/, 'Error en la conversión DWG: $1', 'Erro na conversión DWG: $1', 'Falha na conversão DWG: $1', 'Error en la conversió DWG: $1'],
  [/^EN 1092-1 DN(\d+) PN(\d+): D=(\S+) K=(\S+) holes (\d+)×Ø(\S+) bolts (\S+)\. Check dimensions against the standard\.$/, 'EN 1092-1 DN$1 PN$2: D=$3 K=$4 taladros $5×Ø$6 tornillos $7. Compruebe las dimensiones con la norma.', 'EN 1092-1 DN$1 PN$2: D=$3 K=$4 furados $5×Ø$6 parafusos $7. Comprobe as dimensións coa norma.', 'EN 1092-1 DN$1 PN$2: D=$3 K=$4 furos $5×Ø$6 parafusos $7. Verifique as dimensões com a norma.', 'EN 1092-1 DN$1 PN$2: D=$3 K=$4 forats $5×Ø$6 cargols $7. Comproveu les dimensions amb la norma.'],
  [/^Layer "(.+)" not found\.$/, 'No se encuentra la capa "$1".', 'Non se atopa a capa "$1".', 'Camada "$1" não encontrada.', 'No es troba la capa "$1".'],
  [/^Layer (.+) is reserved by (.+)\.$/, 'La capa $1 está reservada por $2.', 'A capa $1 está reservada por $2.', 'A camada $1 está reservada por $2.', 'La capa $1 està reservada per $2.'],
  [/^Layer (.+) reserved for you: other users cannot modify it\.$/, 'Capa $1 reservada para usted: los demás usuarios no pueden modificarla.', 'Capa $1 reservada para vostede: os demais usuarios non poden modificala.', 'Camada $1 reservada para si: os outros utilizadores não a podem modificar.', 'Capa $1 reservada per a vostè: els altres usuaris no la poden modificar.'],
  [/^PED category: (.+) \(table (.+)\)\.$/, 'Categoría PED: $1 (cuadro $2).', 'Categoría PED: $1 (cadro $2).', 'Categoria PED: $1 (quadro $2).', 'Categoria PED: $1 (quadre $2).'],
  [/^Session (\S+) \((.+)\): (.*)$/, 'Sesión $1 ($2): $3', 'Sesión $1 ($2): $3', 'Sessão $1 ($2): $3', 'Sessió $1 ($2): $3'],
  [/^Session code (\S+) copied\.$/, 'Código de sesión $1 copiado.', 'Código de sesión $1 copiado.', 'Código de sessão $1 copiado.', 'Codi de sessió $1 copiat.'],
  [/^Session code: (\S+)$/, 'Código de sesión: $1', 'Código de sesión: $1', 'Código de sessão: $1', 'Codi de sessió: $1'],
  [/^Tablet mode on\.$/, 'Modo tableta activado.', 'Modo tableta activado.', 'Modo tablet ativado.', 'Mode tauleta activat.'],
  [/^Tablet mode off\.$/, 'Modo tableta desactivado.', 'Modo tableta desactivado.', 'Modo tablet desativado.', 'Mode tauleta desactivat.'],
];
// Peticiones con valores (patrón sobre la frase sin opciones ni valor por defecto)
const SENTRE8 = [
  [/^Specify location of Top view$/, 'Indique la posición de la vista superior', 'Indique a posición da vista superior', 'Indique a posição da vista superior', 'Indiqueu la posició de la vista superior'],
  [/^Specify location of Front view$/, 'Indique la posición de la vista frontal', 'Indique a posición da vista frontal', 'Indique a posição da vista frontal', 'Indiqueu la posició de la vista frontal'],
  [/^Specify location of Right view$/, 'Indique la posición de la vista derecha', 'Indique a posición da vista dereita', 'Indique a posição da vista direita', 'Indiqueu la posició de la vista dreta'],
  [/^Specify location of Left view$/, 'Indique la posición de la vista izquierda', 'Indique a posición da vista esquerda', 'Indique a posição da vista esquerda', 'Indiqueu la posició de la vista esquerra'],
  [/^Specify location of Back view$/, 'Indique la posición de la vista posterior', 'Indique a posición da vista posterior', 'Indique a posição da vista posterior', 'Indiqueu la posició de la vista posterior'],
  [/^Specify location of Iso view$/, 'Indique la posición de la vista isométrica', 'Indique a posición da vista isométrica', 'Indique a posição da vista isométrica', 'Indiqueu la posició de la vista isomètrica'],
  [/^Specify location of (\w+) view$/, 'Indique la posición de la vista $1', 'Indique a posición da vista $1', 'Indique a posição da vista $1', 'Indiqueu la posició de la vista $1'],
];
// Nombres de comando: castellano, galego, português, català
const CMD8 = {
  MVALVE: ['VALVULA', 'VALVULA', 'VALVULA', 'VALVULA'], MVALVEGATE: ['VALVCOMPUERTA', 'VALVCOMPORTA', 'VALVCUNHA', 'VALVCOMPORTA'], MVALVEGLOBE: ['VALVGLOBO', 'VALVGLOBO', 'VALVGLOBO', 'VALVGLOBUS'], MVALVECHECK: ['VALVRETENCION', 'VALVRETENCION', 'VALVRETENCAO', 'VALVRETENCIO'],
  MVALVEBALL: ['VALVBOLA', 'VALVBOLA', 'VALVESFERA', 'VALVBOLA'], MVALVEPLUG: ['VALVMACHO', 'VALVMACHO', 'VALVMACHO', 'VALVMASCLE'], MVALVEBFLY: ['VALVMARIPOSA', 'VALVBOLBORETA', 'VALVBORBOLETA', 'VALVPAPALLONA'],
  MSTRAINER: ['FILTROY', 'FILTROY', 'FILTROY', 'FILTREY'], MSTRAINERB: ['FILTROCESTA', 'FILTROCESTA', 'FILTROCESTO', 'FILTRECISTELLA'], MSIGHTGLASS: ['MIRILLA', 'VISOR', 'VISOR', 'VISOR'],
  WORKPLANE: ['PLANOTRABAJO', 'PLANOTRABALLO', 'PLANOTRABALHO', 'PLATREBALL'], WPWORLD: ['PTUNIVERSAL', 'PTUNIVERSAL', 'PTUNIVERSAL', 'PTUNIVERSAL'], WPTOP: ['PTSUPERIOR', 'PTSUPERIOR', 'PTSUPERIOR', 'PTSUPERIOR'], WPFRONT: ['PTFRONTAL', 'PTFRONTAL', 'PTFRONTAL', 'PTFRONTAL'], WPRIGHT: ['PTDERECHA', 'PTDEREITA', 'PTDIREITA', 'PTDRETA'], WPLEFT: ['PTIZQUIERDA', 'PTESQUERDA', 'PTESQUERDA', 'PTESQUERRA'], WPBACK: ['PTPOSTERIOR', 'PTPOSTERIOR', 'PTPOSTERIOR', 'PTPOSTERIOR'], WPBOTTOM: ['PTINFERIOR', 'PTINFERIOR', 'PTINFERIOR', 'PTINFERIOR'],
  WPORIGIN: ['PTORIGEN', 'PTORIXE', 'PTORIGEM', 'PTORIGEN'], WPELEVATION: ['PTELEVACION', 'PTELEVACION', 'PTELEVACAO', 'PTELEVACIO'], WPX: ['PTGIRARX', 'PTXIRARX', 'PTRODARX', 'PTGIRARX'], WPY: ['PTGIRARY', 'PTXIRARY', 'PTRODARY', 'PTGIRARY'], WPZ: ['PTGIRARZ', 'PTXIRARZ', 'PTRODARZ', 'PTGIRARZ'], WP3POINT: ['PT3PUNTOS', 'PT3PUNTOS', 'PT3PONTOS', 'PT3PUNTS'], WPOBJECT: ['PTOBJETO', 'PTOBXECTO', 'PTOBJETO', 'PTOBJECTE'], WPVIEW: ['PTVISTA', 'PTVISTA', 'PTVISTA', 'PTVISTA'], WPPREVIOUS: ['PTPREVIO', 'PTPREVIO', 'PTANTERIOR', 'PTPREVI'],
  WEDGE: ['CUÑA', 'CUÑA', 'CUNHA', 'FALCA'], PYRAMID: ['PIRAMIDE', 'PIRAMIDE', 'PIRAMIDE', 'PIRAMIDE'], TORUS: ['TOROIDE', 'TOROIDE', 'TORO', 'TOR'], VIEWPRESET: ['VISTAPREDEF', 'VISTAPREDEF', 'VISTAPREDEF', 'VISTAPREDEF'], VIEW3DPANEL: ['VISTA3DACOPLADA', 'VISTA3DACOPLADA', 'VISTA3DACOPLADA', 'VISTA3DACOBLADA'],
  VIEWTOP: ['VISTASUP', 'VISTASUP', 'VISTASUP', 'VISTASUP'], VIEWBOTTOM: ['VISTAINF', 'VISTAINF', 'VISTAINF', 'VISTAINF'], VIEWFRONT: ['VISTAFRONTAL', 'VISTAFRONTAL', 'VISTAFRONTAL', 'VISTAFRONTAL'], VIEWBACK: ['VISTAPOST', 'VISTAPOST', 'VISTAPOST', 'VISTAPOST'], VIEWLEFT: ['VISTAIZQ', 'VISTAESQ', 'VISTAESQ', 'VISTAESQ'], VIEWRIGHT: ['VISTADER', 'VISTADER', 'VISTADIR', 'VISTADRE'],
  VIEWSWISO: ['ISOSO', 'ISOSO', 'ISOSO', 'ISOSO'], VIEWSEISO: ['ISOSE', 'ISOSE', 'ISOSE', 'ISOSE'], VIEWNEISO: ['ISONE', 'ISONE', 'ISONE', 'ISONE'], VIEWNWISO: ['ISONO', 'ISONO', 'ISONO', 'ISONO'],
  MGASKET: ['JUNTA', 'XUNTA', 'JUNTA', 'JUNTA'], MBOLTING: ['TORNILLERIA', 'PARAFUSARIA', 'PARAFUSARIA', 'CARGOLS'], MFASTENER: ['TORNILLO', 'PARAFUSO', 'PARAFUSO', 'CARGOL'], MFORGED: ['FORJADO', 'FORXADO', 'FORJADO', 'FORJAT'], MOLET: ['OLET', 'OLET', 'OLET', 'OLET'], MSTUBEND: ['PORTABRIDAS', 'PORTABRIDAS', 'PORTAFLANGE', 'PORTABRIDES'],
  MORIFICE: ['BRIDAORIFICIO', 'BRIDAORIFICIO', 'FLANGEORIFICIO', 'BRIDAORIFICI'], MBLIND: ['FIGURAOCHO', 'FIGURAOITO', 'FIGURAOITO', 'FIGURAVUIT'],
  MFLANGESW: ['BRIDASW', 'BRIDASW', 'FLANGESW', 'BRIDASW'], MFLANGETHD: ['BRIDAROSCADA', 'BRIDAROSCADA', 'FLANGEROSCADA', 'BRIDAROSCADA'], MFLANGELJ: ['BRIDALOCA', 'BRIDATOLA', 'FLANGESOLTA', 'BRIDABOJA'], MFLANGEEN: ['BRIDAEN1092', 'BRIDAEN1092', 'FLANGEEN1092', 'BRIDAEN1092'], MFLANGE47: ['BRIDAB1647', 'BRIDAB1647', 'FLANGEB1647', 'BRIDAB1647'],
  MSUPPORT: ['SOPORTE', 'SOPORTE', 'SUPORTE', 'SUPORT'], MSPAN: ['SEPARACIONSOPORTES', 'SEPARACIONSOPORTES', 'ESPACAMENTOSUPORTES', 'SEPARACIOSUPORTS'], MPUMP: ['BOMBA', 'BOMBA', 'BOMBA', 'BOMBA'], MVESSEL: ['RECIPIENTE', 'RECIPIENTE', 'RECIPIENTE', 'RECIPIENT'],
  MNOZZLE: ['TUBULADURA', 'TUBULADURA', 'TUBULADURA', 'TUBULADURA'], MINSTR: ['INSTRUMENTO', 'INSTRUMENTO', 'INSTRUMENTO', 'INSTRUMENT'], MINSUL: ['AISLAMIENTO', 'ILLAMENTO', 'ISOLAMENTO', 'AILLAMENT'],
  MPIPE3D: ['TUBERIA3D', 'TUBAXE3D', 'TUBAGEM3D', 'CANONADA3D'], MISO: ['ISOMETRICA', 'ISOMETRICA', 'ISOMETRICA', 'ISOMETRICA'], MSPOOL: ['SPOOL', 'SPOOL', 'SPOOL', 'SPOOL'],
  MPIPE: ['TUBERIAMEC', 'TUBAXEMEC', 'TUBAGEMMEC', 'CANONADAMEC'], MSPEC: ['ESPECTUBERIA', 'ESPECTUBAXE', 'ESPECTUBAGEM', 'ESPECCANONADA'], MFLANGE: ['BRIDAASME', 'BRIDAASME', 'FLANGEASME', 'BRIDAASME'],
  MFLANGEWN: ['BRIDAWN', 'BRIDAWN', 'FLANGEWN', 'BRIDAWN'], MFLANGESO: ['BRIDASO', 'BRIDASO', 'FLANGESO', 'BRIDASO'], MFLANGELWN: ['BRIDALWN', 'BRIDALWN', 'FLANGELWN', 'BRIDALWN'], MFLANGEBL: ['BRIDACIEGA', 'BRIDACEGA', 'FLANGECEGA', 'BRIDACEGA'],
  MFLANGETABLE: ['TABLABRIDAS', 'TABOABRIDAS', 'TABELAFLANGES', 'TAULABRIDES'], MELBOW: ['CODO', 'COBADO', 'CURVA', 'COLZE'], MREDUCER: ['REDUCCION', 'REDUCION', 'REDUCAO', 'REDUCCIO'], MREDUCERECC: ['REDUCCIONEXC', 'REDUCIONEXC', 'REDUCAOEXC', 'REDUCCIOEXC'],
  MTEE: ['TE', 'TE', 'TE', 'TE'], MCROSS: ['CRUZ', 'CRUZ', 'CRUZETA', 'CREU'], MCAP: ['CASQUETE', 'CASQUETE', 'TAMPAO', 'CASQUET'], MCOUPLING: ['MANGUITO', 'MANGUITO', 'UNIAO', 'MANIGUET'], MBOM: ['LISTAMEC', 'LISTAMEC', 'LISTAMEC', 'LLISTAMEC'],
  MLEDIT: ['EDITARLM', 'EDITARLM', 'EDITARLM', 'EDITALM'], POINTCLOUDSECTION: ['SECCIONNUBE', 'SECCIONNUBE', 'SECCAONUVEM', 'SECCIONUVOL'],
  FILLETEDGE: ['EMPALMEARISTA', 'EMPALMEARESTA', 'CONCORDARARESTA', 'ARRODONIRARESTA'], CHAMFEREDGE: ['CHAFLANARISTA', 'CHAFRANARESTA', 'CHANFROARESTA', 'XAMFRANARESTA'],
  SLICE: ['CORTE', 'CORTE', 'CORTE', 'TALL'], SECTION: ['SECCION', 'SECCION', 'SECCAO', 'SECCIO'], VIEWBASE: ['VISTABASE', 'VISTABASE', 'VISTABASE', 'VISTABASE'],
  STEPOUT: ['EXPORTARSTEP', 'EXPORTARSTEP', 'EXPORTARSTEP', 'EXPORTASTEP'], IFCOUT: ['EXPORTARIFC', 'EXPORTARIFC', 'EXPORTARIFC', 'EXPORTAIFC'], IFCIMPORT: ['IMPORTARIFC', 'IMPORTARIFC', 'IMPORTARIFC', 'IMPORTAIFC'],
  CONVTOMESH: ['CONVAMALLA', 'CONVAMALLA', 'CONVAMALHA', 'CONVAMALLA'],
  DUCTELEV: ['COTACONDUCTO', 'COTACONDUTO', 'COTACONDUTA', 'COTACONDUCTE'], DUCT3D: ['CONDUCTO3D', 'CONDUTO3D', 'CONDUTA3D', 'CONDUCTE3D'], DUCTISO: ['ISOCONDUCTO', 'ISOCONDUTO', 'ISOCONDUTA', 'ISOCONDUCTE'],
  DUCTBOM: ['MATERIALESCONDUCTO', 'MATERIAISCONDUTO', 'MATERIAISCONDUTA', 'MATERIALSCONDUCTE'], ROOMLOADS: ['CARGASTERMICAS', 'CARGASTERMICAS', 'CARGASTERMICAS', 'CARREGUESTERMIQUES'],
  PEDSHEET: ['HOJAPED', 'FOLLAPED', 'FOLHAPED', 'FULLPED'], FLANGE: ['BRIDA', 'BRIDA', 'FLANGE', 'BRIDA'], PIPECALC: ['CALCTUBERIA', 'CALCTUBAXE', 'CALCTUBAGEM', 'CALCCANONADA'],
  PIDTAG: ['ETIQUETAPID', 'ETIQUETAPID', 'ETIQUETAPID', 'ETIQUETAPID'], PIDLIST: ['LISTAPID', 'LISTAPID', 'LISTAPID', 'LLISTAPID'],
  GISIMPORT: ['IMPORTARSIG', 'IMPORTARSIX', 'IMPORTARSIG', 'IMPORTASIG'], DWGOUT: ['GUARDARDWG', 'GARDARDWG', 'GUARDARDWG', 'DESADWG'], DWGCONVERTER: ['CONVERSORDWG', 'CONVERSORDWG', 'CONVERSORDWG', 'CONVERTIDORDWG'],
  COLLAB: ['COLABORAR', 'COLABORAR', 'COLABORAR', 'COLLABORAR'], LAYERCLAIM: ['RESERVARCAPA', 'RESERVARCAPA', 'RESERVARCAMADA', 'RESERVACAPA'],
  COMMENT: ['COMENTAR', 'COMENTAR', 'COMENTAR', 'COMENTAR'], COMMENTS: ['COMENTARIOS', 'COMENTARIOS', 'COMENTARIOS', 'COMENTARIS'], TOUCHMODE: ['MODOTABLETA', 'MODOTABLETA', 'MODOTABLET', 'MODETAULETA'],
};

const lines = (t) => t.split('\n').map((l) => l.split(' | ')).filter((p) => p.length >= 5);
export function applyV8({ UI, TXT_PTCA, KW, SENT, SENT_RE, MSG, MSG_RE, CMD_ES, GL, PT, CA }) {
  const pt = [];
  for (const [es, gl, en, ptv, ca] of lines(UI8)) { if (!UI[es] || UI[es][1] === es || UI[es][0] === es) UI[es] = [gl, en]; pt.push(`${es} | ${ptv} | ${ca}`); }
  TXT_PTCA.push('\n' + pt.join('\n') + '\n');
  for (const [en, es, gl, ptv, ca] of lines(SENT8)) { SENT[en] ??= es; GL.SENT_GL[en] ??= gl; PT.SENT[en] ??= ptv; CA.SENT[en] ??= ca; }
  for (const [re, es, gl, ptv, ca] of SENTRE8) { SENT_RE.push([re, es]); GL.SENT_RE_GL.push([re, gl]); PT.SENT_RE.push([re, ptv]); CA.SENT_RE.push([re, ca]); }
  for (const [en, es, gl, ptv, ca] of lines(KW8)) { if (!(en in KW)) KW[en] = es; if (!(en in GL.KW_GL)) GL.KW_GL[en] = gl; if (!(en in PT.KW)) PT.KW[en] = ptv; if (!(en in CA.KW)) CA.KW[en] = ca; }
  for (const [en, es, gl, ptv, ca] of lines(MSG8)) { MSG[en] ??= es; GL.MSG_GL[en] ??= gl; PT.MSG[en] ??= ptv; CA.MSG[en] ??= ca; }
  for (const [re, es, gl, ptv, ca] of MSGRE8) { MSG_RE.push([re, es]); GL.MSG_RE_GL.push([re, gl]); PT.MSG_RE.push([re, ptv]); CA.MSG_RE.push([re, ca]); }
  for (const [en, [es, gl, ptv, ca]] of Object.entries(CMD8)) {
    if (!CMD_ES[es]) CMD_ES[es] = en;
    if (!GL.CMD_GL[gl]) GL.CMD_GL[gl] = en;
    if (!PT.CMD[ptv]) PT.CMD[ptv] = en;
    if (!CA.CMD[ca]) CA.CMD[ca] = en;
  }
}
