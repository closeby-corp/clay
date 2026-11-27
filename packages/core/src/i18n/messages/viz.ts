import type { MessageDict } from '../translate';

export const en = {
  // Charts
  'chart.last3Months': 'Last 3 months',
  'chart.last30Days': 'Last 30 days',
  'chart.last7Days': 'Last 7 days',
  'chart.totalForPeriod': 'Total for the {period}',
  'chart.selectPeriod': 'Select a period',
  'chart.period': 'Period',
  'chart.points': 'Points',

  // Map controls (Clay buttons + MapLibre built-in UI strings)
  'map.zoomIn': 'Zoom in',
  'map.zoomOut': 'Zoom out',
  'map.findMyLocation': 'Find my location',
  'map.toggleFullscreen': 'Toggle fullscreen',
  'map.resetBearing': 'Reset bearing to north',
  'map.closePopup': 'Close popup',
  'map.toggleAttribution': 'Toggle attribution',
  'map.feedback': 'Map feedback',
  'map.title': 'Map',
  'map.marker': 'Map marker',
  'map.cooperativeWindows': 'Use Ctrl + scroll to zoom the map',
  'map.cooperativeMac': 'Use ⌘ + scroll to zoom the map',
  'map.cooperativeMobile': 'Use two fingers to move the map',

  // Gantt
  'gantt.swipeHint': 'Swipe horizontally to explore the timeline →',
  'gantt.timelineLabel': 'Gantt timeline — scroll horizontally to see all dates',
  'gantt.rows': 'Rows',
  'gantt.addMarkerHint': 'Double-click to add a marker at this date',
  'gantt.today': 'Today',
  'gantt.todayTitle': 'Today {date}',
  'gantt.defaultMarkerLabel': 'Marker',

  // Kanban
  'kanban.swipeHint': 'Swipe horizontally to see all columns →',
  'kanban.boardLabel': 'Kanban board — scroll horizontally to see all columns',
  'kanban.unassigned': 'Unassigned',
  'kanban.card': 'Card',
  'kanban.cardDetails': 'Card details',
  'kanban.noDescription': 'No description.',
  'kanban.columnLabel': 'Column:',
  'kanban.laneLabel': 'Lane:',
  'kanban.done': 'Done',
  'kanban.dragInstructions':
    'To pick up a card, press the space bar. While dragging, use the arrow keys to move the card. Press space again to drop the card in its new position, or press escape to cancel.',
  'kanban.dragStart': 'Picked up card {card}.',
  'kanban.dragOver': 'Card {card} was moved over {target}.',
  'kanban.dragOutside': 'Card {card} is no longer over a drop area.',
  'kanban.dropOver': 'Card {card} was dropped over {target}.',
  'kanban.drop': 'Card {card} was dropped.',
  'kanban.dragCancel': 'Dragging was cancelled. Card {card} was dropped.',

  // Flow (React Flow aria labels)
  'flow.controls': 'Control Panel',
  'flow.zoomIn': 'Zoom In',
  'flow.zoomOut': 'Zoom Out',
  'flow.fitView': 'Fit View',
  'flow.toggleInteractivity': 'Toggle Interactivity',
  'flow.miniMap': 'Mini Map',
  'flow.handle': 'Handle',
  'flow.nodeDescription': 'Press enter or space to select a node. Press delete to remove it and escape to cancel.',
  'flow.nodeDescriptionKeyboard':
    'Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.',
  'flow.edgeDescription':
    'Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.',
  'flow.nodeMoved': 'Moved selected node {direction}. New position, x: {x}, y: {y}',
  'flow.directionUp': 'up',
  'flow.directionDown': 'down',
  'flow.directionLeft': 'left',
  'flow.directionRight': 'right',

  // Event calendar
  'eventCalendar.selectDay': 'Select a day',
  'eventCalendar.noEvents': 'No events this day.',
} satisfies MessageDict;

export const ptPT: Record<keyof typeof en, string> = {
  'chart.last3Months': 'Últimos 3 meses',
  'chart.last30Days': 'Últimos 30 dias',
  'chart.last7Days': 'Últimos 7 dias',
  'chart.totalForPeriod': 'Total dos {period}',
  'chart.selectPeriod': 'Selecione um período',
  'chart.period': 'Período',
  'chart.points': 'Pontos',

  'map.zoomIn': 'Ampliar',
  'map.zoomOut': 'Reduzir',
  'map.findMyLocation': 'Encontrar a minha localização',
  'map.toggleFullscreen': 'Alternar ecrã inteiro',
  'map.resetBearing': 'Repor orientação para norte',
  'map.closePopup': 'Fechar pop-up',
  'map.toggleAttribution': 'Alternar atribuição',
  'map.feedback': 'Comentários sobre o mapa',
  'map.title': 'Mapa',
  'map.marker': 'Marcador do mapa',
  'map.cooperativeWindows': 'Utilize Ctrl + deslocamento para ampliar o mapa',
  'map.cooperativeMac': 'Utilize ⌘ + deslocamento para ampliar o mapa',
  'map.cooperativeMobile': 'Utilize dois dedos para mover o mapa',

  'gantt.swipeHint': 'Deslize na horizontal para explorar a cronologia →',
  'gantt.timelineLabel': 'Cronograma Gantt — desloque na horizontal para ver todas as datas',
  'gantt.rows': 'Linhas',
  'gantt.addMarkerHint': 'Faça duplo clique para adicionar um marcador nesta data',
  'gantt.today': 'Hoje',
  'gantt.todayTitle': 'Hoje {date}',
  'gantt.defaultMarkerLabel': 'Marcador',

  'kanban.swipeHint': 'Deslize na horizontal para ver todas as colunas →',
  'kanban.boardLabel': 'Quadro Kanban — desloque na horizontal para ver todas as colunas',
  'kanban.unassigned': 'Sem atribuição',
  'kanban.card': 'Cartão',
  'kanban.cardDetails': 'Detalhes do cartão',
  'kanban.noDescription': 'Sem descrição.',
  'kanban.columnLabel': 'Coluna:',
  'kanban.laneLabel': 'Faixa:',
  'kanban.done': 'Concluído',
  'kanban.dragInstructions':
    'Para pegar num cartão, prima a barra de espaços. Durante o arrasto, utilize as teclas de seta para mover o cartão. Prima espaço novamente para largar o cartão na nova posição, ou prima Escape para cancelar.',
  'kanban.dragStart': 'Pegou no cartão {card}.',
  'kanban.dragOver': 'O cartão {card} foi movido para {target}.',
  'kanban.dragOutside': 'O cartão {card} já não está sobre uma área de destino.',
  'kanban.dropOver': 'O cartão {card} foi largado em {target}.',
  'kanban.drop': 'O cartão {card} foi largado.',
  'kanban.dragCancel': 'O arrasto foi cancelado. O cartão {card} foi largado.',

  'flow.controls': 'Painel de controlo',
  'flow.zoomIn': 'Ampliar',
  'flow.zoomOut': 'Reduzir',
  'flow.fitView': 'Ajustar à vista',
  'flow.toggleInteractivity': 'Alternar interatividade',
  'flow.miniMap': 'Minimapa',
  'flow.handle': 'Ponto de ligação',
  'flow.nodeDescription': 'Prima Enter ou espaço para selecionar um nó. Prima Delete para o remover e Escape para cancelar.',
  'flow.nodeDescriptionKeyboard':
    'Prima Enter ou espaço para selecionar um nó. Depois, pode utilizar as teclas de seta para mover o nó. Prima Delete para o remover e Escape para cancelar.',
  'flow.edgeDescription':
    'Prima Enter ou espaço para selecionar uma ligação. Depois, pode premir Delete para a remover ou Escape para cancelar.',
  'flow.nodeMoved': 'Nó selecionado movido para {direction}. Nova posição, x: {x}, y: {y}',
  'flow.directionUp': 'cima',
  'flow.directionDown': 'baixo',
  'flow.directionLeft': 'a esquerda',
  'flow.directionRight': 'a direita',

  'eventCalendar.selectDay': 'Selecione um dia',
  'eventCalendar.noEvents': 'Sem eventos neste dia.',
};
