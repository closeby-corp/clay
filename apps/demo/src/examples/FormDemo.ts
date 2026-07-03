import { ui, getCurrentContainer } from '@badui/ui';
import { notify, runJavascript, navigate, timer, showLoading, hideLoading } from '@badui/core';
import {
  button, label, card, row, column,
  input, slider, checkbox, select, textArea,
  radio, datePicker, colorPicker, fileUpload,
} from '@badui/components';

ui.page('/examples/form-demo', () => {
  const nameInput = input('name', {
    label: 'Name',
    placeholder: 'Enter your name',
    fullWidth: true,
    on_input: (v) => console.log('Typing:', v),
    debounce: 300,
  });

  const emailInput = input('email', {
    type: 'email',
    label: 'Email',
    placeholder: 'you@example.com',
    fullWidth: true,
  });

  const ageInput = input('age', {
    type: 'number',
    label: 'Age',
    placeholder: '25',
    value: '25',
  });

  const ratingSlider = slider('rating', {
    min: 1,
    max: 10,
    value: 5,
    label: 'Rating',
    showValue: true,
    color: 'primary',
  });

  const satisfactionSlider = slider('satisfaction', {
    min: 0,
    max: 100,
    value: 75,
    step: 5,
    label: 'Satisfaction %',
    showValue: true,
    color: 'success',
  });

  const subscribeCheckbox = checkbox('subscribe', {
    label: 'Subscribe to newsletter',
    checked: true,
    color: 'primary',
  });

  const notificationsCheckbox = checkbox('notifications', {
    label: 'Enable notifications',
    color: 'secondary',
  });

  const termsCheckbox = checkbox('terms', {
    label: 'Accept terms and conditions',
    color: 'accent',
  });

  const countrySelect = select('country', [
    { value: 'us', label: 'United States' },
    { value: 'canada', label: 'Canada' },
    { value: 'uk', label: 'United Kingdom' },
    { value: 'germany', label: 'Germany' },
    { value: 'japan', label: 'Japan' },
  ], {
    label: 'Country',
    value: 'us',
    fullWidth: true,
  });

  const planSelect = select('plan', [
    { value: 'free', label: 'Free' },
    { value: 'pro', label: 'Pro ($9/mo)' },
    { value: 'enterprise', label: 'Enterprise ($49/mo)' },
  ], {
    label: 'Plan',
    value: 'free',
    fullWidth: true,
  });

  const bioTextArea = textArea('bio', {
    label: 'Bio',
    placeholder: 'Tell us about yourself...',
    rows: 4,
    fullWidth: true,
  });

  const priorityRadio = radio('priority', {
    label: 'Priority Level',
    options: [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'urgent', label: 'Urgent' },
    ],
    value: 'medium',
    inline: true,
    color: 'primary',
  });

  const birthdayPicker = datePicker('birthday', {
    label: 'Birthday',
    value: '1990-01-15',
  });

  const appointmentPicker = datePicker('appointment', {
    type: 'datetime-local',
    label: 'Appointment',
  });

  const favoriteColor = colorPicker('favoriteColor', {
    label: 'Favorite Color',
    value: '#3b82f6',
    showHex: true,
  });

  const themeColor = colorPicker('themeColor', {
    label: 'Theme Color',
    value: '#22c55e',
    presets: ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#000000', '#ffffff'],
  });

  const avatarUpload = fileUpload('avatar', {
    label: 'Profile Picture',
    accept: 'image/*',
    maxSize: 5 * 1024 * 1024,
  });

  const documentsUpload = fileUpload('documents', {
    label: 'Upload Documents',
    accept: '.pdf,.doc,.docx',
    multiple: true,
    dropzone: true,
  });

  ui.container(() => {
    ui.column(() => {
      ui.label('Form Components Demo').classes('text-3xl font-bold');
      ui.label('Testing all ValueComponent types with reactive get/set')
        .classes('text-neutral opacity-70 mb-6');

      ui.row(() => {
        ui.column(() => {
          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Input Components').classes('font-bold text-lg mb-2'));
            cardCol.add(label('(with debouncing & on_input)').classes('text-xs text-neutral mb-2'));
            cardCol.add(nameInput);
            cardCol.add(emailInput);
            cardCol.add(ageInput);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Slider Components').classes('font-bold text-lg mb-2'));
            cardCol.add(ratingSlider);
            cardCol.add(satisfactionSlider);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Checkbox Components').classes('font-bold text-lg mb-2'));
            cardCol.add(subscribeCheckbox);
            cardCol.add(notificationsCheckbox);
            cardCol.add(termsCheckbox);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Radio Component').classes('font-bold text-lg mb-2'));
            cardCol.add(priorityRadio);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Select Components').classes('font-bold text-lg mb-2'));
            cardCol.add(countrySelect);
            cardCol.add(planSelect);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('TextArea Component').classes('font-bold text-lg mb-2'));
            cardCol.add(bioTextArea);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('DatePicker Components').classes('font-bold text-lg mb-2'));
            cardCol.add(birthdayPicker);
            cardCol.add(appointmentPicker);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('ColorPicker Components').classes('font-bold text-lg mb-2'));
            cardCol.add(favoriteColor);
            cardCol.add(themeColor);
          }, { bordered: true }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('FileUpload Components').classes('font-bold text-lg mb-2'));
            cardCol.add(avatarUpload);
            cardCol.add(documentsUpload);
          }, { bordered: true }));
        }).classes('flex-1');

        ui.column(() => {
          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Live Values').classes('font-bold text-lg mb-4'));
            cardCol.add(label('(Updates automatically when you change inputs)')
              .classes('text-sm text-neutral mb-4'));

            cardCol.add(label('--- Inputs ---').classes('font-semibold text-primary mt-2'));
            cardCol.add(row(
              label('Name:').classes('w-28 font-medium'),
              label(nameInput).classes('text-success'),
            ));
            cardCol.add(row(
              label('Email:').classes('w-28 font-medium'),
              label(emailInput).classes('text-success'),
            ));
            cardCol.add(row(
              label('Age:').classes('w-28 font-medium'),
              label(ageInput).classes('text-success'),
            ));

            cardCol.add(label('--- Sliders ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Rating:').classes('w-28 font-medium'),
              label(() => `${ratingSlider.get()}/10`).classes('text-success'),
            ));
            cardCol.add(row(
              label('Satisfaction:').classes('w-28 font-medium'),
              label(() => `${satisfactionSlider.get()}%`).classes('text-success'),
            ));

            cardCol.add(label('--- Checkboxes ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Subscribe:').classes('w-28 font-medium'),
              label(() => subscribeCheckbox.get() ? 'Yes' : 'No').classes('text-success'),
            ));
            cardCol.add(row(
              label('Notifications:').classes('w-28 font-medium'),
              label(() => notificationsCheckbox.get() ? 'Yes' : 'No').classes('text-success'),
            ));
            cardCol.add(row(
              label('Terms:').classes('w-28 font-medium'),
              label(() => termsCheckbox.get() ? 'Yes' : 'No').classes('text-success'),
            ));

            cardCol.add(label('--- Radio ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Priority:').classes('w-28 font-medium'),
              label(priorityRadio).classes('text-success'),
            ));

            cardCol.add(label('--- Selects ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Country:').classes('w-28 font-medium'),
              label(countrySelect).classes('text-success'),
            ));
            cardCol.add(row(
              label('Plan:').classes('w-28 font-medium'),
              label(planSelect).classes('text-success'),
            ));

            cardCol.add(label('--- TextArea ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Bio:').classes('w-28 font-medium'),
              label(() => bioTextArea.get() || '(empty)').classes('text-success truncate max-w-xs'),
            ));

            cardCol.add(label('--- Dates ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Birthday:').classes('w-28 font-medium'),
              label(birthdayPicker).classes('text-success'),
            ));
            cardCol.add(row(
              label('Appointment:').classes('w-28 font-medium'),
              label(() => appointmentPicker.get() || '(not set)').classes('text-success'),
            ));

            cardCol.add(label('--- Colors ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Favorite:').classes('w-28 font-medium'),
              label(() => `<span style="background:${favoriteColor.get()}" class="inline-block w-4 h-4 rounded mr-2"></span>${favoriteColor.get()}`),
            ));
            cardCol.add(row(
              label('Theme:').classes('w-28 font-medium'),
              label(() => `<span style="background:${themeColor.get()}" class="inline-block w-4 h-4 rounded mr-2"></span>${themeColor.get()}`),
            ));

            cardCol.add(label('--- Files ---').classes('font-semibold text-primary mt-4'));
            cardCol.add(row(
              label('Avatar:').classes('w-28 font-medium'),
              label(() => avatarUpload.fileNames.join(', ') || '(none)').classes('text-success'),
            ));
            cardCol.add(row(
              label('Documents:').classes('w-28 font-medium'),
              label(() => `${documentsUpload.get().length} files`).classes('text-success'),
            ));
          }, { bordered: true, bgColor: 'bg-base-200' }));

          getCurrentContainer().add(card((cardCol) => {
            cardCol.add(label('Programmatic Controls').classes('font-bold text-lg mb-4'));

            cardCol.add(row(button('Fill Sample Data', {
              color: 'primary',
              on_click: () => {
                nameInput.set('John Doe');
                emailInput.set('john@example.com');
                ageInput.set('30');
                ratingSlider.set(9);
                satisfactionSlider.set(95);
                subscribeCheckbox.set(true);
                notificationsCheckbox.set(true);
                termsCheckbox.set(true);
                countrySelect.set('canada');
                planSelect.set('pro');
                bioTextArea.set('Software developer with 10 years of experience.');
                priorityRadio.set('high');
                birthdayPicker.set('1985-06-15');
                favoriteColor.set('#8b5cf6');
                themeColor.set('#ef4444');
              },
            })));

            cardCol.add(row(button('Clear All', {
              color: 'error',
              variant: 'outline',
              on_click: () => {
                nameInput.set('');
                emailInput.set('');
                ageInput.set('');
                ratingSlider.set(1);
                satisfactionSlider.set(0);
                subscribeCheckbox.set(false);
                notificationsCheckbox.set(false);
                termsCheckbox.set(false);
                countrySelect.set('us');
                planSelect.set('free');
                bioTextArea.set('');
                priorityRadio.set('low');
                birthdayPicker.set('');
                favoriteColor.set('#3b82f6');
                themeColor.set('#22c55e');
                avatarUpload.clear();
                documentsUpload.clear();
              },
            })));

            cardCol.add(row(button('Max Ratings', {
              color: 'success',
              on_click: () => {
                ratingSlider.set(10);
                satisfactionSlider.set(100);
              },
            })));

            cardCol.add(row(button('Toggle All Checkboxes', {
              color: 'secondary',
              on_click: () => {
                subscribeCheckbox.set(!subscribeCheckbox.get());
                notificationsCheckbox.set(!notificationsCheckbox.get());
                termsCheckbox.set(!termsCheckbox.get());
              },
            })));

            cardCol.add(row(button('Random Colors', {
              color: 'accent',
              on_click: () => {
                const randomColor = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
                favoriteColor.set(randomColor());
                themeColor.set(randomColor());
              },
            })));

            cardCol.add(label('--- Server Push ---').classes('font-semibold text-primary mt-4'));

            cardCol.add(row(
              button('Show Toast (info)', {
                color: 'info',
                size: 'sm',
                on_click: () => { notify('This is an info toast!', 'info'); },
              }),
              button('Success', {
                color: 'success',
                size: 'sm',
                on_click: () => { notify('Operation completed!', 'success'); },
              }),
            ));

            cardCol.add(row(
              button('Warning', {
                color: 'warning',
                size: 'sm',
                on_click: () => { notify('Please check your input', 'warning'); },
              }),
              button('Error', {
                color: 'error',
                size: 'sm',
                on_click: () => { notify('Something went wrong!', 'error'); },
              }),
            ));

            cardCol.add(row(button('Run JS (alert)', {
              color: 'neutral',
              size: 'sm',
              on_click: () => { runJavascript('alert("Hello from server!")'); },
            })));

            cardCol.add(label('--- Advanced Features ---').classes('font-semibold text-primary mt-4'));

            cardCol.add(row(
              button('Toast Top-Left', {
                color: 'info',
                size: 'sm',
                on_click: () => { notify('Top-left toast!', 'info', { position: 'top-left', duration: 2000 }); },
              }),
              button('Toast Top-Right', {
                color: 'success',
                size: 'sm',
                on_click: () => { notify('Top-right toast!', 'success', { position: 'top-right', duration: 2000 }); },
              }),
            ));

            cardCol.add(row(
              button('Show Loading', {
                color: 'primary',
                size: 'sm',
                on_click: () => {
                  showLoading('Processing...');
                  timer(() => {
                    hideLoading();
                    notify('Done!', 'success');
                  }, 2000, { once: true });
                },
              }),
              button('Navigate Home', {
                color: 'secondary',
                size: 'sm',
                on_click: () => { navigate('/'); },
              }),
            ));
          }, { bordered: true }));
        }).classes('w-96');
      }, { gap: '6' });
    });
  }, { padding: 'lg' });
});
