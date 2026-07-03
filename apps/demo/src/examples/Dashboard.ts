import { ui } from '@badui/ui';

type Order = {
  id: number;
  customer: string;
  product: string;
  amount: number;
  status: string;
  region: string;
};

ui.page('/examples/dashboard', () => {
  let users = 1234;
  let revenue = 12345.67;
  let orders = 89;
  let conversion = 3.45;
  let recentOrders: Order[] = [
    { id: 1, customer: 'John Doe', product: 'Widget A', amount: 29.99, status: 'completed', region: 'US' },
    { id: 2, customer: 'Jane Smith', product: 'Widget B', amount: 49.99, status: 'pending', region: 'EU' },
    { id: 3, customer: 'Bob Johnson', product: 'Widget C', amount: 19.99, status: 'completed', region: 'US' },
    { id: 4, customer: 'Alice Brown', product: 'Widget A', amount: 29.99, status: 'shipped', region: 'APAC' },
    { id: 5, customer: 'Eve Wilson', product: 'Widget D', amount: 99.99, status: 'completed', region: 'EU' },
    { id: 6, customer: 'Frank Lee', product: 'Widget B', amount: 49.99, status: 'pending', region: 'US' },
    { id: 7, customer: 'Grace Kim', product: 'Widget C', amount: 19.99, status: 'shipped', region: 'APAC' },
    { id: 8, customer: 'Henry Fox', product: 'Widget A', amount: 29.99, status: 'completed', region: 'EU' },
    { id: 9, customer: 'Ivy Chen', product: 'Widget D', amount: 99.99, status: 'pending', region: 'APAC' },
    { id: 10, customer: 'Jack Ray', product: 'Widget B', amount: 49.99, status: 'completed', region: 'US' },
    { id: 11, customer: 'Kate Moss', product: 'Widget C', amount: 19.99, status: 'shipped', region: 'EU' },
    { id: 12, customer: 'Leo Park', product: 'Widget A', amount: 29.99, status: 'pending', region: 'APAC' },
  ];

  ui.column(() => {
    ui.label('Dashboard').classes('text-3xl font-bold');

    ui.row(() => {
      ui.stat([
        { title: '👥 Total Users', value: users.toLocaleString() },
        { title: '💰 Total Revenue', value: `$${revenue.toLocaleString()}`, valueClassName: 'text-primary' },
        { title: '📦 Total Orders', value: orders },
        { title: '📈 Conversion Rate', value: `${conversion}%` },
      ]);
    }).classes('justify-around');

    ui.row(() => {
      ui.button('Refresh Stats', {
        color: 'primary',
        on_click: () => {
          users = users + Math.floor(Math.random() * 10);
          revenue = revenue + Math.random() * 100;
          orders = orders + Math.floor(Math.random() * 3);
        },
      });
    });

    ui.label('Recent Orders').classes('text-xl font-bold mt-4');

    ui.dataTable(recentOrders, {
      key: 'recentOrders',
      columns: [
        { key: 'id', header: 'Order ID' },
        { key: 'customer', header: 'Customer', sortable: true },
        { key: 'product', header: 'Product', sortable: true },
        {
          key: 'amount',
          header: 'Amount',
          sortable: true,
          render: (row) => `$${row.amount.toFixed(2)}`,
          align: 'right',
        },
        {
          key: 'status',
          header: 'Status',
          render: (row) =>
            `<span class="badge badge-${row.status === 'completed' ? 'success' : row.status === 'pending' ? 'warning' : 'info'}">${row.status}</span>`,
        },
      ],
      keyField: 'id',
      sortable: true,
      searchable: true,
      paginate: true,
      pageSize: 5,
      hover: true,
      striped: true,
    });
  });
});
