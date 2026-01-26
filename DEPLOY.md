# Guia de Deploy - Pinheiros Burger

Este guia ajudará você a colocar seu projeto online gratuitamente usando a Vercel.

## Opção 1: Deploy Automático via GitHub (Recomendado)

1.  **Envie seu código para o GitHub**
    *   Crie um repositório no GitHub.
    *   Envie este código atual para lá.

2.  **Conecte na Vercel**
    *   Acesse [vercel.com](https://vercel.com) e faça login.
    *   Clique em **"Add New..."** -> **"Project"**.
    *   Importe o repositório do GitHub que você acabou de criar.

3.  **Configure as Variáveis de Ambiente**
    *   Na tela de configuração do projeto ("Configure Project"), procure por **"Environment Variables"**.
    *   Adicione as seguintes variáveis (copie os valores do seu arquivo `.env` local):
        *   `VITE_SUPABASE_URL`
        *   `VITE_SUPABASE_PROJECT_ID`
        *   `VITE_SUPABASE_PUBLISHABLE_KEY`

4.  **Deploy**
    *   Clique em **"Deploy"**.
    *   Aguarde alguns instantes e seu site estará no ar!

## Opção 2: Deploy Manual via Linha de Comando (CLI)

Se você preferir fazer direto pelo terminal:

1.  Instale a CLI da Vercel (caso não tenha):
    ```bash
    npm i -g vercel
    ```

2.  Faça login:
    ```bash
    vercel login
    ```

3.  Faça o deploy:
    ```bash
    vercel
    ```
    *   Siga as instruções na tela (aceite os padrões com "Yes" ou Enter).

4.  Deploy de Produção:
    *   O comando acima cria uma URL de "preview". Para o deploy final (produção), use:
    ```bash
    vercel --prod
    ```

## Observações Importantes

*   **Supabase**: Seu banco de dados já está na nuvem (Supabase), então não precisa "fazer deploy" dele. Apenas certifique-se de que as variáveis de ambiente na Vercel estejam corretas para que o site consiga se conectar.
*   **Vercel.json**: Já criei um arquivo `vercel.json` na raiz do projeto para garantir que a navegação entre páginas funcione corretamente.
