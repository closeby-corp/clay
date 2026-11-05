import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Store locator',
  icon: 'store',
  order: 39,
  group: 'Maps',
  groupIcon: 'map',
};

type LngLat = [number, number];

type Store = {
  id: string;
  name: string;
  address: string;
  city: string;
  lngLat: LngLat;
  open: boolean;
};

const STORES: Store[] = [
  { id: 'chiado', name: 'Chiado Market', address: 'Rua Garrett 44', city: 'Lisboa', lngLat: [-9.142, 38.7108], open: true },
  { id: 'baixa', name: 'Baixa Pombalina', address: 'Rua da Prata 120', city: 'Lisboa', lngLat: [-9.1393, 38.7097], open: true },
  { id: 'belem', name: 'Belém Riverside', address: 'Av. de Brasília 15', city: 'Lisboa', lngLat: [-9.203, 38.6916], open: false },
  { id: 'nacoes', name: 'Parque das Nações', address: 'Av. D. João II 8', city: 'Lisboa', lngLat: [-9.0945, 38.7676], open: true },
  { id: 'ourique', name: 'Campo de Ourique', address: 'Rua Ferreira Borges 12', city: 'Lisboa', lngLat: [-9.164, 38.7184], open: true },
  { id: 'ribeira', name: 'Ribeira Quay', address: 'Cais da Ribeira 3', city: 'Porto', lngLat: [-8.6121, 41.1408], open: true },
  { id: 'boavista', name: 'Boavista', address: 'Av. da Boavista 1100', city: 'Porto', lngLat: [-8.6601, 41.1579], open: false },
  { id: 'coimbra', name: 'Coimbra Baixa', address: 'Rua Visconde da Luz 30', city: 'Coimbra', lngLat: [-8.4291, 40.2056], open: true },
  { id: 'braga', name: 'Braga Sé', address: 'Rua do Souto 18', city: 'Braga', lngLat: [-8.4269, 41.5503], open: true },
  { id: 'faro', name: 'Faro Marina', address: 'Av. da Liberdade 3', city: 'Faro', lngLat: [-7.932, 37.0167], open: true },
  { id: 'madrid', name: 'Chamberí', address: 'Calle de Fuencarral 60', city: 'Madrid', lngLat: [-3.7038, 40.427], open: true },
  { id: 'barcelona', name: 'Eixample', address: 'Carrer de Balmes 210', city: 'Barcelona', lngLat: [2.164, 41.3917], open: true },
  { id: 'valencia', name: 'Ruzafa', address: 'Carrer de Sueca 25', city: 'Valencia', lngLat: [-0.3763, 39.4623], open: false },
  { id: 'sevilla', name: 'Triana', address: 'Calle Betis 12', city: 'Sevilla', lngLat: [-6.0022, 37.3857], open: true },
];

/** Marker per store: highlighted when selected, muted when closed. */
function markersFor(list: Store[], selectedId: string | null) {
  return list.map((s) => ({
    id: s.id,
    lngLat: s.lngLat,
    tone: s.id === selectedId ? 'chart-2' : s.open ? 'primary' : 'muted',
    icon: 'store',
    tooltip: s.name,
  }));
}

ui.page('/examples/store-locator', () => {
  let query = '';
  let selectedId: string | null = null;
  let visible: Store[] = STORES;
  let listUi!: ReturnType<typeof ui.refreshable>;
  let map!: ReturnType<typeof ui.map>;

  const select = (id: string, fly: boolean) => {
    const store = STORES.find((s) => s.id === id);
    if (!store) return;
    selectedId = id;
    map.setMarkers(markersFor(visible, selectedId));
    if (fly) map.flyTo(store.lngLat, 14);
    map.showPopup(store.lngLat, { title: store.name, description: `${store.address}, ${store.city}` });
    listUi.refresh();
  };

  const applyFilter = () => {
    const q = query.trim().toLowerCase();
    visible = STORES.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q),
    );
    if (selectedId && !visible.some((s) => s.id === selectedId)) {
      selectedId = null;
      map.closePopup();
    }
    map.setMarkers(markersFor(visible, selectedId));
    map.fitBounds('markers', { padding: 48 });
    listUi.refresh();
  };

  exampleFrame(() => {
    ui.column({ fillViewport: true, gap: 4 }, () => {
      exampleHeader(undefined, 'Filter as you type. Rows and markers select each other; the list re-renders in place by key.');

      ui.row({ grow: true, wrap: false, gap: 4, className: 'max-md:flex-col' }, () => {
        ui.card(
          {
            title: 'Stores',
            description: `${STORES.length} locations in Portugal and Spain`,
            scroll: true,
            gap: 3,
            className: 'md:w-80 md:shrink-0',
          },
          () => {
            const search = ui.input({ placeholder: 'Search by name or city' });
            search.on('input', (value) => {
              query = String(value ?? '');
              applyFilter();
            });

            listUi = ui.refreshable(() => {
              if (visible.length === 0) {
                ui.label('No stores match your search.').classes('py-6 text-center text-sm text-muted-foreground');
                return;
              }
              ui.column(
                () => {
                  for (const s of visible) {
                    const selected = s.id === selectedId;
                    ui.column(
                      () => {
                        ui.button(s.name, {
                          variant: selected ? 'secondary' : 'ghost',
                          className: 'h-auto w-full justify-start whitespace-normal py-2 text-left',
                          onClick: () => select(s.id, true),
                        });
                        ui.row(
                          () => {
                            ui.label(`${s.address}, ${s.city}`).classes('truncate text-xs text-muted-foreground');
                            ui.row(
                              () => {
                                ui.badge(s.open ? 'Open' : 'Closed', {
                                  size: 'xs',
                                  color: s.open ? 'green' : 'red',
                                });
                                ui.label('— km').classes('text-xs text-muted-foreground tabular-nums');
                              },
                              { gap: 2, wrap: false, align: 'center' },
                            );
                          },
                          { gap: 2, wrap: false, justify: 'between', align: 'center', minWidthZero: true, className: 'px-3 pb-2' },
                        );
                      },
                      { gap: 0 },
                    )
                      .key(s.id)
                      .classes(selected ? 'rounded-md border border-primary bg-accent' : 'rounded-md border border-transparent');
                  }
                },
                { gap: 2 },
              );
            });
          },
        );

        ui.column({ grow: true, gap: 2 }, () => {
          map = ui.map({
            fill: true,
            center: [-6, 40],
            zoom: 5,
            controls: { zoom: true, compass: false, position: 'top-right' },
            markers: markersFor(visible, selectedId),
            onMarkerClick: (marker) => select(marker.id, false),
          });
        });
      });
    });
  });

  map.fitBounds('markers', { padding: 48 });
});
