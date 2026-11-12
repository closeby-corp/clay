import { ui } from '@close-by/clay';
import { exampleFrame, exampleHeader, exampleSection } from '../chrome';

export const pageMeta = {
  label: 'Forms',
  icon: 'form-input',
  order: 40,
  group: 'Forms & controls',
  groupIcon: 'sliders-horizontal',
};

const DRAFT_KEY = 'formDemo';

const defaults = {
  name: '',
  email: '',
  age: '25',
  rating: 5,
  satisfaction: 75,
  subscribe: true,
  notifications: false,
  darkMode: false,
  terms: false,
  country: 'us',
  timezone: 'utc',
  plan: 'free',
  dueDate: '',
  bio: '',
  tags: [] as string[],
  color: '#3b82f6',
};

function resetForm(form: typeof defaults): void {
  Object.assign(form, defaults);
}

ui.page('/examples/forms', () => {
  const form = ui.draft(DRAFT_KEY, defaults);

  const qty = ui.state({ value: 4 });
  const phone = ui.state({ country: 'US', value: '5550100', e164: '15555550100' });
  const plan = ui.state({ tier: 'pro' });
  const filters = ui.state({ status: 'open', query: 'release' });
  const search = ui.state({ value: 'clay', pinned: false });
  const perms = ui.state({ value: ['read', 'write'] as string[] });
  const range = ui.state({ from: '', to: '' });
  const wizard = ui.state({ step: 0 });
  const state = ui.state({
    volume: 50,
    brightness: 75,
    muted: false,
    theme: 'light',
  });

  exampleFrame(() => {
    ui.column(() => {
      exampleHeader(
        undefined,
        'Fill out a profile, explore input controls, and plan a report with a guided wizard.',
      );

      ui.card(
        {
          title: 'Profile',
          description:
            'Name, email, and terms are validated on Submit. Reset (and a successful submit) clear field errors and the saved draft.',
          gap: 4,
        },
        () => {
          const nameInput = ui
            .input({ label: 'Name', placeholder: 'Enter your name' })
            .bindValue(form, 'name');
          const emailInput = ui
            .input({ label: 'Email', type: 'email', placeholder: 'you@example.com' })
            .bindValue(form, 'email');
          ui.input({ label: 'Age', type: 'number', value: form.age }).bindValue(form, 'age');
          ui.rating({
            max: 10,
            value: form.rating,
            label: 'Rating',
          }).bindValue(form, 'rating');
          ui.slider({
            min: 0,
            max: 100,
            step: 5,
            value: form.satisfaction,
            label: 'Satisfaction %',
            showValue: true,
          }).bindValue(form, 'satisfaction');
          ui.tags({
            label: 'Interests',
            value: form.tags,
            placeholder: 'Add interest…',
            options: [
              { value: 'design', label: 'Design' },
              { value: 'engineering', label: 'Engineering' },
              { value: 'product', label: 'Product' },
              { value: 'ops', label: 'Ops' },
            ],
            creatable: true,
          }).bindValue(form, 'tags');
          ui.checkbox({ label: 'Subscribe to newsletter', checked: form.subscribe }).bindValue(
            form,
            'subscribe',
          );
          ui.checkbox({ label: 'Enable notifications', checked: form.notifications }).bindValue(
            form,
            'notifications',
          );
          const termsBox = ui
            .checkbox({ label: 'Accept terms', checked: form.terms })
            .bindValue(form, 'terms');

          ui.separator();

          ui.switch({ label: 'Dark mode preference', checked: form.darkMode }).bindValue(
            form,
            'darkMode',
          );

          exampleSection('One-time code · ui.inputOtp', 'Enter the six-digit code to confirm your identity.');
          ui.inputOtp({
            length: 6,
            onComplete: (code) => ui.notify(`OTP complete: ${code}`, 'success'),
          });
          ui.label('Range').classes('text-sm font-medium');
          ui.toggleGroup({ type: 'single', value: 'day' }, (g) => {
            g.item('day', 'Day');
            g.item('week', 'Week');
            g.item('month', 'Month');
          });

          ui.select({
            label: 'Country',
            value: form.country,
            options: [
              { value: 'us', label: 'United States' },
              { value: 'canada', label: 'Canada' },
              { value: 'uk', label: 'United Kingdom' },
              { value: 'germany', label: 'Germany' },
              { value: 'japan', label: 'Japan' },
            ],
          }).bindValue(form, 'country');
          ui.combobox({
            label: 'Timezone',
            placeholder: 'Search timezones…',
            value: form.timezone,
            options: [
              { value: 'utc', label: 'UTC' },
              { value: 'america-new-york', label: 'America/New_York' },
              { value: 'america-los-angeles', label: 'America/Los_Angeles' },
              { value: 'europe-london', label: 'Europe/London' },
              { value: 'europe-berlin', label: 'Europe/Berlin' },
              { value: 'asia-tokyo', label: 'Asia/Tokyo' },
              { value: 'australia-sydney', label: 'Australia/Sydney' },
            ],
          }).bindValue(form, 'timezone');
          ui.radioGroup({
            label: 'Plan',
            value: form.plan,
            orientation: 'horizontal',
            options: [
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ],
          }).bindValue(form, 'plan');
          ui.date({ label: 'Due date', value: form.dueDate }).bindValue(form, 'dueDate');
          ui.textArea({ label: 'Bio', placeholder: 'Tell us about yourself', rows: 4 }).bindValue(
            form,
            'bio',
          );
          ui.colorPicker({ label: 'Favorite color', value: form.color }).bindValue(form, 'color');

          const clearFieldErrors = () => {
            nameInput.setError(null);
            emailInput.setError(null);
            termsBox.setError(null);
          };

          ui.row(() => {
            ui.button('Submit', {
              onClick: () => {
                const ok = ui.validate([
                  {
                    el: nameInput,
                    check: () => (form.name.trim() ? null : 'Name is required'),
                  },
                  {
                    el: emailInput,
                    check: () => (/@/.test(form.email) ? null : 'Enter a valid email'),
                  },
                  {
                    el: termsBox,
                    check: () => (form.terms ? null : 'Accept the terms'),
                  },
                ]);
                if (!ok) {
                  ui.notify('Fix the highlighted fields', 'warning');
                  return;
                }
                clearFieldErrors();
                const name = form.name.trim();
                resetForm(form);
                ui.draft.clear(DRAFT_KEY);
                ui.notify(`Thanks, ${name}!`, {
                  type: 'success',
                  description: 'Your response was recorded.',
                });
              },
            });
            ui.button('Force email error', {
              variant: 'outline',
              onClick: () => {
                emailInput.setError('Manual .setError example — clear via Reset or a valid Submit');
                ui.notify('Called emailInput.setError(…)', 'info');
              },
            });
            ui.button('Reset', {
              variant: 'outline',
              onClick: () => {
                resetForm(form);
                ui.draft.clear(DRAFT_KEY);
                clearFieldErrors();
              },
            });
          }, { gap: 2 });
        },
      );

      ui.auto(() => {
        ui.card(
          {
            title: 'Live values',
            description: 'Refreshes when any field changes.',
            gap: 2,
          },
          () => {
            const lines = [
              `Name: ${form.name || '—'}`,
              `Email: ${form.email || '—'}`,
              `Age: ${form.age}`,
              `Rating: ${form.rating}`,
              `Satisfaction: ${form.satisfaction}%`,
              `Subscribe: ${form.subscribe}`,
              `Notifications: ${form.notifications}`,
              `Dark mode: ${form.darkMode}`,
              `Terms: ${form.terms}`,
              `Country: ${form.country}`,
              `Timezone: ${form.timezone}`,
              `Plan: ${form.plan}`,
              `Due date: ${form.dueDate || '—'}`,
              `Bio: ${form.bio || '—'}`,
              `Tags: ${form.tags.length ? form.tags.join(', ') : '—'}`,
              `Color: ${form.color}`,
            ];
            for (const line of lines) {
              ui.label(line).classes('text-sm text-muted-foreground');
            }
          },
        );
      });


      exampleSection('Field + inputs', 'Choose seats, enter a phone number, and select a plan.');
      ui.auto(() => {
        ui.field(
          {
            label: 'Seats',
            description: 'Per workspace license',
            error: qty.value < 1 ? 'At least one seat' : '',
          },
          () => {
            ui.numberField({
              value: qty.value,
              min: 1,
              max: 99,
              step: 1,
              onChange: (v) => {
                qty.value = v;
              },
            });
          },
        );

        ui.field({ label: 'Phone', description: 'Country dial + local digits' }, () => {
          ui.phoneInput({
            country: phone.country,
            value: phone.value,
            onChange: ({ country, value, e164 }) => {
              phone.country = country;
              phone.value = value;
              phone.e164 = e164;
            },
          });
          ui.label(() => `E.164: ${phone.e164}`).classes('text-xs text-muted-foreground');
        });

        ui.field({ label: 'Plan' }, () => {
          ui.nativeSelect({
            options: [
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'team', label: 'Team' },
            ],
            value: plan.tier,
            onChange: (v) => {
              plan.tier = v;
            },
          });
        });
      });

      exampleSection('Input group', 'Enter a site name and open its address.');
      ui.auto(() => {
        ui.inputGroup({
          label: 'Site URL',
          prefix: 'https://',
          suffix: '.dev',
          value: search.value,
          placeholder: 'app',
          buttonLabel: 'Go',
          onInput: (v) => {
            search.value = v;
          },
          onButtonClick: () => ui.notify(`Open https://${search.value}.dev`, 'info'),
        });
      });

      exampleSection(
        'Filter bar',
        'Search by status or text, then remove filters individually or clear them all.',
      );
      ui.auto(() => {
        ui.filterBar(
          {
            chips: [
              ...(filters.status
                ? [{ id: 'status', label: 'Status', value: filters.status }]
                : []),
              ...(filters.query.trim()
                ? [{ id: 'query', label: 'Search', value: filters.query.trim() }]
                : []),
            ],
            onRemoveChip: (id) => {
              if (id === 'status') filters.status = '';
              if (id === 'query') filters.query = '';
            },
            onClear: () => {
              filters.status = '';
              filters.query = '';
            },
          },
          () => {
            ui.nativeSelect({
              options: [
                { value: '', label: 'Any status' },
                { value: 'open', label: 'Open' },
                { value: 'done', label: 'Done' },
              ],
              value: filters.status,
              onChange: (v) => {
                filters.status = v;
              },
            });
            ui.input({
              placeholder: 'Search…',
              value: filters.query,
              onInput: (v) => {
                filters.query = v;
              },
            });
          },
        );
      });

      exampleSection('Toggle', 'Pin or unpin a panel.');
      ui.auto(() => {
        ui.row({ gap: 2 }, () => {
          ui.toggle({
            icon: 'pin',
            text: 'Pin panel',
            pressed: search.pinned,
            variant: 'outline',
            onPressedChange: (p) => {
              search.pinned = p;
            },
          });
          ui.label(() => (search.pinned ? 'Pinned' : 'Unpinned')).classes('text-sm text-muted-foreground');
        });
      });

      exampleSection('Checkbox group', 'Select the permissions to grant.');
      ui.auto(() => {
        ui.checkboxGroup({
          label: 'Permissions',
          orientation: 'horizontal',
          value: perms.value,
          options: [
            { value: 'read', label: 'Read' },
            { value: 'write', label: 'Write' },
            { value: 'admin', label: 'Admin' },
          ],
          onChange: (next) => {
            perms.value = next;
          },
        });
        ui.label(() => `Selected: ${perms.value.join(', ') || 'none'}`).classes(
          'text-sm text-muted-foreground',
        );
      });

      exampleSection('Linked controls', 'Adjust audio and display preferences together.');
      ui.card(
        {
          title: 'Controls',
          description: 'Sliders, checkbox, and select bound to the same reactive object.',
          gap: 4,
        },
        () => {
          ui.slider({
            min: 0,
            max: 100,
            value: state.volume,
            label: 'Volume',
            showValue: true,
          }).bindValue(state, 'volume');

          ui.slider({
            min: 0,
            max: 100,
            value: state.brightness,
            label: 'Brightness',
            showValue: true,
          }).bindValue(state, 'brightness');

          ui.checkbox({ label: 'Mute audio', checked: state.muted }).bindValue(state, 'muted');

          ui.select({
            label: 'Theme',
            value: state.theme,
            options: [
              { value: 'light', label: 'Light' },
              { value: 'dark', label: 'Dark' },
              { value: 'system', label: 'System' },
            ],
          }).bindValue(state, 'theme');
        },
      );

      ui.auto(() => {
        ui.card(
          {
            title: 'Current values',
            description: 'Updates when any bound field changes.',
            gap: 2,
          },
          () => {
            ui.label(`Volume: ${state.volume}`).classes('text-sm');
            ui.label(`Brightness: ${state.brightness}`).classes('text-sm');
            ui.label(`Muted: ${state.muted ? 'Yes' : 'No'}`).classes('text-sm');
            ui.label(`Theme: ${state.theme}`).classes('text-sm');
          },
        );
      });


      ui.row(() => {
        ui.button('Max volume', {
          variant: 'outline',
          size: 'sm',
          onClick: () => {
            state.volume = 100;
          },
        });
        ui.button('Mute', {
          variant: 'secondary',
          size: 'sm',
          onClick: () => {
            state.muted = true;
            state.volume = 0;
          },
        });
      }, { gap: 2 });

      exampleSection('Date range', 'Choose a date window with presets or the calendar.');
      ui.auto(() => {
        ui.dateRange({
          label: 'Filter window',
          from: range.from,
          to: range.to,
          onChange: ({ from, to }) => {
            range.from = from;
            range.to = to;
          },
        });
        ui.label(() =>
          range.from && range.to
            ? `Selected: ${range.from} – ${range.to}`
            : 'No range selected',
        ).classes('text-sm text-muted-foreground');
      });

      exampleSection('Stepper', 'Choose a report window, review it, and finish.');
      ui.auto(() => {
        ui.stepper(
          {
            index: wizard.step,
            onIndexChange: (i) => {
              wizard.step = i;
            },
          },
          (s) => {
            s.step({ title: 'Plan', description: 'Pick a range' }, () => {
              ui.dateRange({
                label: 'Report window',
                from: range.from,
                to: range.to,
                onChange: ({ from, to }) => {
                  range.from = from;
                  range.to = to;
                },
              });
            });
            s.step({ title: 'Review', description: 'Confirm filters' }, () => {
              ui.label(() =>
                range.from && range.to
                  ? `Range: ${range.from} → ${range.to}`
                  : 'Pick a date range on the previous step.',
              ).classes('text-sm');
            });
            s.step({ title: 'Done' }, () => {
              ui.button('Finish', {
                onClick: () => {
                  ui.notify('Stepper complete', 'success');
                  wizard.step = 0;
                },
              });
            });
          },
        );
      });
    }, { gap: 6 });
  });
});
