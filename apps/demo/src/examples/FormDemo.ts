import { reactive, subscribe } from '@badui/core';
import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';

export const pageMeta = {
  label: 'Form Demo',
  icon: 'form-input',
  order: 80,
};

ui.page('/examples/form-demo', () => {
    const form = reactive({
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
      color: '#3b82f6',
    });

    exampleFrame(() => {
      ui.column(() => {
        exampleHeader(undefined, 'ShadCN controls with bindValue and a live summary.');

      ui.card(
        {
          title: 'Profile',
          description: 'All fields sync optimistically to the server session.',
          gap: 4,
        },
        () => {
          ui.input({ label: 'Name', placeholder: 'Enter your name' }).bindValue(form, 'name');
          ui.input({ label: 'Email', type: 'email', placeholder: 'you@example.com' }).bindValue(
            form,
            'email',
          );
          ui.input({ label: 'Age', type: 'number', value: form.age }).bindValue(form, 'age');
          ui.slider({
            min: 1,
            max: 10,
            value: form.rating,
            label: 'Rating',
            showValue: true,
          }).bindValue(form, 'rating');
          ui.slider({
            min: 0,
            max: 100,
            step: 5,
            value: form.satisfaction,
            label: 'Satisfaction %',
            showValue: true,
          }).bindValue(form, 'satisfaction');
          ui.checkbox({ label: 'Subscribe to newsletter', checked: form.subscribe }).bindValue(
            form,
            'subscribe',
          );
          ui.checkbox({ label: 'Enable notifications', checked: form.notifications }).bindValue(
            form,
            'notifications',
          );
          ui.checkbox({ label: 'Accept terms', checked: form.terms }).bindValue(form, 'terms');

          ui.separator();

          ui.switch({ label: 'Dark mode preference', checked: form.darkMode }).bindValue(
            form,
            'darkMode',
          );
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
          ui.input({ label: 'Favorite color', type: 'color', value: form.color }).bindValue(
            form,
            'color',
          );

          ui.row(() => {
            ui.button('Submit', {
              onClick: () => {
                if (!form.terms) {
                  ui.notify('Please accept the terms', 'warning');
                  return;
                }
                ui.notify(`Thanks, ${form.name || 'friend'}!`, {
                  type: 'success',
                  description: 'Your response was recorded.',
                });
              },
            });
            ui.button('Reset', {
              variant: 'outline',
              onClick: () => {
                form.name = '';
                form.email = '';
                form.age = '25';
                form.rating = 5;
                form.satisfaction = 75;
                form.subscribe = true;
                form.notifications = false;
                form.darkMode = false;
                form.terms = false;
                form.country = 'us';
                form.timezone = 'utc';
                form.plan = 'free';
                form.dueDate = '';
                form.bio = '';
                form.color = '#3b82f6';
              },
            });
          }, { gap: 2 });
        },
      );

      const summary = ui.refreshable(() => {
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
              `Color: ${form.color}`,
            ];
            for (const line of lines) {
              ui.label(line).classes('text-sm text-muted-foreground');
            }
          },
        );
      });

      for (const key of Object.keys(form)) {
        subscribe(form, key, () => summary.refresh());
      }
      }, { gap: 6 });
    });
});
