

## Ajustar tamanhos de fontes, botoes e modais para mobile

Analisei todos os componentes e paginas do app. O app ja esta bem dimensionado para mobile (inputs h-12, botoes h-14, textos text-base/text-sm). Os principais ajustes necessarios sao:

### Problemas encontrados

1. **ReportsPage header** - o layout com filtro de semana + botao PDF fica apertado em telas pequenas (390px)
2. **AlertDialog (BarbersPage)** - nao tem `max-w` nem `rounded` customizado como o de ClientsPage
3. **BottomNav** - 6 itens no modo owner pode ficar apertado em 390px
4. **PinValidation PIN display** - `text-5xl` pode ser grande demais em telas muito pequenas
5. **Popup/toast** - tamanho adequado, sem problemas
6. **Drawer handle** - `w-[100px]` e `h-2` esta ok

### Plano de ajustes

**1. Normalizar AlertDialogs para mobile**
- BarbersPage AlertDialog: adicionar `max-w-[340px] rounded-2xl` e `h-12 text-base` nos botoes (igual ClientsPage)

**2. ReportsPage header responsivo**
- Quebrar o header em duas linhas: titulo na primeira, filtros na segunda
- Reduzir tamanho do badge "Esta Semana" para caber melhor

**3. BottomNav - ajustar para 6 itens (owner)**
- Reduzir padding horizontal e tamanho dos icones para `w-5 h-5`
- Reduzir font-size do label para `text-[10px]`

**4. PinValidation - ajustar PIN display**
- Trocar `text-5xl` por `text-4xl` no display do PIN
- Reduzir gap do numpad de `gap-3` para `gap-2`

**5. Consistencia geral de botoes**
- Garantir que todos os botoes de acao principal tenham `h-12` ou `h-14` (touch target minimo 48px)
- Garantir que todos os `AlertDialogAction`/`AlertDialogCancel` tenham `h-12 text-base`

### Arquivos a editar

- `src/components/BottomNav.tsx` - icones e labels menores
- `src/pages/ReportsPage.tsx` - header layout responsivo
- `src/pages/BarbersPage.tsx` - AlertDialog styling
- `src/components/PinValidation.tsx` - PIN display size
- `src/components/ui/drawer.tsx` - (sem mudanca, ja ok)

