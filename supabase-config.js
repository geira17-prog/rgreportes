// CONFIGURAÇÃO RG REPORTES + SUPABASE
// Chave publicável: segura para uso no frontend quando o RLS está configurado.
// NÃO coloque aqui a Secret key/service_role.

const SUPABASE_URL = "https://utibukimkrhmgtkliegp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_YxmqeWQzk6PcmUUGI50Sew_5pfScVkk";

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
