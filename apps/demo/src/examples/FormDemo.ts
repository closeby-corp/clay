import { reactive, subscribe } from '@badui/core';
import { ui } from '@badui/ui';
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

  ui.container(() => {
    ui.column(() => {
      ui.label('Form Demo').classes('text-3xl font-bold');
      ui.label('ShadCN controls with bindValue and a live summary panel.')
        .classes('text-muted-foreground');

      ui.card(() => {
        ui.input({ label: 'Name', placeholder: 'Enter your name' }).bindValue(form, 'name');
        ui.input({ label: 'Email', type: 'email', placeholder: 'you@example.com' }).bindValue(form, 'email');
        ui.input({ label: 'Age', type: 'number', value: form.age }).bindValue(form, 'age');
        ui.slider({ min: 1, max: 10, value: form.rating, label: 'Rating', showValue: true }).bindValue(form, 'rating');
        ui.slider({
          min: 0,
          max: 100,
          step: 5,
          value: form.satisfaction,
          label: 'Satisfaction %',
          showValue: true,
        }).bindValue(form, 'satisfaction');
        ui.checkbox({ label: 'Subscribe to newsletter', checked: form.subscribe }).bindValue(form, 'subscribe');
        ui.checkbox({ label: 'Enable notifications', checked: form.notifications }).bindValue(form, 'notifications');
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
        ui.textArea({ label: 'Bio', placeholder: 'Tell us about yourself', rows: 4 }).bindValue(form, 'bio');
        ui.input({ label: 'Favorite color', type: 'color', value: form.color }).bindValue(form, 'color');
      });

      const summary = ui.refreshable(() => {
        ui.card(() => {
          ui.label('Live Values').classes('font-bold');
          ui.label(`Name: ${form.name || '—'}`);
          ui.label(`Email: ${form.email || '—'}`);
          ui.label(`Age: ${form.age}`);
          ui.label(`Rating: ${form.rating}`);
          ui.label(`Satisfaction: ${form.satisfaction}%`);
          ui.label(`Subscribe: ${form.subscribe}`);
          ui.label(`Notifications: ${form.notifications}`);
          ui.label(`Terms: ${form.terms}`);
          ui.label(`Country: ${form.country}`);
          ui.label(`Plan: ${form.plan}`);
          ui.label(`Bio: ${form.bio || '—'}`);
          ui.label(`Color: ${form.color}`);
        });
      });

      for (const key of Object.keys(form)) {
        subscribe(form, key, () => summary.refresh());
      }

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
    }, { gap: 3 });
  }, { centered: true, width: 'lg' });
  });
});
