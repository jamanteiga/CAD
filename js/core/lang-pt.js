// Português: mensagens de pedido, opções e nomes de comando da linha de comandos.
// As chaves são os textos internos em inglês; as maiúsculas das opções marcam a abreviatura.
const parse = (txt) => { const o = {}; for (const l of txt.split('\n')) { const i = l.indexOf(' | '); if (i > 0) o[l.slice(0, i)] = l.slice(i + 3); } return o; };

export const KW = {
  Undo: 'desFazer', Close: 'Fechar', CLose: 'FEchar', Arc: 'Arco', Halfwidth: 'Meia largura', Length: 'Comprimento', Width: 'Largura', Line: 'Linha',
  Angle: 'Ângulo', CEnter: 'CEntro', Center: 'Centro', Direction: 'Direção', Radius: 'Raio', 'Second pt': 'Segundo pto', End: 'Fim',
  'chord Length': 'comprimento de Corda', '3P': '3P', '2P': '2P', 'Ttr (tan tan radius)': 'Ttr (tangente tangente raio)', Diameter: 'Diâmetro',
  Chamfer: 'Chanfro', Elevation: 'Elevação', Fillet: 'cOncordância', Thickness: 'Espessura', Area: 'Área', Dimensions: 'Cotas', Rotation: 'Rotação',
  Edge: 'Aresta', 'Inscribed in circle': 'Inscrito no círculo', 'Circumscribed about circle': 'Circunscrito ao círculo',
  Parameter: 'Parâmetro', 'Included angle': 'ângulo Incluído', Method: 'Método', Knots: 'Nós', Object: 'Objeto', 'start Tangency': 'Tangência inicial',
  'end Tangency': 'Tangência final', toLerance: 'toLerância', Hor: 'Hor', Ver: 'Ver', Ang: 'Ang', Bisect: 'Bissetriz', Offset: 'Deslocamento',
  'Arc length': 'Comprimento de arco', Rectangular: 'Retangular', Polygonal: 'Poligonal', Freehand: 'à mão Livre', Style: 'Estilo', Modify: 'Modificar',
  Frames: 'Molduras', Polyline: 'Polilinha', Displacement: 'Deslocamento', Array: 'Matriz', Fit: 'Ajustar', Copy: 'Copiar', Reference: 'Referência',
  Points: 'Pontos', Yes: 'Sim', No: 'Não', Through: 'Através', Erase: 'Apagar', Layer: 'Camada', Current: 'Atual', Source: 'Origem', Exit: 'Sair',
  Multiple: 'Múltiplo', 'cuTting edges': 'arestas de Corte', Fence: 'Vedação', Crossing: 'Cruzamento', mOde: 'mOdo', Project: 'Projeção', eRase: 'Eliminar',
  Quick: 'Rápido', Standard: 'Padrão', 'First point': 'Primeiro ponto', Polyline_: 'Polilinha', Trim: 'aParar', Distance: 'Distância', mEthod: 'méTodo',
  PAth: 'Caminho', POlar: 'Polar', 'Base point': 'Ponto base', 'Axis of rotation': 'Eixo de rotação', DElta: 'Delta', Percent: 'Percentagem',
  Total: 'Total', DYnamic: 'Dinâmico', Open: 'Abrir', Join: 'Unir', 'Edit vertex': 'Editar vértice', Spline: 'Spline', Decurve: 'Endireitar',
  'Ltype gen': 'geração tipoLin', Reverse: 'Inverter', Settings: 'Definições', Color: 'Cor', LAyer: 'cAmada', LType: 'tipoLin', ltScale: 'Escala tl',
  LWeight: 'Espessura lin', TRansparency: 'tRansparência', Material: 'Material', PLotstyle: 'estilo de Impressão', 'Above objects': 'Acima dos objetos',
  'Under objects': 'Abaixo dos objetos', Front: 'Frente', Back: 'Trás', 'Multiple points': 'Múltiplos pontos', 'Add area': 'Adicionar área',
  'Subtract area': 'Subtrair área', Block: 'Bloco', Auto: 'Auto', Control: 'Controlo', BEgin: 'Início', Mark: 'Marca',
  Justify: 'Justificar', Left: 'Esquerda', Right: 'Direita', Align: 'aLinhar', Middle: 'Meio', TL: 'SE', TC: 'SC', TR: 'SD', ML: 'ME', MC: 'MC', MR: 'MD',
  BL: 'IE', BC: 'IC', BR: 'ID', Height: 'Altura', 'Line spacing': 'Entrelinha', Columns: 'Colunas', Mtext: 'textoM', Text: 'Texto', Horizontal: 'Horizontal',
  Vertical: 'Vertical', Rotated: 'Rodada', Quadrant: 'Quadrante', Xdatum: 'Xbase', Ydatum: 'Ybase', Select: 'Selecionar', Home: 'Repor',
  'leader Landing first': 'primeiro Patamar', 'Content first': 'primeiro Conteúdo', Options: 'Opções', 'Select objects': 'Selecionar objetos',
  seTtings: 'Definições', sEttings: 'Definições', Properties: 'Propriedades', 'draW boundary': 'desenhar Contorno', 'remove Boundaries': 'Remover contornos',
  Advanced: 'Avançado', 'DRaw order': 'Ordem de desenho', Origin: 'oRigem', ANnotative: 'aNotativo', 'hatch Color': 'cor da Hachura', Transparency: 'Transparência',
  Solid: 'Sólido', 'User defined': 'Utilizador', Gradient: 'Gradiente', Basepoint: 'Ponto base', Scale: 'Escala', Rotate: 'Rodar', Corner: 'Canto', XYZ: 'XYZ',
  'Entire drawing': 'Todo o desenho', Objects: 'Objetos', Cancel: 'Cancelar', Alignment: 'Alinhamento', Linear: 'Linear', Polar: 'Polar', Flip: 'Inverter',
  Visibility: 'Visibilidade', XY: 'XY', Lookup: 'Consulta', Name: 'Nome', Label: 'Etiqueta', Chain: 'Cadeia', Description: 'Descrição', Base: 'Base',
  Palette: 'Paleta', 'Value set': 'conjunto de Valores', Stretch: 'Esticar', Move: 'Mover', None: 'Nenhum', New: 'Novo', 'Set current': 'Definir atual',
  Rename: 'Mudar nome', Delete: 'Eliminar', 'Hide all': 'Ocultar todos', 'Show all': 'Mostrar todos', 'Leave unchanged': 'Deixar inalterado',
  'Current state': 'Estado atual', 'All visibility states': 'Todos os estados', All: 'Tudo', Dynamic: 'Dinâmico', Extents: 'Extensão', Previous: 'Anterior',
  Window: 'Janela', Orthographic: 'Ortogonal', Restore: 'Restaurar', Save: 'Guardar', '?': '?', Template: 'Modelo', SAveas: 'Guardar como', Set: 'Definir',
  Make: 'Fazer', ON: 'LIG', OFF: 'DESL', Ltype: 'tipoLin', Plot: 'Imprimir', Freeze: 'Congelar', Thaw: 'Descongelar', LOck: 'BLoquear', Unlock: 'DESBloquear',
  stAte: 'eStado', rEconcile: 'rECONciliar', MATerial: 'MATerial', 'No plot': 'Não imprimir', Load: 'Carregar', Create: 'Criar', Truecolor: 'Cor verdadeira',
  COlorbook: 'Livro de cores', Lock: 'Bloquear', Shadeplot: 'Impressão sombreada', NEw: 'Nova', NAmed: 'Com nome', Pick: 'Selecionar',
  'Pick points': 'Selecionar pontos', Ascending: 'Ascendente', Annotative: 'Anotativo', CPolygon: 'PolígonoC', SYstem: 'SIstema', SHape: 'FOrma',
  WIdth: 'LArgura', HEight: 'ALtura', DIameter: 'DIâmetro', FLow: 'CAudal', RAdius: 'RAio', Supply: 'Insuflação', Return: 'Retorno', Exhaust: 'Extração',
  Outdoor: 'ar eXterior', Round: 'Circular', COUnt: 'Número', Spacing: 'Espaçamento', eXit: 'Sair', Items: 'Itens', 'Fill angle': 'Ângulo de preenchimento',
  'ROTate items': 'Rodar itens', Show: 'Mostrar', Hide: 'Ocultar', 'Add objects': 'Adicionar objetos', 'Remove objects': 'Remover objetos', REName: 'Mudar nome',
  Excel: 'Excel', Csv: 'Csv', Isometric: 'Isométrico', Top: 'Superior', Coincident: 'Coincidente', Parallel: 'Paralela', Perpendicular: 'Perpendicular',
  Equal: 'Igual', Fix: 'Fixa', CONcentric: 'COncêntrica', COLlinear: 'COLinear', Tangent: 'Tangente', LInear: 'LInear', Aligned: 'Alinhada', ANgular: 'ANgular',
};
export const DEFW = { Exit: 'Sair', Displacement: 'Deslocamento', 'real time': 'tempo real', 'select object': 'selecionar objeto', Object: 'Objeto', Total: 'Total',
  Yes: 'Sim', No: 'Não', Y: 'S', N: 'N', Through: 'Através', Stretch: 'Esticar', Linear: 'Linear', Settings: 'Definições', Fit: 'Ajustar', Back: 'Trás',
  'Set current': 'Definir atual', 'Current state': 'Estado atual', 'Leave unchanged': 'Deixar inalterado', Rectangular: 'Retangular', Objects: 'Objetos',
  Quick: 'Rápido', Standard: 'Padrão', Source: 'Origem', 'specify vertex': 'especifique o vértice', 'use X scale factor': 'usar fator de escala X',
  'use first point as displacement': 'usar o primeiro ponto como deslocamento', 'select all': 'selecionar tudo', Select: 'Selecionar', Polyline: 'Polilinha',
  exit: 'sair', Mtext: 'textoM', BYLAYER: 'PORCAMADA', BYBLOCK: 'PORBLOCO', ByLayer: 'PorCamada', CONTINUOUS: 'CONTINUOUS', set: 'definir', Options: 'Opções',
  Inscribed: 'Inscrito', none: 'nenhum', continue: 'continuar' };

export const SENT = parse(`
Select continued dimension | Selecione a cota contínua
Specify objects to stretch | Especifique os objetos a esticar
Specify objects for Rotate action | Especifique os objetos para a ação Rodar
Specify objects for Flip action | Especifique os objetos para a ação Inverter
Specify first end point of circle's diameter | Especifique o primeiro ponto final do diâmetro do círculo
Specify second end point of circle's diameter | Especifique o segundo ponto final do diâmetro do círculo
Specify diameter of circle | Especifique o diâmetro do círculo
Enter name for new layer | Introduza o nome da nova camada
Enter names for new layer(s) | Introduza os nomes das novas camadas
Enter name of new layout | Introduza o nome do novo layout
Select cutting edges ... | Selecione as arestas de corte...
Select object to trim | Selecione o objeto a aparar
Select object to extend | Selecione o objeto a estender
Enter a extend mode option | Introduza uma opção de modo de extensão
Select object to measure | Selecione o objeto a graduar
Select object to divide | Selecione o objeto a dividir
Specify starting width | Especifique a largura inicial
Specify starting half-width | Especifique a meia largura inicial
Specify ending width | Especifique a largura final
Specify ending half-width | Especifique a meia largura final
Align arrayed items to path? | Alinhar os itens da matriz com o caminho?
Align block with object? | Alinhar o bloco com o objeto?
Do you want to turn it into one? | Pretende convertê-lo numa polilinha?
Object selected is not a polyline | O objeto selecionado não é uma polilinha
Enter X scale factor, specify opposite corner, | Introduza o fator de escala X, especifique o canto oposto,
Enter Y scale factor | Introduza o fator de escala Y
Enter a loaded linetype name | Introduza o nome de um tipo de linha carregado
Enter a pattern name | Introduza o nome do padrão
Enter a plotting preference | Introduza a preferência de impressão
Enter a scale factor (nX or nXP) | Introduza um fator de escala (nX ou nXP)
Enter an option | Introduza uma opção
Enter angle of xline (0) | Introduza o ângulo da linha auxiliar (0)
Enter area of rectangle in current units | Introduza a área do retângulo em unidades atuais
Enter array type | Introduza o tipo de matriz
Enter base point | Introduza o ponto base
Enter block name | Introduza o nome do bloco
Enter delta length | Introduza o incremento de comprimento
Enter dimension text | Introduza o texto da cota
Enter distance increment | Introduza o incremento de distância
Enter first line of annotation text | Introduza a primeira linha do texto de anotação
Enter justification | Introduza a justificação
Enter layer description | Introduza a descrição da camada
Enter layer name to make current | Introduza o nome da camada a tornar atual
Enter layer names for this plot preference | Introduza os nomes de camada para esta preferência de impressão
Enter layer option for offset objects | Introduza a opção de camada para os objetos deslocados
Enter layout option | Introduza a opção de layout
Enter layout to make current | Introduza o layout a tornar atual
Enter layout to rename | Introduza o layout a mudar de nome
Enter linetype(s) to load | Introduza o(s) tipo(s) de linha a carregar
Enter lineweight (0.0mm - 2.11mm) | Introduza a espessura de linha (0.0mm - 2.11mm)
Enter list of object snap modes | Introduza a lista de modos de referência a objetos
Enter magnification or height | Introduza a ampliação ou a altura
Enter name for new visibility state | Introduza o nome do novo estado de visibilidade
Enter name list of layer(s) to freeze | Introduza a lista de nomes de camada(s) a congelar
Enter name list of layer(s) to lock | Introduza a lista de nomes de camada(s) a bloquear
Enter name list of layer(s) to thaw | Introduza a lista de nomes de camada(s) a descongelar
Enter name list of layer(s) to unlock | Introduza a lista de nomes de camada(s) a desbloquear
Enter name list of layers | Introduza a lista de nomes de camadas
Enter name list of layers for lineweight | Introduza a lista de nomes de camadas para a espessura de linha
Enter name list of layers to turn Off | Introduza a lista de nomes de camadas a desligar
Enter name list of layers to turn On | Introduza a lista de nomes de camadas a ligar
Enter name of block to insert | Introduza o nome do bloco a inserir
Enter name of block to sync | Introduza o nome do bloco a sincronizar
Enter name of existing block | Introduza o nome de um bloco existente
Enter name of layout to delete | Introduza o nome do layout a eliminar
Enter new color | Introduza a nova cor
Enter new layer name | Introduza o novo nome de camada
Enter new layout name | Introduza o novo nome de layout
Enter new linetype name | Introduza o novo nome de tipo de linha
Enter new linetype scale factor | Introduza o novo fator de escala do tipo de linha
Enter new lineweight | Introduza a nova espessura de linha
Enter new name for current state | Introduza o novo nome do estado atual
Enter new value for CELTSCALE | Introduza o novo valor de CELTSCALE
Enter next line of annotation text | Introduza a linha seguinte do texto de anotação
Enter next point | Introduza o ponto seguinte
Enter number of items along path | Introduza o número de itens ao longo do caminho
Enter number of items to array | Introduza o número de itens da matriz
Enter number of sides | Introduza o número de lados
Enter object ordering option | Introduza a opção de ordenação dos objetos
Enter object type to rename | Introduza o tipo de objeto a mudar de nome
Enter old layer name | Introduza o nome antigo da camada
Enter parameter label | Introduza a etiqueta do parâmetro
Enter parameter type | Introduza o tipo de parâmetro
Enter percentage length | Introduza a percentagem de comprimento
Enter property to change | Introduza a propriedade a alterar
Enter rectangle length | Introduza o comprimento do retângulo
Enter style name | Introduza o nome do estilo
Enter text | Introduza o texto
Enter the distance between rows or specify unit cell (---) | Introduza a distância entre linhas ou especifique a célula unitária (---)
Enter the number of columns (|||) | Introduza o número de colunas (|||)
Enter the number of items in the array | Introduza o número de itens da matriz
Enter the number of operations to undo | Introduza o número de operações a desfazer
Enter the number of rows (---) | Introduza o número de linhas (---)
Enter the number of segments | Introduza o número de segmentos
Enter variable name | Introduza o nome da variável
Enter view name to restore | Introduza o nome da vista a restaurar
Enter view name to save | Introduza o nome da vista a guardar
Enter view name(s) to delete | Introduza o(s) nome(s) da(s) vista(s) a eliminar
Erase source object after offsetting? | Apagar o objeto de origem após deslocar?
Erase source objects? | Apagar os objetos de origem?
First polygon point | Primeiro ponto do polígono
Make visible for | Tornar visível para
New color | Nova cor
Parameter name to delete | Nome do parâmetro a eliminar
Pick internal point | Selecione um ponto interno
Remove objects | Remover objetos
Rotate arrayed objects? | Rodar os objetos da matriz?
Save changes to block? | Guardar as alterações no bloco?
Scale objects based on alignment points? | Escalar os objetos com base nos pontos de alinhamento?
Select 2D polyline | Selecione a polilinha 2D
Select a block | Selecione um bloco
Select a block reference | Selecione uma referência de bloco
Select a line object | Selecione um objeto de linha
Select an annotation object | Selecione um objeto de anotação
Select an object on the layer to be frozen | Selecione um objeto da camada a congelar
Select an object on the layer to be locked | Selecione um objeto da camada a bloquear
Select an object on the layer to be turned off | Selecione um objeto da camada a desligar
Select an object on the layer to be unlocked | Selecione um objeto da camada a desbloquear
Select an object to change | Selecione um objeto a alterar
Select an object to measure | Selecione um objeto a medir
Select arc or circle | Selecione um arco ou círculo
Select arc, circle, line, | Selecione arco, círculo, linha,
Select cutting edges | Selecione as arestas de corte
Select destination object(s) | Selecione o(s) objeto(s) de destino
Select dimension | Selecione a cota
Select first line | Selecione a primeira linha
Select first object | Selecione o primeiro objeto
Select hatch object | Selecione o objeto de hachura
Select object | Selecione um objeto
Select object on layer to delete | Selecione um objeto da camada a eliminar
Select object on layer to merge | Selecione um objeto da camada a fundir
Select object on target layer | Selecione um objeto da camada de destino
Select object to dimension | Selecione o objeto a cotar
Select object to offset | Selecione o objeto a deslocar
Select object whose layer will become current | Selecione o objeto cuja camada passará a ser a atual
Select objects | Selecione objetos
Select objects on the layer(s) to be isolated | Selecione objetos da(s) camada(s) a isolar
Select objects to be changed to the current layer | Selecione os objetos a passar para a camada atual
Select objects to erase | Selecione os objetos a apagar
Select objects to hide | Selecione os objetos a ocultar
Select path curve | Selecione a curva do caminho
Select polyline | Selecione a polilinha
Select polylines to convert to splines | Selecione as polilinhas a converter em splines
Select reference objects | Selecione os objetos de referência
Select second line | Selecione a segunda linha
Select second line or shift-select to apply corner | Selecione a segunda linha ou prima Shift ao selecionar para aplicar o canto
Select second object or shift-select to apply corner | Selecione o segundo objeto ou prima Shift ao selecionar para aplicar o canto
Select source object | Selecione o objeto de origem
Select source object or multiple objects to join at once | Selecione o objeto de origem ou vários objetos para unir de uma vez
Source | Origem
Specify X scale factor | Especifique o fator de escala X
Specify Y scale factor | Especifique o fator de escala Y
Specify a point | Especifique um ponto
Specify a scale for the pattern | Especifique a escala do padrão
Specify a second extension line origin | Especifique a origem da segunda linha de chamada
Specify an angle for the pattern | Especifique o ângulo do padrão
Specify angle of dimension line | Especifique o ângulo da linha de cota
Specify angle of dimension text | Especifique o ângulo do texto da cota
Specify angle start point | Especifique o ponto inicial do ângulo
Specify angle vertex | Especifique o vértice do ângulo
Specify angle vertex point | Especifique o ponto do vértice do ângulo
Specify axis endpoint of ellipse | Especifique o ponto final do eixo da elipse
Specify axis endpoint of elliptical arc | Especifique o ponto final do eixo do arco elíptico
Specify base point | Especifique o ponto base
Specify base point of reflection line | Especifique o ponto base da linha de reflexão
Specify base point or displacement | Especifique o ponto base ou o deslocamento
Specify break point | Especifique o ponto de quebra
Specify center of donut | Especifique o centro da anilha
Specify center of ellipse | Especifique o centro da elipse
Specify center of polygon | Especifique o centro do polígono
Specify center point | Especifique o ponto central
Specify center point for circle | Especifique o ponto central do círculo
Specify center point of arc | Especifique o ponto central do arco
Specify center point of array | Especifique o ponto central da matriz
Specify corner of viewport | Especifique o canto da janela
Specify corner of window, enter a scale factor (nX or nXP), | Especifique o canto da janela, introduza um fator de escala (nX ou nXP),
Specify dimension arc line location | Especifique a posição do arco de cota
Specify dimension line location | Especifique a posição da linha de cota
Specify displacement | Especifique o deslocamento
Specify distance to other axis | Especifique a distância ao outro eixo
Specify end angle | Especifique o ângulo final
Specify end point of arc | Especifique o ponto final do arco
Specify endpoint | Especifique o ponto final
Specify endpoint of arc | Especifique o ponto final do arco
Specify endpoint of axis | Especifique o ponto final do eixo
Specify endpoint of line | Especifique o ponto final da linha
Specify endpoint of reflection line | Especifique o ponto final da linha de reflexão
Specify feature location | Especifique a posição do elemento
Specify fillet radius | Especifique o raio de concordância
Specify fillet radius for rectangles | Especifique o raio de concordância dos retângulos
Specify first angle endpoint | Especifique o primeiro ponto final do ângulo
Specify first break point | Especifique o primeiro ponto de quebra
Specify first chamfer distance | Especifique a primeira distância de chanfro
Specify first chamfer distance for rectangles | Especifique a primeira distância de chanfro dos retângulos
Specify first corner | Especifique o primeiro canto
Specify first corner of stretch frame | Especifique o primeiro canto da moldura de esticamento
Specify first corner point | Especifique o primeiro ponto de canto
Specify first destination point | Especifique o primeiro ponto de destino
Specify first endpoint of edge | Especifique o primeiro ponto final da aresta
Specify first extension line origin | Especifique a origem da primeira linha de chamada
Specify first fence point | Especifique o primeiro ponto da vedação
Specify first leader point, | Especifique o primeiro ponto da linha de chamada,
Specify first point | Especifique o primeiro ponto
Specify first point of mirror line | Especifique o primeiro ponto da linha de espelho
Specify first point on circle | Especifique o primeiro ponto no círculo
Specify first source point | Especifique o primeiro ponto de origem
Specify height | Especifique a altura
Specify included angle | Especifique o ângulo incluído
Specify insertion base point | Especifique o ponto base de inserção
Specify insertion point | Especifique o ponto de inserção
Specify insertion point of text | Especifique o ponto de inserção do texto
Specify inside diameter of donut | Especifique o diâmetro interior da anilha
Specify internal point | Especifique um ponto interno
Specify leader arrowhead location | Especifique a posição da seta da linha de chamada
Specify leader endpoint | Especifique o ponto final da linha de chamada
Specify leader landing location | Especifique a posição do patamar da linha de chamada
Specify length for rectangles | Especifique o comprimento dos retângulos
Specify length of line | Especifique o comprimento da linha
Specify length of segment | Especifique o comprimento do segmento
Specify line width for rectangles | Especifique a largura de linha dos retângulos
Specify linetype name | Especifique o nome do tipo de linha
Specify lower left corner | Especifique o canto inferior esquerdo
Specify minimum length of arc | Especifique o comprimento mínimo do arco
Specify new end point | Especifique o novo ponto final
Specify new length | Especifique o novo comprimento
Specify new linetype scale | Especifique a nova escala do tipo de linha
Specify new location for dimension text | Especifique a nova posição do texto da cota
Specify new width for all segments | Especifique a nova largura de todos os segmentos
Specify next fence point | Especifique o ponto seguinte da vedação
Specify next point | Especifique o ponto seguinte
Specify offset distance | Especifique a distância de deslocamento
Specify opposite corner | Especifique o canto oposto
Specify other corner point | Especifique o canto oposto
Specify other endpoint of axis | Especifique o outro ponto final do eixo
Specify outside diameter of donut | Especifique o diâmetro exterior da anilha
Specify parameter location | Especifique a posição do parâmetro
Specify point | Especifique um ponto
Specify point on object for first tangent of circle | Especifique um ponto no objeto para a primeira tangente do círculo
Specify point on object for second tangent of circle | Especifique um ponto no objeto para a segunda tangente do círculo
Specify point on side to offset | Especifique um ponto no lado a deslocar
Specify radius of arc | Especifique o raio do arco
Specify radius of circle | Especifique o raio do círculo
Specify radius of parameter | Especifique o raio do parâmetro
Specify reference length | Especifique o comprimento de referência
Specify rotation angle | Especifique o ângulo de rotação
Specify rotation angle of text | Especifique o ângulo de rotação do texto
Specify rotation around major axis | Especifique a rotação em torno do eixo maior
Specify scale factor | Especifique o fator de escala
Specify scale factor for XYZ axes | Especifique o fator de escala dos eixos XYZ
Specify second angle endpoint | Especifique o segundo ponto final do ângulo
Specify second break point | Especifique o segundo ponto de quebra
Specify second chamfer distance | Especifique a segunda distância de chanfro
Specify second chamfer distance for rectangles | Especifique a segunda distância de chanfro dos retângulos
Specify second destination point | Especifique o segundo ponto de destino
Specify second endpoint of edge | Especifique o segundo ponto final da aresta
Specify second endpoint of text baseline | Especifique o segundo ponto final da linha base do texto
Specify second extension line origin | Especifique a origem da segunda linha de chamada
Specify second point | Especifique o segundo ponto
Specify second point of arc | Especifique o segundo ponto do arco
Specify second point of mirror line | Especifique o segundo ponto da linha de espelho
Specify second point on arc | Especifique o segundo ponto no arco
Specify second point on circle | Especifique o segundo ponto no círculo
Specify second source point | Especifique o segundo ponto de origem
Specify side to offset | Especifique o lado a deslocar
Specify start angle | Especifique o ângulo inicial
Specify start point | Especifique o ponto inicial
Specify start point of arc | Especifique o ponto inicial do arco
Specify start point of text | Especifique o ponto inicial do texto
Specify tangent direction for the start point of arc | Especifique a direção tangente no ponto inicial do arco
Specify the angle to fill (+=ccw, -=cw) | Especifique o ângulo a preencher (+=anti-horário, -=horário)
Specify the distance between columns (|||) | Especifique a distância entre colunas (|||)
Specify the new angle | Especifique o novo ângulo
Specify the reference angle | Especifique o ângulo de referência
Specify the tangent direction for the start point of arc | Especifique a direção tangente no ponto inicial do arco
Specify third point on circle | Especifique o terceiro ponto no círculo
Specify third source point | Especifique o terceiro ponto de origem
Specify through point | Especifique o ponto de passagem
Specify total length | Especifique o comprimento total
Specify upper right corner | Especifique o canto superior direito
Specify value | Especifique o valor
Specify width | Especifique a largura
Specify width for rectangles | Especifique a largura dos retângulos
Text | Texto
Viewport View Locking | Bloqueio da vista da janela
Visibility of existing objects in new state | Visibilidade dos objetos existentes no novo estado
Specify first corner of window | Especifique o primeiro canto da janela
Specify endpoint of arc or | Especifique o ponto final do arco ou
Specify stretch point | Especifique o ponto de esticamento
Specify start point or | Especifique o ponto inicial ou
Specify center point of arc or | Especifique o ponto central do arco ou
Select object to trim or shift-select to extend | Selecione o objeto a aparar ou prima Shift ao selecionar para estender
Select object to extend or shift-select to trim | Selecione o objeto a estender ou prima Shift ao selecionar para aparar
Enter a trim mode option | Introduza uma opção de modo de aparar
Enter an extend mode option | Introduza uma opção de modo de extensão
Specify fillet radius  | Especifique o raio de concordância
Enter attribute values | Introduza os valores do atributo
Enter mode | Introduza o modo
Enter new value for SNAPUNIT | Introduza o novo valor de SNAPUNIT
Specify point on arc | Especifique um ponto no arco
Specify insertion point or | Especifique o ponto de inserção ou
Specify the tangent direction | Especifique a direção tangente
Specify new location | Especifique a nova posição
Specify base point or | Especifique o ponto base ou
Pick internal point or | Selecione um ponto interno ou
Specify internal point or | Especifique um ponto interno ou
Specify scale factor or | Especifique o fator de escala ou
Specify rotation angle or | Especifique o ângulo de rotação ou
Specify start angle or | Especifique o ângulo inicial ou
Specify end angle or | Especifique o ângulo final ou
Enter new value | Introduza o novo valor
Press ESC or ENTER to exit, or right-click to display shortcut menu. | Prima ESC ou ENTER para sair, ou clique com o botão direito para ver o menu de atalho.
Press ESC or ENTER to exit. Use the mouse wheel to zoom and drag to pan. | Prima ESC ou ENTER para sair. Use a roda do rato para zoom e arraste para deslocar a vista.
>> Expression | >> Expressão
Enter the number of segments or | Introduza o número de segmentos ou
Specify length of segment or | Especifique o comprimento do segmento ou
Enter name of block to insert  | Introduza o nome do bloco
Specify start point of text or | Especifique o ponto inicial do texto ou
Select an object to measure or | Selecione um objeto a medir ou
Select objects to stretch by crossing-window or crossing-polygon... | Selecione os objetos a esticar com janela ou polígono de cruzamento...
Specify first point of mirror line  | Especifique o primeiro ponto da linha de espelho
Enter dimension text  | Introduza o texto da cota
Specify dimension line location or | Especifique a posição da linha de cota ou
Specify markup location | Especifique a posição da marca
Enter value set (comma-separated) | Introduza o conjunto de valores (separados por vírgulas)
Enter duct system | Introduza o sistema da conduta
Enter duct shape | Introduza a forma da conduta
Specify duct width | Especifique a largura da conduta
Specify duct height | Especifique a altura da conduta
Specify duct diameter | Especifique o diâmetro da conduta
Enter air flow (m³/h) | Introduza o caudal de ar (m³/h)
Enter elbow radius ratio R/W | Introduza a relação de raio da curva R/W
Select array | Selecione a matriz
Select first point | Selecione o primeiro ponto
Select second point | Selecione o segundo ponto
Select an object | Selecione um objeto
Select second object | Selecione o segundo objeto
Select point | Selecione um ponto
Enter constraint type | Introduza o tipo de restrição
Specify first constraint point | Especifique o primeiro ponto de restrição
Specify second constraint point | Especifique o segundo ponto de restrição
Enter group name | Introduza o nome do grupo
Enter group description | Introduza a descrição do grupo
Select group | Selecione o grupo
Enter new name for group | Introduza o novo nome do grupo
Select table | Selecione a tabela
Enter file format | Introduza o formato do ficheiro
Enter isometric plane setting | Introduza o plano isométrico
Specify center of isocircle | Especifique o centro do círculo isométrico
Specify radius of isocircle | Especifique o raio do círculo isométrico
Enter line tag | Introduza o identificador da linha
Select objects or | Selecione objetos ou
Select objects to erase or | Selecione os objetos a apagar ou
Specify second point or | Especifique o segundo ponto ou
Specify third source point or | Especifique o terceiro ponto de origem ou
Select 1 dimension | Selecione 1 cota
Select polyline or | Selecione a polilinha ou
Specify first corner of stretch frame or | Especifique o primeiro canto da moldura de esticamento ou
`);
export const SENT_RE = [
  [/^Delete layer\(s\) (.*) and all objects on them\?$/, 'Eliminar a(s) camada(s) $1 e todos os seus objetos?'],
  [/^Block "(.*)" already exists\. Redefine it\?$/, 'O bloco "$1" já existe. Redefinir?'],
  [/^Enter name list of layer\(s\) for color (.*)$/, 'Introduza a lista de nomes de camada(s) para a cor $1'],
  [/^Enter name list of layers for linetype "(.*)"$/, 'Introduza a lista de nomes de camadas para o tipo de linha "$1"'],
  [/^Enter new (.*) name$/, 'Introduza o novo nome de $1'], [/^Enter old (.*) name$/, 'Introduza o nome antigo de $1'],
  [/^Enter new value for (\S+)$/, 'Introduza o novo valor de $1'], [/^Minimum arc length: (\S+)\s+Specify first corner point$/, 'Comprimento mínimo do arco: $1  Especifique o primeiro ponto de canto'],
  [/^Select parameter by name$/, 'Selecione o parâmetro pelo nome'], [/^Enter visibility state name$/, 'Introduza o nome do estado de visibilidade'],
  [/^Specify (.*) width$/, 'Especifique a largura $1'],
];

export const MSG = parse(`
*Cancel* | *Cancelar*
Nothing selected. | Nada selecionado.
Object is not valid. | O objeto não é válido.
Invalid selection. | Seleção inválida.
Invalid option keyword. | Opção inválida.
Point or option keyword required. | É necessário um ponto ou uma opção.
Requires an integer value. | É necessário um valor inteiro.
Value must be positive and nonzero. | O valor deve ser positivo e diferente de zero.
Requires numeric distance, second point, or option keyword. | É necessária uma distância numérica, um segundo ponto ou uma opção.
Requires a distance, numberX, or option keyword. | É necessária uma distância, um númeroX ou uma opção.
Requires an integer between 3 and 1024. | É necessário um inteiro entre 3 e 1024.
All segments already undone. | Todos os segmentos já foram desfeitos.
Everything has been undone | Tudo foi desfeito
Nothing to redo | Nada a refazer
Regenerating model. | A regenerar o modelo.
Lines are parallel. | As linhas são paralelas.
Radius is too large. | O raio é demasiado grande.
Circle does not exist. | O círculo não existe.
Cannot offset that object. | Não é possível deslocar esse objeto.
Object does not intersect an edge. | O objeto não interseta nenhuma aresta.
Valid hatch boundary not found. | Não foi encontrado um contorno de hachura válido.
Clipboard is empty. | A área de transferência está vazia.
No previous view saved. | Não há vista anterior guardada.
View not found. | Vista não encontrada.
Block not found. | Bloco não encontrado.
Block name required. | É necessário o nome do bloco.
No objects selected. | Não há objetos selecionados.
Block has no attributes. | O bloco não tem atributos.
Name not found. | Nome não encontrado.
Object selected is not a polyline. | O objeto selecionado não é uma polilinha.
Object selected is not an arc, circle or line. | O objeto selecionado não é um arco, círculo ou linha.
Use grips to edit vertices. | Use as pegas para editar os vértices.
Invalid length. | Comprimento inválido.
Invalid | Inválido
Rotating a copy of the selected objects. | A rodar uma cópia dos objetos selecionados.
Current settings:  Copy mode = Multiple | Definições atuais:  Modo de cópia = Múltiplo
Current positive angle in UCS:  ANGDIR=counterclockwise  ANGBASE=0 | Ângulo positivo atual no SCU:  ANGDIR=anti-horário  ANGBASE=0
Select cutting edges ... | Selecione as arestas de corte...
Selecting everything... | A selecionar tudo...
Analyzing the selected data... | A analisar os dados selecionados...
Select objects to stretch by crossing-window or crossing-polygon... | Selecione os objetos a esticar com janela ou polígono de cruzamento...
Frames are displayed. | As molduras são apresentadas.
Enter attribute values | Introduza os valores do atributo
** Command not allowed in Model Tab ** | ** Comando não permitido no separador Modelo **
** Close the Block Editor first ** | ** Feche primeiro o editor de blocos **
** Command only valid in Block Editor ** | ** Comando válido apenas no editor de blocos **
** That command may not be invoked transparently ** | ** Esse comando não pode ser executado de forma transparente **
Already in Block Editor. | Já está no editor de blocos.
Not in Block Editor. | Não está no editor de blocos.
No parameters defined. | Não há parâmetros definidos.
Parameter not found. | Parâmetro não encontrado.
Block already has a visibility parameter. | O bloco já tem um parâmetro de visibilidade.
Add a Visibility parameter first (BPARAMETER > Visibility). | Adicione primeiro um parâmetro de visibilidade (BPARAMETER > Visibilidade).
Use BVSTATE to create visibility states and BVHIDE/BVSHOW to set object visibility. | Use BVSTATE para criar estados de visibilidade e BVHIDE/BVSHOW para a visibilidade dos objetos.
No visibility parameter. | Não há parâmetro de visibilidade.
State not found. | Estado não encontrado.
Cannot delete the only state. | Não é possível eliminar o único estado.
Specify objects to stretch | Especifique os objetos a esticar
Specify objects for Rotate action | Especifique os objetos para a ação Rodar
Specify objects for Flip action | Especifique os objetos para a ação Inverter
All layers have been turned on. | Todas as camadas foram ligadas.
All layers have been thawed. | Todas as camadas foram descongeladas.
Layers isolated by LAYISO have been restored. | As camadas isoladas por LAYISO foram restauradas.
Cannot freeze the current layer. | Não é possível congelar a camada atual.
Cannot set a frozen layer current. | Não é possível tornar atual uma camada congelada.
There are no active model space viewports. | Não há janelas de espaço modelo ativas.
Cannot delete the only layout. | Não é possível eliminar o único layout.
0 objects joined | 0 objetos unidos
Radius must be > 0 for arcs. | O raio deve ser > 0 para arcos.
Unknown variable name.  Type SETVAR ? for a list of variables. | Nome de variável desconhecido. Escreva SETVAR ? para ver a lista de variáveis.
Current active settings:  Color Layer Ltype Ltscale Lineweight Transparency Thickness PlotStyle Dim Text Hatch Polyline Viewport Table Material Multileader Center object | Definições ativas:  Cor Camada Tipolin Escalatl Espessuralin Transparência Altura Estiloimpressão Cota Texto Hachura Polilinha Janela Tabela Material Multilinhachamada
Auditing Header | A auditar o cabeçalho
Auditing Tables | A auditar as tabelas
Auditing Entities Pass 1 | A auditar as entidades, passo 1
Total errors found 0 fixed 0 | Total de erros encontrados 0 corrigidos 0
of | de
1 was on a locked layer. | 1 estava numa camada bloqueada.
Expects a point or Window/Last/Crossing/BOX/ALL/Fence/WPolygon/CPolygon/Add/Remove/Previous | Espera-se um ponto ou Janela/Último/Cruzamento/Caixa/Tudo/Vedação/PolígonoJ/PolígonoC/Adicionar/Remover/Anterior
*Invalid selection* | *Seleção inválida*
Linetype not found. | Tipo de linha não encontrado.
Value must be nonzero. | O valor deve ser diferente de zero.
Value must be positive. | O valor deve ser positivo.
Cannot fillet those objects. | Não é possível concordar esses objetos.
Cannot chamfer those objects. | Não é possível chanfrar esses objetos.
No lookup parameter. | Não há parâmetro de consulta.
No ducts selected. | Não há condutas selecionadas.
No standard size meets the criteria. | Nenhuma dimensão normalizada cumpre os critérios.
No objects found. | Não foram encontrados objetos.
Object is not a member of a group. | O objeto não pertence a nenhum grupo.
Requires a value. | É necessário um valor.
`);
export const MSG_RE = [
  [/^Command: (.*)$/, 'Comando: $1'], [/^(\d+) found, (\d+) total$/, '$1 encontrado(s), $2 no total'], [/^(\d+) found$/, '$1 encontrado(s)'],
  [/^Unknown command "(.*)"\.\s+Press F1 for help\.$/, 'Comando desconhecido "$1". Prima F1 para obter ajuda.'],
  [/^Unknown command "(.*)"\.$/, 'Comando desconhecido "$1".'], [/^Error: (.*)$/, 'Erro: $1'],
  [/^\*\* (.*) command not allowed while (.*) is active \*\*$/, '** O comando $1 não é permitido enquanto $2 estiver ativo **'],
  [/^Resuming (.*) command\.$/, 'A retomar o comando $1.'], [/^Dimension text = (.*)$/, 'Texto da cota = $1'],
  [/^Current line-width is (.*)$/, 'A largura de linha atual é $1'], [/^Current settings: Mode = TRIM, Radius = (.*)$/, 'Definições atuais: Modo = APARAR, Raio = $1'],
  [/^\("TRIM" mode\) Current chamfer Dist1 = (.*), Dist2 = (.*)$/, '(Modo "APARAR") Distância1 de chanfro atual = $1, Distância2 = $2'],
  [/^Current settings: Projection=UCS, Edge=None, Mode=(\w+)$/, 'Definições atuais: Projeção=SCU, Aresta=Nenhuma, Modo=$1'],
  [/^Current settings: Erase source=(\w+)\s+Layer=Source\s+OFFSETGAPTYPE=0$/, 'Definições atuais: Apagar origem=$1  Camada=Origem  OFFSETGAPTYPE=0'],
  [/^Current text style:\s+"(.*)"\s+Text height:\s+(\S+)\s+Annotative:\s+No(.*)$/, 'Estilo de texto atual: "$1"  Altura do texto: $2  Anotativo: Não$3'],
  [/^Current point modes:\s+PDMODE=(\S+)\s+PDSIZE=(\S+)$/, 'Modos de ponto atuais: PDMODE=$1  PDSIZE=$2'], [/^Current layer:\s+"(.*)"$/, 'Camada atual: "$1"'],
  [/^Current length: (.*)$/, 'Comprimento atual: $1'], [/^Distance = (.*),\s+Angle in XY Plane = (.*), Angle from XY Plane = 0$/, 'Distância = $1,  Ângulo no plano XY = $2, Ângulo a partir do plano XY = 0'],
  [/^Delta X = (.*), Delta Y = (.*), Delta Z = 0\.0000$/, 'Delta X = $1, Delta Y = $2, Delta Z = 0.0000'],
  [/^Area = (.*), (Perimeter|Circumference) = (.*)$/, (m, a, k, p) => `Área = ${a}, ${k === 'Perimeter' ? 'Perímetro' : 'Circunferência'} = ${p}`],
  [/^(\d+) objects? exploded\.$/, '$1 objeto(s) explodido(s).'], [/^1 object not able to be exploded\.$/, 'Não foi possível explodir 1 objeto.'], [/^1 was not able to be exploded\.$/, 'Não foi possível explodir 1 objeto.'],
  [/^Block "(.*)" defined with (\d+) objects\.$/, 'Bloco "$1" definido com $2 objetos.'], [/^Block "(.*)" saved\.$/, 'Bloco "$1" guardado.'], [/^Block "(.*)" not found\.$/, 'Bloco "$1" não encontrado.'],
  [/^(\d+) blocks? deleted\. (\d+) layers? deleted\.$/, '$1 bloco(s) eliminado(s). $2 camada(s) eliminada(s).'], [/^(\d+) objects converted to (\d+) polylines?$/, '$1 objetos convertidos em $2 polilinha(s)'],
  [/^(\d+) segments added to polyline$/, '$1 segmentos adicionados à polilinha'], [/^(\d+) lines were (filleted|chamfered)$/, (m, n, k) => `${n} linhas ${k === 'filleted' ? 'concordadas' : 'chanfradas'}`],
  [/^(\d+) duplicate\(s\) deleted$/, '$1 duplicado(s) eliminado(s)'], [/^(\d+) objects selected\.$/, '$1 objetos selecionados.'], [/^(\d+) instances of block "(.*)"\.$/, '$1 inserções do bloco "$2".'],
  [/^(.*) is now the current layer\.$/, '$1 é agora a camada atual.'], [/^(.*) successfully loaded\.$/, '$1 carregado com êxito.'], [/^(.*) loaded \(Startup Suite\)\.$/, '$1 carregado (grupo de arranque).'],
  [/^Text style "(.*)" is now current\.$/, 'O estilo de texto "$1" é agora o atual.'], [/^Linetype "(.*)" loaded\.$/, 'Tipo de linha "$1" carregado.'], [/^Linetype "(.*)" not found\.$/, 'Tipo de linha "$1" não encontrado.'],
  [/^Cannot find layer "(.*)"\.$/, 'Não é possível encontrar a camada "$1".'], [/^Cannot freeze layer "(.*)"\.\s+It is the CURRENT layer\.$/, 'Não é possível congelar a camada "$1". É a camada ATUAL.'],
  [/^Layers? (.*) ha(s|ve) been isolated\.$/, 'Camada(s) $1 isolada(s).'], [/^(\d+) object\(s\) changed to layer "(.*)" \(the current layer\)\.$/, '$1 objeto(s) mudado(s) para a camada "$2" (a camada atual).'],
  [/^(.*) parameter is not supported in this version\. Use Linear, Polar, XY, Rotation, Flip, Visibility or Lookup\.$/, 'O parâmetro $1 não está disponível. Use Linear, Polar, XY, Rotação, Inverter, Visibilidade ou Consulta.'],
  [/^Visibility states: (.*)$/, 'Estados de visibilidade: $1'], [/^Delete layer\(s\) (.*) and all objects on them\?(.*)$/, 'Eliminar a(s) camada(s) $1 e todos os seus objetos?$2'],
  [/^BOUNDARY created (\d+) polylines?$/, 'CONTORNO criou $1 polilinha(s)'], [/^Current time:\s+(.*)$/, 'Hora atual:             $1'], [/^This drawing has (\d+) objects in model space\.$/, 'Este desenho tem $1 objetos no espaço modelo.'],
  [/^(\d+) objects in (.*)$/, '$1 objetos em $2'], [/^Model space uses\s+(.*)$/, 'O espaço modelo usa  $1'], [/^Blocks: (\d+)\s+Layers: (\d+)$/, 'Blocos: $1  Camadas: $2'],
  [/^Handle seed (.*)$/, 'Semente de identificadores $1'], [/^Really want layer (.*) \(the CURRENT layer\) off\?$/, 'Desligar a camada $1 (a camada ATUAL)?'],
  [/^<(F\d+) toggled>$/, '<$1 alternado>'], [/^Rotating a copy/, 'A rodar uma cópia'],
  [/^(\d+) constraint\(s\) applied\.$/, '$1 restrição(ões) aplicada(s).'], [/^(\d+) constraint\(s\) removed\.$/, '$1 restrição(ões) eliminada(s).'],
  [/^Group "(.*)" has been created\.$/, 'Foi criado o grupo "$1".'], [/^Group (.*) already exists\.$/, 'O grupo $1 já existe.'], [/^Group (.*) exploded\.$/, 'Grupo $1 explodido.'],
  [/^Duct: (.*) mm, (.*) m³\/h, (.*)$/, 'Conduta: $1 mm, $2 m³/h, $3'],
];

// nomes de comando em português (aceites sempre, além do castelhano, do galego e do inglês)
export const CMD = {
  LINHA: 'LINE', POLILINHA: 'PLINE', CÍRCULO: 'CIRCLE', RETÂNGULO: 'RECTANG', POLÍGONO: 'POLYGON', PONTO: 'POINT', LINHAX: 'XLINE', RAIO: 'RAY', ANILHA: 'DONUT',
  NUVEMREV: 'REVCLOUD', MOVER: 'MOVE', COPIAR: 'COPY', RODAR: 'ROTATE', ESPELHAR: 'MIRROR', DESLOCAR: 'OFFSET', APARAR: 'TRIM', ESTENDER: 'EXTEND', APAGAR: 'ERASE',
  EXPLODIR: 'EXPLODE', CONCORDÂNCIA: 'FILLET', CHANFRO: 'CHAMFER', ESTICAR: 'STRETCH', QUEBRAR: 'BREAK', UNIR: 'JOIN', COMPRIMENTO: 'LENGTHEN', DESFAZER: 'UNDO',
  REFAZER: 'REDO', HACHURA: 'HATCH', BLOCO: 'BLOCK', INSERIR: 'INSERT', CAMADA: 'LAYER', '-CAMADA': '-LAYER', TIPOLINHA: 'LINETYPE', ESPESSURALINHA: 'LWEIGHT',
  OPÇÕES: 'OPTIONS', GRELHA: 'GRID', DESLOCARVISTA: 'PAN', NOVO: 'NEW', GUARDAR: 'QSAVE', GUARDARCOMO: 'SAVEAS', IMPRIMIR: 'PLOT', FECHAR: 'CLOSE', AJUDA: 'HELP',
  PURGAR: 'PURGE', MUDARNOME: 'RENAME', COTALINEAR: 'DIMLINEAR', COTAALINHADA: 'DIMALIGNED', COTARAIO: 'DIMRADIUS', COTADIÂMETRO: 'DIMDIAMETER', COTAANGULAR: 'DIMANGULAR',
  ESTILOCOTA: 'DIMSTYLE', TABELA: 'TABLE', CONDUTA: 'DUCT', TUBAGEM: 'PIPE', GRUPO: 'GROUP', DESAGRUPAR: 'UNGROUP', PUBLICAR: 'PUBLISH', NUVEM: 'CLOUD', CAMPO: 'FIELD',
  PROPRIEDADES: 'PROPERTIES', MEDIR: 'DIST', DIVIDIR: 'DIVIDE', ALINHAR: 'ALIGN', ESCALA: 'SCALE', MATRIZ: 'ARRAY', TEXTO: 'TEXT', TEXTOM: 'MTEXT', ARCO: 'ARC', ELIPSE: 'ELLIPSE',
};
export const ALIAS = {};
export const OSNAP = { FIM: 'end', MEI: 'mid', CEN: 'cen', NOD: 'nod', QUA: 'qua', INT: 'int', INS: 'ins', PER: 'per', TAN: 'tan', PRO: 'nea', NEN: 'non', NENHUM: 'non', EXT: 'ext', APA: 'app' };
