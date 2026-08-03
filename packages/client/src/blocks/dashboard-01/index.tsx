import { Toaster } from 'sonner';
import data from './data.json';
import { ChartAreaInteractive } from './chart-area-interactive';
import { DataTable } from './data-table';
import { SectionCards } from './section-cards';

export default function Dashboard01() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <Toaster position="top-right" richColors closeButton />
      <SectionCards />
      <div className="px-0 lg:px-0">
        <ChartAreaInteractive />
      </div>
      <DataTable data={data} />
    </div>
  );
}
