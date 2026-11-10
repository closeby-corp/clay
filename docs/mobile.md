# Mobile and installable apps

Apps built with the `app` shell work on phones without changes. You can also make an app installable to the home screen, which is opt-in.

## Phone layout

On phone-sized screens (narrow, with a touch pointer) the shell changes on its own:

- **Bottom tab bar.** Up to 4 top-level `nav` items become tabs. When there are more items, or `navSecondary`, `documents` or `user` is set, a **More** tab opens the sidebar sheet. A tab is highlighted when its page, or one of its child pages, is active.
- **Bottom sheets.** Dialogs open as bottom sheets.
- **Safe areas.** Content clears the iPhone notch and home indicator.
- **Toasts and the connection chip** sit above the tab bar.
- **16px form text.** iOS doesn't zoom when a field is focused.

`select`, `combobox`, `date` and `dropdownMenu` also use native pickers or bottom drawers on phones. See [Elements](./elements.md#on-phones).

### Keep only the menu

Set `mobileNav: 'menu'` to keep the hamburger sheet and skip the tab bar:

```typescript
ui.run({
  app: {
    title: 'My App',
    nav: ui.navFromPages(),
    mobileNav: 'menu', // default: 'tabs'
  },
});
```

`mobileNav` is also a [`ui.app()`](./api.md#uiappprops-fn) prop.

## Installable app (PWA)

Opt in with the CLI flag or the `pwa` option:

```bash
clay ./pages --app --pwa
```

```typescript
ui.run({ pwa: true }); // defaults

ui.run({
  title: 'My App',
  pwa: {
    shortName: 'App',
    description: 'Track my work',
    themeColor: '#1d4ed8',
    backgroundColor: '#ffffff',
    display: 'standalone',
    startUrl: '/',
    icon: './assets/icon-512.png',
  },
});
```

`ClayPwaConfig` is exported from `@close-by/clay-server`.

| Option | Default | Description |
|--------|---------|-------------|
| `name` | `title` | App name in the install prompt and splash screen |
| `shortName` | `name` | Label under the home-screen icon |
| `description` | | Manifest description |
| `themeColor` | Clay light/dark background | Browser and OS chrome color |
| `backgroundColor` | Clay light background | Splash screen background |
| `display` | `'standalone'` | `'standalone' \| 'fullscreen' \| 'minimal-ui' \| 'browser'` |
| `startUrl` | `'/'` | URL opened from the home screen |
| `icon` | Clay's bundled icons | Square PNG (512px+ recommended) or SVG, relative to the working directory |

It adds:

- `/manifest.webmanifest`, with name, icons, colors and display mode.
- `theme-color` and Apple meta tags, plus `viewport-fit=cover` so content can use the full screen.
- `/sw.js`, a service worker that caches the app shell (HTML, JS, CSS and icons). It uses network-first, so online users always get the latest build.

### Icons

- Without `icon`, Clay's bundled icons are used.
- `icon` must be a `.png` or `.svg` file. A missing or unsupported file throws at startup.
- iOS home-screen icons need a PNG. SVG gets no apple-touch-icon, so use a PNG if the app will be installed on iOS.

### Offline

The installed app still opens without a connection and shows Clay's reconnecting state. There is no offline mode for pages, since every screen runs on the server.

### HTTPS

Service workers require HTTPS. `localhost` is exempt, so you can test locally. Serve the app over HTTPS before asking people to install it.

### Install

- **Android and desktop Chrome:** an install prompt or menu item appears when the app is installable.
- **iOS Safari:** Share → Add to Home Screen.

### Turn it off

Remove `pwa` (or the `--pwa` flag). Clay then serves a `/sw.js` that clears the app cache and unregisters itself. Browsers that installed the app earlier clean up the next time they load it.

### Override the worker or manifest

`/sw.js` and `/manifest.webmanifest` can be replaced with `routes`, which match by exact path before pages:

```typescript
ui.run({
  pwa: true,
  routes: {
    '/sw.js': () => new Response(mySource, { headers: { 'Content-Type': 'text/javascript' } }),
  },
});
```
