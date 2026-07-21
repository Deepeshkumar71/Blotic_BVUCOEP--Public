import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, code, userName } = await req.json()

    // Email HTML template
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Password Reset Code</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #cc75db 0%, #602ea6 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .logo { width: 80px; height: 60px; margin: 0 auto 15px; display: block; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .code-box { background: #fff; border: 2px solid #cc75db; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
          .code { font-size: 32px; font-weight: bold; color: #cc75db; letter-spacing: 8px; font-family: monospace; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="https://your-domain.com/images/blotic.png" alt="BLOTIC Logo" class="logo" />
            <h1>🔐 Password Reset Code</h1>
            <p>BLOTIC - Blockchain Organization of Technology & Innovation Club</p>
          </div>
          <div class="content">
            <h2>Hello ${userName}!</h2>
            <p>You requested a password reset for your BLOTIC account. Use the code below to reset your password:</p>
            
            <div class="code-box">
              <div class="code">${code}</div>
            </div>
            
            <p><strong>This code will expire in 15 minutes.</strong></p>
            <p>If you didn't request this password reset, please ignore this email.</p>
            
            <div class="footer">
              <p>© 2024 BLOTIC Team. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `

    // Text version
    const textContent = `
Password Reset Code - BLOTIC

Hello ${userName}!

You requested a password reset for your BLOTIC account.

Your reset code is: ${code}

This code will expire in 15 minutes.

If you didn't request this password reset, please ignore this email.

© 2024 BLOTIC Team. All rights reserved.
    `

    // Use Supabase's configured SMTP to send email
    const emailResponse = await fetch('https://api.supabase.com/v1/projects/YOUR_PROJECT_ID/functions/v1/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({
        to: to,
        subject: `🔑 Password Reset Code - BLOTIC`,
        html: htmlContent,
        text: textContent,
      }),
    })

    if (emailResponse.ok) {
      return new Response(
        JSON.stringify({ success: true, message: 'Email sent successfully' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      throw new Error('Failed to send email via Supabase SMTP')
    }

  } catch (error) {
    console.error('Email sending error:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})
