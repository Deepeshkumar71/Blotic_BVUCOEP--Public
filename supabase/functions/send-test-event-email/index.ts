import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventId, testEmail } = await req.json();

    if (!eventId || !testEmail) {
      throw new Error('Missing eventId or testEmail');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // SMTP Configuration
    const SMTP_HOST = Deno.env.get('SMTP_HOST');
    const SMTP_PORT = Deno.env.get('SMTP_PORT');
    const SMTP_USER = Deno.env.get('SMTP_USER');
    const SMTP_PASS = Deno.env.get('SMTP_PASS');

    // Format event date
    const eventDate = new Date(event.event_date);
    const formattedDate = eventDate.toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Registration link
    const registrationLink = `https://blotic-bvucoep.vercel.app/events`;

    // Email template
    const emailHTML = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #000000;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #0a0a0a; max-width: 600px;">
          <!-- Header -->
          <tr>
            <td style="background-color: #3d3d5c; padding: 40px 30px; text-align: center;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <table cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="padding-right: 15px; vertical-align: middle;">
                          <img src="https://blotic-bvucoep.vercel.app/images/blotic.png" alt="BLOTIC" width="50" height="50" style="display: block;" />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 32px; font-weight: bold; color: #a78bfa; line-height: 1;">BLOTIC</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 15px;">
                    <span style="color: #9ca3af; font-size: 14px;">Blockchain & Web3 Club - BVUCOEP</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
    <div class="content">
      <div class="test-badge">⚠️ TEST EMAIL</div>
      <p>Hi Test Recipient,</p>
      <p>This is a test email. Below is how the event notification will appear to students:</p>
      
      <div class="event-card">
        <div class="event-title">${event.title}</div>
        
        ${event.description ? `<p style="color: #6b7280; margin: 15px 0;">${event.description}</p>` : ''}
        
        <div class="event-detail">
          <strong>📅 Date & Time:</strong> ${formattedDate}
        </div>
        
        ${event.location ? `
        <div class="event-detail">
          <strong>📍 Location:</strong> ${event.is_virtual ? '🌐 Virtual Event' : event.location}
        </div>
        ` : ''}
        
        ${event.registration_fee && event.registration_fee > 0 ? `
        <div class="event-detail">
          <strong>💰 Registration Fee:</strong> ₹${event.registration_fee}
        </div>
        ` : `
        <div class="event-detail">
          <strong>💰 Registration:</strong> FREE
        </div>
        `}
      </div>
      
      ${event.is_registration_open ? `
      <div style="text-align: center;">
        <a href="${registrationLink}" class="cta-button">
          Register Now 🚀
        </a>
        <p style="color: #6b7280; font-size: 14px;">Click the button above to view event details and register</p>
      </div>
      ` : `
      <div style="text-align: center; padding: 20px; background: #fef3c7; border-radius: 8px; margin: 20px 0;">
        <p style="color: #92400e; margin: 0;">⏳ Registration will open soon!</p>
      </div>
      `}
      
      <p style="margin-top: 30px;">Don't miss out on this amazing opportunity to learn, network, and grow!</p>
      
      <p>Best regards,<br><strong>Team BLOTIC</strong><br>BVUCOEP</p>
    </div>
    
    <div class="footer">
      <p>This is a TEST email from BLOTIC - BVUCOEP</p>
      <p>© ${new Date().getFullYear()} BLOTIC. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    // Send test email using SMTP
    if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
      const nodemailer = await import('npm:nodemailer@6.9.7');
      
      const transporter = nodemailer.default.createTransport({
        host: SMTP_HOST,
        port: parseInt(SMTP_PORT || '587'),
        secure: SMTP_PORT === '465',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"BLOTIC - BVUCOEP" <${SMTP_USER}>`,
        to: testEmail,
        subject: `[TEST] 🎉 New Event: ${event.title}`,
        html: emailHTML,
      });

      console.log(`✅ Test email sent to: ${testEmail}`);
    } else {
      throw new Error('SMTP configuration missing');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Test email sent successfully',
        testEmail 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error sending test email:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
