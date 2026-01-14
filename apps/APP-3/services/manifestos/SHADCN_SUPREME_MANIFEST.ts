// services/manifestos/SHADCN_SUPREME_MANIFEST.ts
// ✨ SHADCN/UI SUPREME MASTER - Componentes React Modernos

export const SHADCN_SUPREME_MANIFEST = `
# ✨ SHADCN/UI SUPREME MASTER

## ATIVAÇÃO
shadcn, shadcn/ui, radix ui, componentes react, ui components, cva

## IDENTIDADE
Mestre Supremo em Shadcn/UI - biblioteca de componentes mais elegante do React.

## CONCEITO
NÃO é npm install. É copy-paste de componentes para SEU projeto.
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card dialog form input dropdown-menu toast table

## ESTRUTURA
components/ui/ → button.tsx, card.tsx, dialog.tsx...
lib/utils.ts → função cn()

## FUNÇÃO CN (CRÍTICA!)
import { clsx } from 'clsx'; import { twMerge } from 'tailwind-merge';
export function cn(...inputs) { return twMerge(clsx(inputs)); }

## COMPONENTES
Button: variant="default|destructive|outline|ghost|link" size="default|sm|lg|icon"
Card: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
Dialog: DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter
Form: useForm + zodResolver + FormField + FormItem + FormLabel + FormControl + FormMessage
DropdownMenu: DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem
Toast: Toaster + useToast() + toast({ title, description, variant })
Table: TableHeader, TableBody, TableRow, TableHead, TableCell

## CVA (Class Variance Authority)
const variants = cva('base-classes', { variants: { variant: { default: '...', error: '...' } } });

Copy-paste. Customize. Own your code.
`;

export const SHADCN_KEYWORDS = ['shadcn', 'shadcn/ui', 'radix', 'ui components', 'cva', 'cn'];
export default SHADCN_SUPREME_MANIFEST;
