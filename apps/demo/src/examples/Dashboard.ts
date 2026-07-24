import { ui } from '@badui/ui';
import { APP_SHELL } from '../nav';

type Order = {
  id: number;
  customer: string;
  product: string;
  amount: number;
  status: string;
  region: string;
};

ui.page('/examples/dashboard', () => {
  ui.app({ ...APP_SHELL }, () => {
  let users = 1234;
  let revenue = 12345.67;
  let orders = 89;
  let conversion = 3.45;

  const recentOrders: Order[] = [
    { id: 1, customer: 'John Doe', product: 'Widget A', amount: 29.99, status: 'completed', region: 'US' },
    { id: 2, customer: 'Jane Smith', product: 'Widget B', amount: 49.99, status: 'pending', region: 'EU' },
    { id: 3, customer: 'Bob Johnson', product: 'Widget C', amount: 19.99, status: 'completed', region: 'US' },
    { id: 4, customer: 'Alice Brown', product: 'Widget A', amount: 29.99, status: 'shipped', region: 'APAC' },
    { id: 5, customer: 'Eve Wilson', product: 'Widget D', amount: 99.99, status: 'completed', region: 'EU' },
    { id: 6, customer: 'Frank Lee', product: 'Widget B', amount: 49.99, status: 'pending', region: 'US' },
  ];

  ui.column(() => {
    ui.label('Dashboard').classes('text-3xl font-bold');

    const statsUi = ui.refreshable(() => {
      ui.stat([
        { title: 'Total Users', value: users.toLocaleString() },
        { title: 'Total Revenue', value: `$${revenue.toLocaleString(undefined, { maximumFractionDigits: 2 })}` },
        { title: 'Total Orders', value: orders },
        { title: 'Conversion Rate', value: `${conversion.toFixed(2)}%` },
      ]);
    });

    ui.button('Refresh Stats', {
      onClick: () => {
        users += Math.floor(Math.random() * 10);
        revenue += Math.random() * 100;
        orders += Math.floor(Math.random() * 3);
        conversion = Math.max(0.5, conversion + (Math.random() - 0.5));
        statsUi.refresh();
      },
    });

    ui.label('Recent Orders').classes('text-xl font-bold mt-4');
    ui.dataTable(
      recentOrders.map((o) => ({ ...o, amount: `$${o.amount.toFixed(2)}` })),
      {
        searchable: true,
        searchPlaceholder: 'Search orders…',
        pageSize: 5,
        columns: [
          { key: 'id', header: 'Order ID' },
          { key: 'customer', header: 'Customer' },
          { key: 'product', header: 'Product' },
          { key: 'amount', header: 'Amount', align: 'right' },
          { key: 'status', header: 'Status' },
          { key: 'region', header: 'Region' },
        ],
      },
    );
  }, { gap: 4 });
  });
});
