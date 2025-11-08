import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1'
import { corsHeaders } from '../_shared/cors.ts'

interface ImpersonateRequest {
  targetUserId: string
  action: 'start' | 'end'
  sessionToken?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify JWT and get admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('Missing authorization header')
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      throw new Error('Unauthorized')
    }

    // Verify user is ADMIN
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'ADMIN')
      .single()

    if (rolesError || !roles) {
      console.error('Not admin:', rolesError)
      throw new Error('Only administrators can impersonate users')
    }

    const { targetUserId, action, sessionToken }: ImpersonateRequest = await req.json()

    if (action === 'start') {
      // Verify target user exists
      const { data: targetUser, error: targetError } = await supabase
        .from('usuarios')
        .select('id, nome, email')
        .eq('id', targetUserId)
        .single()

      if (targetError || !targetUser) {
        console.error('Target user not found:', targetError)
        throw new Error('Target user not found')
      }

      // Generate secure session token
      const newSessionToken = crypto.randomUUID()
      const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000) // 4 hours

      // Create impersonation session
      const { error: sessionError } = await supabase
        .from('impersonation_sessions')
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
          session_token: newSessionToken,
          expires_at: expiresAt.toISOString()
        })

      if (sessionError) {
        console.error('Failed to create session:', sessionError)
        throw new Error('Failed to create impersonation session')
      }

      // Log impersonation start
      await supabase
        .from('audit_impersonation')
        .insert({
          admin_user_id: user.id,
          target_user_id: targetUserId,
          action: 'START',
          session_token: newSessionToken,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown',
          metadata: {
            target_user_name: targetUser.nome,
            target_user_email: targetUser.email
          }
        })

      console.log(`Impersonation started: ${user.id} -> ${targetUserId}`)

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionToken: newSessionToken,
          expiresAt: expiresAt.toISOString()
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } else if (action === 'end') {
      if (!sessionToken) {
        throw new Error('Session token required to end impersonation')
      }

      // Verify session belongs to admin
      const { data: session, error: sessionError } = await supabase
        .from('impersonation_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .eq('admin_user_id', user.id)
        .is('ended_at', null)
        .single()

      if (sessionError || !session) {
        console.error('Invalid session:', sessionError)
        throw new Error('Invalid or expired session')
      }

      // End the session
      const { error: endError } = await supabase
        .from('impersonation_sessions')
        .update({ ended_at: new Date().toISOString() })
        .eq('id', session.id)

      if (endError) {
        console.error('Failed to end session:', endError)
        throw new Error('Failed to end session')
      }

      // Log impersonation end
      await supabase
        .from('audit_impersonation')
        .insert({
          admin_user_id: user.id,
          target_user_id: session.target_user_id,
          action: 'END',
          session_token: sessionToken,
          ip_address: req.headers.get('x-forwarded-for') || 'unknown'
        })

      console.log(`Impersonation ended: ${sessionToken}`)

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    throw new Error('Invalid action')

  } catch (error) {
    console.error('Error in secure-impersonate:', error)
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    const isUnauthorized = errorMessage.includes('Unauthorized') || errorMessage.includes('Only administrators')
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: isUnauthorized ? 403 : 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})