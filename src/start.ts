import { createStart } from '@tanstack/react-start'
import { attachSupabaseAuth } from '@/integrations/supabase/auth-attacher'

/**
 * Registra o middleware global que anexa o token Supabase em toda chamada
 * de serverFn. Sem isso, qualquer função protegida por `requireSupabaseAuth`
 * retorna "Unauthorized: No authorization header provided".
 */
export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
}))