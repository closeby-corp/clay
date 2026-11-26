import { ui, type MapMarkerDatum, type MapPopupBadge } from '@close-by/clay';
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

type Brand = { name: string; logo: string };

/** Small made-up logo: white initials on a coloured rounded square or circle, as an inline SVG data URI. */
function logo(initials: string, color: string, shape: 'square' | 'circle'): string {
  const bg =
    shape === 'circle'
      ? `<circle cx="32" cy="32" r="32" fill="${color}"/>`
      : `<rect width="64" height="64" rx="14" fill="${color}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${bg}<text x="32" y="41" text-anchor="middle" font-family="system-ui,sans-serif" font-size="${initials.length > 1 ? 24 : 30}" font-weight="700" fill="#fff">${initials}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const BRANDS: Brand[] = [
  { name: 'Grão', logo: logo('G', '#b45309', 'circle') },
  { name: 'Forno Azul', logo: logo('FA', '#1d4ed8', 'square') },
  { name: 'Verde Bio', logo: logo('VB', '#15803d', 'circle') },
  { name: 'Maré', logo: logo('M', '#0f766e', 'square') },
];
type Partner = { name: string; logo: string };

/** Made-up delivery-partner wordmark: a small coloured shape plus bold text, about 3.5:1, transparent background. */
function wordmark(name: string, color: string, shape: 'circle' | 'square' | 'triangle'): string {
  const mark =
    shape === 'circle'
      ? `<circle cx="13" cy="16" r="10" fill="${color}"/><circle cx="13" cy="16" r="4" fill="#fff"/>`
      : shape === 'square'
        ? `<rect x="3" y="6" width="20" height="20" rx="5" fill="${color}"/>`
        : `<path d="M3 26 L13 5 L23 26 Z" fill="${color}"/>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 112 32">${mark}<text x="30" y="24" textLength="78" lengthAdjust="spacingAndGlyphs" font-family="system-ui,sans-serif" font-size="22" font-weight="800" fill="${color}">${name}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const PARTNERS: Partner[] = [
  { name: 'Rota', logo: wordmark('rota', '#4f46e5', 'circle') },
  { name: 'Zipa', logo: wordmark('zipa', '#ea580c', 'triangle') },
  { name: 'Ciclo', logo: wordmark('ciclo', '#7c3aed', 'square') },
];
const OPEN_STORES = STORES.filter((s) => s.open);

/** Brand name, then the delivery partner's logo. Every third open store also lists a paused partner, tinted red. */
function badgesFor(s: Store, i: number): (string | MapPopupBadge)[] {
  const partner = PARTNERS[i % PARTNERS.length]!;
  const badges: (string | MapPopupBadge)[] = [
    brandOf(i).name,
    { label: partner.name, image: partner.logo, imageOnly: true },
  ];
  if (OPEN_STORES.indexOf(s) % 3 === 2) {
    const paused = PARTNERS[(i + 1) % PARTNERS.length]!;
    badges.push({ label: `${paused.name} (paused)`, image: paused.logo, imageOnly: true, tone: 'destructive' });
  }
  return badges;
}

const brandOf = (i: number) => BRANDS[i % BRANDS.length]!;

/** Marker per store: brand logo pin, ring highlighted when selected, red when closed. */
function markersFor(list: Store[], selectedId: string | null): MapMarkerDatum[] {
  return list.map((s) => {
    const i = STORES.indexOf(s);
    const brand = brandOf(i);
    const orders = s.open ? 18 + ((i * 37) % 41) : 0;
    const lastOrder = s.open ? `${2 + ((i * 7) % 25)} min ago` : 'Yesterday';
    return {
      id: s.id,
      lngLat: s.lngLat,
      image: brand.logo,
      tone: s.id === selectedId ? 'chart-2' : s.open ? 'primary' : 'destructive',
      tooltip: s.name,
      popup: {
        title: s.name,
        description: `${s.address}, ${s.city}`,
        image: brand.logo,
        status: s.open ? { label: 'Open', tone: '#16a34a' } : { label: 'Closed', tone: 'destructive' },
        badges: badgesFor(s, i),
        meta: [
          { label: 'Orders today', value: String(orders) },
          { label: 'Last order', value: lastOrder },
        ],
        actions: [
          { id: 'open', label: 'Open store', icon: 'external-link' },
          { id: 'directions', label: 'Directions', icon: 'navigation' },
        ],
        size: 'md',
      },
    };
  });
}

ui.page('/examples/store-locator', () => {
  const state = ui.state({ query: '', selectedId: null as string | null, visible: STORES });
  let map!: ReturnType<typeof ui.map>;

  const select = (id: string, fly: boolean) => {
    const store = STORES.find((s) => s.id === id);
    if (!store) return;
    state.selectedId = id;
    map.setMarkers(markersFor(state.visible, state.selectedId));
    if (fly) map.flyTo(store.lngLat, 14);
    map.openMarkerPopup(id);
  };

  const applyFilter = () => {
    const q = state.query.trim().toLowerCase();
    state.visible = STORES.filter(
      (s) => !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q),
    );
    if (state.selectedId && !state.visible.some((s) => s.id === state.selectedId)) {
      state.selectedId = null;
    }
    map.setMarkers(markersFor(state.visible, state.selectedId));
    map.fitBounds('markers', { padding: 48 });
  };

  exampleFrame(() => {
    ui.column({ fillViewport: true, gap: 4 }, () => {
      exampleHeader(undefined, 'Filter as you type. Rows and markers select each other; click the empty map to clear the selection.');

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
              state.query = String(value ?? '');
              applyFilter();
            });

            ui.auto(() => {
              if (state.visible.length === 0) {
                ui.label('No stores match your search.').classes('py-6 text-center text-sm text-muted-foreground');
                return;
              }
              ui.column(
                () => {
                  for (const s of state.visible) {
                    const selected = s.id === state.selectedId;
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
            markers: markersFor(state.visible, state.selectedId),
            onMarkerClick: (marker) => select(marker.id, false),
            // Marker and popup clicks do not also fire onMapClick, so this only runs on empty map.
            onMapClick: () => {
              if (!state.selectedId) return;
              state.selectedId = null;
              map.setMarkers(markersFor(state.visible, null));
            },
            onPopupAction: (actionId, marker) => {
              const name = STORES.find((s) => s.id === marker.id)?.name ?? marker.id;
              ui.notify(actionId === 'open' ? `Opening ${name}…` : `Directions to ${name}`);
            },
          });
        });
      });
    });
  });

  map.fitBounds('markers', { padding: 48 });
});
