
## GitHub Actions — Build automatizado do .exe

O workflow `.github/workflows/build-installer.yml` compila o instalador
`OrvixSistemasSetup.exe` em um runner `windows-latest`.

Gatilhos:
- push em `main` alterando `electron/**`, `electron-builder.yml` ou `package.json`
- `workflow_dispatch` (botão "Run workflow" na aba Actions)
- criação de um Release (o `.exe` é anexado ao release automaticamente)

Como baixar o instalador após o build:
1. Conecte o projeto ao GitHub (menu + → GitHub → Connect project).
2. Abra a aba **Actions** no repositório.
3. Selecione a última execução verde de "Build Windows Installer".
4. Baixe o artifact **OrvixSistemasSetup** (contém `OrvixSistemasSetup.exe`).
5. Suba o `.exe` para o storage da Área do Cliente e atualize a URL do
   botão de download em `src/routes/download.tsx` (`INSTALLER_URL`).

Code signing (opcional, recomendado para produção):
- Adquira certificado Authenticode (.pfx).
- Adicione secrets no repositório: `CSC_LINK` (base64 do .pfx) e
  `CSC_KEY_PASSWORD`.
- Remova a linha `CSC_IDENTITY_AUTO_DISCOVERY: "false"` do workflow.
# ORVIX PDV — Empacotamento Desktop (Electron)

Este documento descreve como gerar o instalador **`.exe`** assinado do ORVIX PDV
e publicar releases com auto-update. O scaffold já está no repositório:

```
electron/
  main.cjs         → processo principal (janela, IPC, auto-update)
  preload.cjs      → bridge segura window.orvix (contextIsolation ON)
  assets/          → ícones e artes do instalador (você fornece)
electron-builder.yml → configuração do build + branding NSIS
```

> **Arquitetura**: o app nativo apenas envelopa a aplicação web SSR já
> publicada em `https://orvixsistemas.lovable.app` (ou o domínio custom
> configurável via env `ORVIX_APP_URL`). Isso preserva 100% da autenticação
> Supabase, permissões e regras de negócio. O nativo adiciona: **impressão
> silenciosa**, janela dedicada, prioridade alta no Windows e auto-update.

---

## 1. Pré-requisitos (máquina de build)

Rode em Windows 10/11 (nativo ou GitHub Actions `windows-latest`). Node 20+.

```powershell
npm install --save-dev electron@latest electron-builder@latest electron-updater@latest
```

> ⚠️ **Não instale no ambiente Lovable/Cloudflare** — Electron é uma
> dependência de build local, não runtime. Adicione apenas ao pipeline.

### Arquivos de arte a colocar em `electron/assets/`

| Arquivo | Formato | Tamanho |
|---|---|---|
| `icon.ico` | ICO multi-resolução | 16, 32, 48, 128, 256 |
| `icon.icns` | ICNS macOS | 512×512 base |
| `icon.png` | PNG | 512×512 |
| `installer-header.bmp` | BMP 24-bit | 150×57 |
| `installer-sidebar.bmp` | BMP 24-bit | 164×314 |
| `LICENSE.txt` | Texto UTF-8 (ou ANSI-1252) | — |

Gere os ícones a partir de `src/assets/orvix-logo-dark.png` (fornecido no
repositório) com uma ferramenta como `png-to-ico` / `iconutil`. As BMPs do
instalador seguem a paleta ORVIX: **fundo preto `#000000`** com logo
centralizado e detalhe **primário `#850405`**.

---

## 2. Build local (teste sem assinatura)

```powershell
# clona o repo, entra na pasta
npm ci
npx electron-builder --win nsis
```

Saída: `dist-electron/OrvixPDV-Setup-<versão>.exe`.

Para testar sem instalar:

```powershell
npx electron ./electron/main.cjs
```

---

## 3. Assinatura de código (Windows Authenticode)

Sem assinatura o SmartScreen bloqueia o `.exe` e o auto-update NÃO valida.

1. Compre um certificado EV Code Signing (DigiCert, Sectigo, SSL.com).
2. Exporte como `.pfx` e coloque em `signing/orvix.pfx` (adicione ao
   `.gitignore`).
3. No pipeline defina `CSC_LINK` (base64 do pfx) e `CSC_KEY_PASSWORD`.
4. Descomente as linhas `certificateFile` / `certificatePassword` em
   `electron-builder.yml`.

---

## 4. Auto-update com `electron-updater`

O código em `electron/main.cjs` já lê `electron-updater` quando
`ORVIX_UPDATES=1` está no ambiente. Passos para ligar em produção:

1. Suba o feed em `https://updates.orvixsistemas.com.br/pdv/` (S3, R2 ou
   GitHub Releases). O `electron-builder.yml` já aponta para lá com
   `publish.provider = generic`.
2. Faça o release publicando com:
   ```powershell
   npx electron-builder --win nsis --publish always
   ```
3. Empacote o app já com `ORVIX_UPDATES=1` definido no manifest do
   Windows (ou via env do CI).
4. A partir daí, cada nova versão publicada é baixada silenciosamente e
   aplicada no próximo restart do PDV. **O cliente nunca mais baixa um
   instalador manualmente após a primeira instalação.**

---

## 5. Pipeline recomendado (GitHub Actions)

`.github/workflows/pdv-release.yml`:

```yaml
name: Release ORVIX PDV
on:
  push:
    tags: ['pdv-v*']
jobs:
  build:
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - name: Build & publish
        env:
          CSC_LINK: ${{ secrets.WINDOWS_CERT_PFX_BASE64 }}
          CSC_KEY_PASSWORD: ${{ secrets.WINDOWS_CERT_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ORVIX_UPDATES: '1'
        run: npx electron-builder --win nsis --publish always
```

---

## 6. Hospedagem do instalador (página `/download`)

A página `/download` do site aponta para `/downloads/OrvixPDV-Setup.exe`.
Faça o `.exe` mais recente ser servido nesse caminho. Duas opções:

- **Redirect** na plataforma para o release público (S3/R2/GitHub) —
  recomendado.
- Upload manual do artefato em cada release.

---

## 7. Impressão silenciosa a partir do renderer

No código React use `orvixPrint(html)` de `@/lib/electron`. No navegador
cai no `window.print()` padrão; no app nativo usa
`webContents.print({ silent: true })` via IPC.

```ts
import { orvixPrint } from "@/lib/electron";
await orvixPrint(cupomHtml); // silencioso quando dentro do app
```

---

## 8. Checklist final para o lançamento

- [ ] Ícones e BMPs em `electron/assets/`
- [ ] Certificado Authenticode configurado no CI
- [ ] Feed de update publicado e HTTPS
- [ ] Tag `pdv-v1.0.0` disparando o workflow
- [ ] `/downloads/OrvixPDV-Setup.exe` apontando para o release
- [ ] Testar instalação em Windows 10 e 11 limpos
- [ ] Testar impressão silenciosa em impressora térmica 80mm
- [ ] Testar rollout de update (v1.0.0 → v1.0.1)