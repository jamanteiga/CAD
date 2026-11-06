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
Imagen PNG | Imaxe PNG | PNG image | Imagem PNG | Imatge PNG
Poligonal | Poligonal | Polygonal | Poligonal | Poligonal
`;

// Mensajes de petición: English | castellano | galego | português | català
const SENT8 = `
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
Layer name | Nombre de capa | Nome de capa | Nome da camada | Nom de capa
Specify location of projected view | Indique la posición de la vista proyectada | Indique a posición da vista proxectada | Indique a posição da vista projetada | Indiqueu la posició de la vista projectada
Select an edge | Designe una arista | Designe unha aresta | Selecione uma aresta | Designeu una aresta
Specify start point of slicing plane | Indique el punto inicial del plano de corte | Indique o punto inicial do plano de corte | Indique o ponto inicial do plano de corte | Indiqueu el punt inicial del pla de tall
Specify a point on desired side | Indique un punto en el lado que desea conservar | Indique un punto no lado que desexa conservar | Indique um ponto no lado a manter | Indiqueu un punt al costat que voleu conservar
`;

// Opciones: English | castellano | galego | português | català
const KW8 = `
3points | 3puntos | 3puntos | 3pontos | 3punts
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
No layers are reserved. | No hay capas reservadas. | Non hai capas reservadas. | Não há camadas reservadas. | No hi ha capes reservades.
`;
// Mensajes con valores: patrón, castellano, galego, português, català
const MSGRE8 = [
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
