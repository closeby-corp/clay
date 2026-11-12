import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';
import { buildSeismicHeatmap, LISBON_POIS, type RouteKey, ROUTE_OPTIONS, routesFor, LANE_GROUPS, HUB_MARKERS, CHOROPLETH_LAYER, buildClusterGroup, trafficMarkers } from './_maps-data';

export const pageMeta = { label: 'Map gallery', icon: 'map', order: 37, group: 'Maps', groupIcon: 'map' };

ui.page('/examples/maps', () => {
  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Maps are MapLibre, styled in the mapcn look. They follow the active palette and light or dark mode, so try switching palettes in Themes. Markers and routes update in place as data changes.',
      );

      /* 1. Markers & popups */
      exampleSection('Markers & popups', 'Tooltips on hover, popups on click. Two pins carry always-visible labels.');
      ui.card({ gap: 3 }, () => {
        ui.map({
          center: [-9.16, 38.72],
          zoom: 12.2,
          height: '24rem',
          controls: { zoom: true, compass: true, position: 'top-right' },
          markers: LISBON_POIS,
          onMarkerClick: (marker) => {
            ui.notify(`${marker.popup?.title ?? marker.id} opened`, 'info');
          },
        });
      });

      /* 2. Routes */
      exampleSection('Routes', 'Porto to Lisbon. Pick a route and the active line updates in place, with its progress marker.');
      ui.card({ gap: 3 }, () => {
        const state = ui.state({ active: 'fastest' as RouteKey });
        let route: ReturnType<typeof ui.map> | undefined;

        ui.auto(() => {
          const current = ROUTE_OPTIONS.find((r) => r.key === state.active)!;
          ui.column(() => {
            ui.row(() => {
              for (const option of ROUTE_OPTIONS) {
                ui.button(option.label, {
                  variant: option.key === state.active ? 'default' : 'outline',
                  size: 'sm',
                  onClick: () => {
                    state.active = option.key;
                    route?.setRoutes(routesFor(state.active));
                  },
                });
              }
            }, { gap: 2, wrap: true });
            ui.label(`${current.label}: ${current.summary}`).classes('text-sm text-muted-foreground tabular-nums');
          }, { gap: 2, className: 'px-4 pt-4' });
        });

        route = ui.map({
          center: [-8.6, 40.0],
          zoom: 6.3,
          height: '24rem',
          routes: routesFor(state.active),
        });
      });

      /* 3. Logistics network */
      exampleSection('Logistics network', 'Arcs from the Madrid hub. Click a lane for its details.');
      ui.row(() => {
        ui.column(() => {
          ui.card({ gap: 3 }, () => {
            ui.map({
              center: [4.5, 46.0],
              zoom: 3.6,
              height: '24rem',
              markers: HUB_MARKERS,
              arcs: LANE_GROUPS,
              onArcClick: (arc, group) => {
                ui.notify(`${arc.label ?? arc.id} (${group.id} lane)`, 'info');
              },
            });
          });
        }, { grow: true, minWidthZero: true });

        ui.column(() => {
          ui.grid({ cols: 2, gap: 3 }, () => {
            const stats: { label: string; value: string; hint: string }[] = [
              { label: 'Hubs', value: '4', hint: 'Madrid + 3 regional' },
              { label: 'Lanes', value: '10', hint: '4 express' },
              { label: 'On-time', value: '96.4%', hint: 'last 30 days' },
              { label: 'Volume', value: '12.8k', hint: 'parcels / week' },
            ];
            for (const stat of stats) {
              ui.card({ gap: 1 }, () => {
                ui.label(stat.label).classes('text-xs text-muted-foreground uppercase tracking-wide');
                ui.label(stat.value).classes('text-2xl font-semibold tabular-nums');
                ui.label(stat.hint).classes('text-xs text-muted-foreground');
              });
            }
          });
        }, { className: 'w-full md:w-56 md:shrink-0' });
      }, { wrap: false, gap: 4, align: 'stretch', className: 'max-md:flex-col' });

      /* 4. Choropleth */
      exampleSection('Choropleth', 'Each zone is shaded by a value field. Hover a zone to highlight it, click for its value.');
      ui.card({ gap: 3 }, () => {
        ui.map({
          center: [-9.165, 38.735],
          zoom: 11.6,
          height: '24rem',
          geojson: [CHOROPLETH_LAYER],
          interactive: true,
          onFeatureClick: (feature) => {
            const value = feature.properties.value;
            const name = feature.properties.name ?? feature.featureId;
            ui.notify(`${String(name)}: value ${String(value)}`, 'info');
          },
        });
        ui.row(() => {
          ui.label('Low').classes('text-xs text-muted-foreground');
          ui.label('').classes('inline-block size-3 rounded-sm').style({ background: 'var(--chart-3)' });
          ui.label('Mid').classes('text-xs text-muted-foreground');
          ui.label('').classes('inline-block size-3 rounded-sm').style({ background: 'var(--chart-4)' });
          ui.label('High').classes('text-xs text-muted-foreground');
          ui.label('').classes('inline-block size-3 rounded-sm').style({ background: 'var(--destructive)' });
          ui.label('0 → 100 index').classes('text-xs text-muted-foreground');
        }, { gap: 2, align: 'center', className: 'px-4 py-3' });
      });

      /* 5. Clusters */
      exampleSection('Clusters', '1,500 deliveries around six European cities. Zoom in to split the clusters.');
      ui.card({ gap: 3 }, () => {
        ui.map({
          center: [8, 47],
          zoom: 3.5,
          height: '26rem',
          clusters: [buildClusterGroup()],
          onClusterPointClick: (point) => {
            const city = String(point.properties?.city ?? 'unknown');
            ui.notify(`Delivery ${point.id} · ${city}`, 'info');
          },
        });
      });

      /* 6. Heatmap */
      exampleSection('Heatmap', 'About 2,000 synthetic quakes along the major fault lines, weighted by magnitude. The ramp follows the active palette. Zoom past 6 to see individual events.');
      ui.card({ gap: 3 }, () => {
        const quakes = buildSeismicHeatmap();
        let globe = true;
        const heat = ui.map({
          center: [80, 25],
          zoom: 1.4,
          height: '28rem',
          projection: 'globe',
          heatmaps: [quakes],
        });
        let strong = false;
        ui.row(() => {
          const projBtn = ui.button('Flat map', {
            variant: 'outline',
            size: 'sm',
            onClick: () => {
              globe = !globe;
              heat.setProjection(globe ? 'globe' : 'mercator');
              projBtn.setText(globe ? 'Flat map' : 'Globe');
            },
          });
          const filterBtn = ui.button('Only M5+', {
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              strong = !strong;
              heat.setHeatmaps([
                strong ? { ...quakes, points: quakes.points.filter((p) => (p.weight ?? 0) >= 5) } : quakes,
              ]);
              filterBtn.setText(strong ? 'All quakes' : 'Only M5+');
            },
          });
        }, { gap: 2, className: 'px-4 pb-3' });
      });

      /* 7. Analytics card */
      exampleSection('Analytics card', 'A headline metric with a compact, non-interactive world map of traffic.');
      ui.card({ title: 'Global traffic', description: 'Requests per hour, last 24 h', gap: 4 }, () => {
        ui.row(() => {
          ui.label('1.28M').classes('text-4xl font-semibold tracking-tight tabular-nums');
          ui.badge('+12.4%', { color: 'green' });
        }, { gap: 3, align: 'center' });
        ui.map({
          center: [10, 20],
          zoom: 0.8,
          height: '14rem',
          interactive: false,
          controls: false,
          markers: trafficMarkers(),
        });
      });
    }, { gap: 6 });
  });
});
