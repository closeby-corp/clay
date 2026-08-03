import { reactive, subscribe } from '@badui/core';
import { ui } from '@badui/ui';
import { exampleFrame, exampleHeader } from '../chrome';
import { APP_SHELL } from '../nav';

ui.page('/examples/form-demo', () => {
  ui.app({ ...APP_SHELL }, () => {
    const form = reactive({
      name: '',
      email: '',
      age: '25',
      rating: 5,
      satisfaction: 75,
      subscribe: true,
      notifications: false,
      terms: false,
      country: 'us',
      plan: 'free',
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
          ui.select({
            label: 'Plan',
            value: form.plan,
            options: [
              { value: 'free', label: 'Free' },
              { value: 'pro', label: 'Pro' },
              { value: 'enterprise', label: 'Enterprise' },
            ],
          }).bindValue(form, 'plan');
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
                ui.notify(`Thanks, ${form.name || 'friend'}!`, 'success');
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
                form.terms = false;
                form.country = 'us';
                form.plan = 'free';
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
              `Terms: ${form.terms}`,
              `Country: ${form.country}`,
              `Plan: ${form.plan}`,
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
});
