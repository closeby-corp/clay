import { page, Component } from '@ralph/core';

@page('/examples/dashboard')
export class DashboardExample extends Component {
  render(): string {
    return `
      <div class="container mx-auto max-w-6xl p-6">
        <div class="flex flex-col gap-6">
          <h1 class="text-3xl font-bold">Dashboard</h1>
          
          <!-- Stats cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Stat Card 1 -->
            <div class="card bordered shadow-sm bg-primary/10">
              <div class="card-body p-4">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">👥</span>
                  <div>
                    <p class="text-sm text-neutral">Total Users</p>
                    <p class="text-2xl font-bold">1,234</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Stat Card 2 -->
            <div class="card bordered shadow-sm bg-success/10">
              <div class="card-body p-4">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">💰</span>
                  <div>
                    <p class="text-sm text-neutral">Revenue</p>
                    <p class="text-2xl font-bold">$12,345</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Stat Card 3 -->
            <div class="card bordered shadow-sm bg-info/10">
              <div class="card-body p-4">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">📦</span>
                  <div>
                    <p class="text-sm text-neutral">Orders</p>
                    <p class="text-2xl font-bold">89</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Stat Card 4 -->
            <div class="card bordered shadow-sm bg-accent/10">
              <div class="card-body p-4">
                <div class="flex items-center gap-4">
                  <span class="text-3xl">📈</span>
                  <div>
                    <p class="text-sm text-neutral">Conversion</p>
                    <p class="text-2xl font-bold">3.45%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Recent orders table -->
          <h2 class="text-xl font-bold">Recent Orders</h2>
          <div class="overflow-x-auto">
            <table class="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th class="text-right">Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>John Doe</td>
                  <td>Widget A</td>
                  <td class="text-right">$29.99</td>
                  <td><span class="badge badge-success">completed</span></td>
                </tr>
                <tr>
                  <td>2</td>
                  <td>Jane Smith</td>
                  <td>Widget B</td>
                  <td class="text-right">$49.99</td>
                  <td><span class="badge badge-warning">pending</span></td>
                </tr>
                <tr>
                  <td>3</td>
                  <td>Bob Johnson</td>
                  <td>Widget C</td>
                  <td class="text-right">$19.99</td>
                  <td><span class="badge badge-success">completed</span></td>
                </tr>
                <tr>
                  <td>4</td>
                  <td>Alice Brown</td>
                  <td>Widget A</td>
                  <td class="text-right">$29.99</td>
                  <td><span class="badge badge-info">shipped</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  }
}
