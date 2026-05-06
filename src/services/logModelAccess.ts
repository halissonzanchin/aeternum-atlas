import { supabase } from '../lib/supabase'

interface LogModelAccessProps {
  institution_id?: string | null
  user_id?: string | null
  model_id?: string | null
  action?: string | null
  duration_seconds?: number | null
}

export async function logModelAccess({
  institution_id,
  user_id,
  model_id,
  action = 'view_model',
  duration_seconds = 0
}: LogModelAccessProps) {
  const normalizedModelId = normalizeModelId(model_id)
  const missingFields = [
    !institution_id ? 'institution_id' : null,
    !user_id ? 'user_id' : null,
    !normalizedModelId ? 'model_id_uuid' : null,
    !action ? 'action' : null,
    duration_seconds === null || duration_seconds === undefined ? 'duration_seconds' : null
  ].filter(Boolean)

  if (missingFields.length > 0) {
    const error = new Error(`Campos obrigatórios ausentes: ${missingFields.join(', ')}`)
    console.warn('[model_access_logs] Log não enviado.', error.message)
    return { data: null, error }
  }

  const payload = {
    institution_id,
    user_id,
    model_id: normalizedModelId,
    action,
    duration_seconds
  }

  const { data, error } = await supabase.from('model_access_logs').insert(payload)

  if (error) {
    console.error('[model_access_logs] Erro ao salvar log:', error)
    return { data, error }
  }

  console.log('[model_access_logs] Log salvo com sucesso:', payload)

  return { data, error }
}

export async function getCurrentUserForModelAccess(currentUser?: {
  id?: string
  institution_id?: string
  institutionId?: string
  role?: string
  status?: string
  accountStatus?: string
} | null) {
  const propUser = currentUser?.id
    ? {
        id: currentUser.id,
        institution_id: currentUser.institution_id || currentUser.institutionId || null
      }
    : null

  const { data: authData, error: authError } = await supabase.auth.getUser()

  if (authError) {
    console.warn('[model_access_logs] Não foi possível ler o usuário autenticado no Supabase.', authError)
  }

  const authUser = authData?.user

  if (authUser?.id) {
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, institution_id, role, status')
      .eq('id', authUser.id)
      .maybeSingle()

    if (profileError) {
      console.warn('[model_access_logs] Não foi possível buscar o usuário em public.users.', profileError)
    }

    if (profile?.institution_id) {
      return {
        id: profile.id,
        institution_id: profile.institution_id,
        role: profile.role,
        status: profile.status
      }
    }

    console.warn('[model_access_logs] Usuário autenticado não possui institution_id em public.users.')
  }

  if (!propUser?.id) {
    console.warn('[model_access_logs] Usuário não autenticado ou currentUser ausente.')
    return null
  }

  if (!propUser.institution_id) {
    console.warn('[model_access_logs] currentUser não possui institution_id.')
    return null
  }

  return propUser
}

export function normalizeModelId(modelId?: string | null) {
  if (!modelId) return null

  const trimmed = modelId.trim()
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const sketchfabUidPattern = /^[0-9a-f]{32}$/i

  if (uuidPattern.test(trimmed)) return trimmed

  if (sketchfabUidPattern.test(trimmed)) {
    return `${trimmed.slice(0, 8)}-${trimmed.slice(8, 12)}-${trimmed.slice(12, 16)}-${trimmed.slice(16, 20)}-${trimmed.slice(20)}`
  }

  console.warn(
    '[model_access_logs] model_id precisa ser UUID. Recebido:',
    modelId,
    'Adicione supabaseModelId/model_id/sketchfabUid ao modelo.'
  )

  return null
}
