import { useState, type ReactNode } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from '@/components/ui/button-group';
import { Calendar } from '@/components/ui/calendar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Input } from '@/components/ui/input';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { Label } from '@/components/ui/label';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Slider } from '@/components/ui/slider';
import { Spinner } from '@/components/ui/spinner';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5 border-b pb-4">
        <h2 className="text-sm font-medium leading-none">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col items-stretch gap-4 rounded-xl border bg-card p-6 shadow-sm">
        {children}
      </div>
    </section>
  );
}

export default function KitchenSink() {
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(false);
  const [slider, setSlider] = useState([42]);
  const [progress] = useState(66);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [plan, setPlan] = useState('pro');

  return (
    <TooltipProvider>
      <Toaster position="top-right" richColors closeButton />
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-semibold tracking-tight">Kitchen Sink</h1>
          <p className="text-sm text-muted-foreground">
            Interactive showcase of the ShadCN New York catalog. Preview panels mirror the docs
            component pages.
          </p>
        </div>

        <Section title="Buttons & badges" description="Variants, sizes, and status chips.">
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </div>
          <ButtonGroup>
            <Button variant="outline">Left</Button>
            <Button variant="outline">Middle</Button>
            <Button variant="outline">Right</Button>
          </ButtonGroup>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge color="green">Named green</Badge>
            <Badge color="amber">Named amber</Badge>
            <Badge color="#6366f1">Custom hex</Badge>
          </div>
        </Section>

        <Section title="Form controls" description="Inputs, selects, switches, and sliders.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ks-name">Name</Label>
              <Input id="ks-name" placeholder="Ada Lovelace" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ks-email">Email</Label>
              <Input id="ks-email" type="email" placeholder="ada@example.com" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ks-bio">Bio</Label>
            <Textarea id="ks-bio" placeholder="Short introduction…" rows={3} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label>Framework</Label>
              <Select defaultValue="react">
                <SelectTrigger>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="react">React</SelectItem>
                  <SelectItem value="vue">Vue</SelectItem>
                  <SelectItem value="svelte">Svelte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ks-native">Native select</Label>
              <NativeSelect id="ks-native" defaultValue="us">
                <NativeSelectOption value="us">United States</NativeSelectOption>
                <NativeSelectOption value="pt">Portugal</NativeSelectOption>
                <NativeSelectOption value="uk">United Kingdom</NativeSelectOption>
              </NativeSelect>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <Checkbox
                id="ks-terms"
                checked={checked}
                onCheckedChange={(v) => setChecked(v === true)}
              />
              <Label htmlFor="ks-terms">Accept terms</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={switched} onCheckedChange={setSwitched} id="ks-switch" />
              <Label htmlFor="ks-switch">Airplane mode</Label>
            </div>
          </div>
          <RadioGroup value={plan} onValueChange={setPlan} className="flex flex-wrap gap-4">
            {[
              ['free', 'Free'],
              ['pro', 'Pro'],
              ['enterprise', 'Enterprise'],
            ].map(([value, label]) => (
              <div key={value} className="flex items-center gap-2">
                <RadioGroupItem value={value} id={`ks-plan-${value}`} />
                <Label htmlFor={`ks-plan-${value}`}>{label}</Label>
              </div>
            ))}
          </RadioGroup>
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <Label>Volume</Label>
              <span className="text-muted-foreground">{slider[0]}</span>
            </div>
            <Slider value={slider} onValueChange={setSlider} max={100} step={1} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Toggle aria-label="Bold">
              <Bold />
            </Toggle>
            <Toggle aria-label="Italic" variant="outline">
              <Italic />
            </Toggle>
            <ToggleGroup type="multiple" variant="outline">
              <ToggleGroupItem value="bold" aria-label="Bold">
                <Bold />
              </ToggleGroupItem>
              <ToggleGroupItem value="italic" aria-label="Italic">
                <Italic />
              </ToggleGroupItem>
              <ToggleGroupItem value="underline" aria-label="Underline">
                <Underline />
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </Section>

        <Section title="Feedback" description="Alerts, progress, loading states, and toasts.">
          <Alert>
            <AlertTitle>Heads up</AlertTitle>
            <AlertDescription>You can use alerts for neutral session messages.</AlertDescription>
          </Alert>
          <Alert variant="destructive">
            <AlertTitle>Something went wrong</AlertTitle>
            <AlertDescription>Destructive variant for failures and blockers.</AlertDescription>
          </Alert>
          <div className="flex flex-col gap-2">
            <Label>Progress ({progress}%)</Label>
            <Progress value={progress} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <Spinner className="size-5" />
            <Skeleton className="h-8 w-40" />
            <Skeleton className="size-10 rounded-full" />
            <KbdGroup>
              <Kbd>⌘</Kbd>
              <Kbd>K</Kbd>
            </KbdGroup>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => toast.success('Saved', { description: 'Kitchen sink toast via sonner.' })}
            >
              Toast success
            </Button>
            <Button variant="outline" onClick={() => toast.error('Failed to sync')}>
              Toast error
            </Button>
          </div>
        </Section>

        <Section title="Overlays" description="Dialogs, sheets, drawers, menus, and floating UI.">
          <div className="flex flex-wrap gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit profile</DialogTitle>
                  <DialogDescription>Make changes and save when you are done.</DialogDescription>
                </DialogHeader>
                <Input placeholder="Display name" />
                <DialogFooter>
                  <Button type="button">Save</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Alert dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction variant="destructive">Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Sheet panel</SheetTitle>
                  <SheetDescription>Side panel built on Dialog primitives.</SheetDescription>
                </SheetHeader>
                <div className="grid gap-3 py-4">
                  <Input placeholder="Sidebar field" />
                  <Textarea placeholder="Notes" rows={4} />
                </div>
              </SheetContent>
            </Sheet>

            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Mobile drawer</DrawerTitle>
                  <DrawerDescription>Vaul-powered bottom sheet pattern.</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Popover</Button>
              </PopoverTrigger>
              <PopoverContent className="w-72">
                <div className="flex flex-col gap-2">
                  <p className="text-sm font-medium">Dimensions</p>
                  <Input placeholder="Width" />
                  <Input placeholder="Height" />
                </div>
              </PopoverContent>
            </Popover>

            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">@badui</Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-72">
                <div className="flex gap-3">
                  <Avatar>
                    <AvatarFallback>BU</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">BadUI</h4>
                    <p className="text-sm text-muted-foreground">
                      Server-driven UI with a React + ShadCN client.
                    </p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>Helpful hint</TooltipContent>
            </Tooltip>
          </div>
        </Section>

        <Section title="Navigation & disclosure" description="Tabs, accordion, and collapsible.">
          <Tabs defaultValue="account">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
              <TabsTrigger value="team">Team</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="rounded-md border p-4 text-sm">
              Make changes to your account here.
            </TabsContent>
            <TabsContent value="password" className="rounded-md border p-4 text-sm">
              Change your password here.
            </TabsContent>
            <TabsContent value="team" className="rounded-md border p-4 text-sm">
              Manage team members here.
            </TabsContent>
          </Tabs>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>Yes. It comes with default styles that match the theme.</AccordionContent>
            </AccordionItem>
          </Accordion>

          <Collapsible className="rounded-md border px-4 py-2">
            <div className="flex items-center justify-between gap-4">
              <h4 className="text-sm font-medium">@radix-ui/primitives</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm">
                  Toggle
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-2 text-sm text-muted-foreground">
              Collapsible content for progressive disclosure without a full accordion.
            </CollapsibleContent>
          </Collapsible>
        </Section>

        <div className="grid gap-8 lg:grid-cols-2">
          <Section title="Calendar" description="Date selection with react-day-picker.">
            <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />
          </Section>

          <Section title="Media & scroll" description="Avatar, aspect ratio, and scroll area.">
            <div className="flex items-center gap-3">
              <Avatar size="lg">
                <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>TS</AvatarFallback>
              </Avatar>
              <Avatar size="sm">
                <AvatarFallback>UI</AvatarFallback>
              </Avatar>
            </div>
            <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-md bg-muted">
              <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
                16:9 aspect ratio
              </div>
            </AspectRatio>
            <ScrollArea className="h-32 rounded-md border p-3">
              <div className="space-y-2 text-sm">
                {Array.from({ length: 12 }, (_, i) => (
                  <p key={i}>Scrollable row {i + 1}</p>
                ))}
              </div>
            </ScrollArea>
          </Section>
        </div>

        <Section title="Table & pagination" description="Basic data display primitives.">
          <Table>
            <TableCaption>A short list of sample invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[
                ['INV-001', 'Paid', '$250.00'],
                ['INV-002', 'Pending', '$150.00'],
                ['INV-003', 'Unpaid', '$350.00'],
              ].map(([invoice, status, amount]) => (
                <TableRow key={invoice}>
                  <TableCell className="font-medium">{invoice}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{status}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{amount}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  1
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">2</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </Section>

        <Card>
          <CardHeader>
            <CardTitle>Card anatomy</CardTitle>
            <CardDescription>Header, content, and footer slots.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Cards are still available when you need titled containers.
            </p>
            <Separator className="my-4" />
            <p className="text-sm">Separators divide related content without nesting more cards.</p>
          </CardContent>
          <CardFooter className="gap-2">
            <Button size="sm">Primary</Button>
            <Button size="sm" variant="outline">
              Secondary
            </Button>
          </CardFooter>
        </Card>
      </div>
    </TooltipProvider>
  );
}
