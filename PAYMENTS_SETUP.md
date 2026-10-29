# ObraFácil PRO — configuração de pagamentos

O site continua no GitHub Pages. O Netlify hospeda somente as funções de backend; o Supabase guarda pedidos e licenças. **Não coloque tokens ou chaves secretas no React/GitHub Pages nem os envie pelo chat.**

## 1. Supabase (banco gratuito)
1. Crie um projeto em https://supabase.com/.
2. Abra SQL Editor e execute o arquivo `supabase/schema.sql`.
3. Em Project Settings → API, copie a Project URL e a chave **service_role** para usar apenas nas variáveis privadas do Netlify.

## 2. Netlify
1. Crie um site no Netlify ligado ao repositório `ivancm347/ObraFacil-pro`.
2. Em Site configuration → Environment variables, configure:
   - `MERCADO_PAGO_ACCESS_TOKEN`: token de acesso de produção do Mercado Pago (não compartilhe publicamente).
   - `SUPABASE_URL`: URL do projeto Supabase.
   - `SUPABASE_SERVICE_ROLE_KEY`: chave service_role do Supabase.
3. O `netlify.toml` define `npm run build`, pasta publicada `dist` e funções em `netlify/functions`.
4. Depois do deploy, a URL das funções será `https://SEU-SITE.netlify.app/.netlify/functions/NOME`.

## 3. Mercado Pago
- Configure a URL de notificações/webhooks para `https://SEU-SITE.netlify.app/.netlify/functions/payment-webhook` se o painel pedir configuração explícita.
- O webhook consulta o pagamento diretamente pela API do Mercado Pago e só ativa quando o status é `approved`, a moeda é BRL e o valor é R$ 14,99.
- Faça primeiro uma compra de teste em ambiente de teste antes de aceitar pagamentos reais.

## Funções criadas
- `create-checkout`: recebe o e-mail e cria o checkout de pagamento único por R$ 14,99.
- `payment-webhook`: verifica o pagamento na API e ativa a licença no banco.
- `check-license`: consulta se um e-mail tem licença PRO ativa.

## Importante
Estas funções são a base do backend, não significam que a compra já esteja disponível no aplicativo. Ainda é necessário implantar no frontend o botão de compra/recuperação da licença e testar o fluxo ponta a ponta antes de anunciar a venda. Não confie apenas em `localStorage` para conceder acesso PRO; a validação final deve consultar o backend.
