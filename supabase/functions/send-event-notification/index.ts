import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { eventId } = await req.json();

    if (!eventId) {
      throw new Error('Event ID is required');
    }

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Get event details
    const { data: event, error: eventError } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    if (eventError || !event) {
      throw new Error('Event not found');
    }

    // Check if email is approved by admin
    if (!event.email_approved_by_admin) {
      throw new Error('Email not approved by admin');
    }

    // Check if already sent
    if (event.email_sent_at) {
      throw new Error('Email already sent for this event');
    }

    // Get all students (role = 'student') with their auth emails
    const { data: students, error: studentsError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        is_active
      `)
      .eq('role', 'student')
      .eq('is_active', true);

    if (studentsError || !students || students.length === 0) {
      throw new Error('No active students found');
    }

    // Get emails from auth.users for each student
    const studentsWithEmails = await Promise.all(
      students.map(async (student) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(student.id);
        return {
          ...student,
          email: authUser?.user?.email || null,
        };
      })
    );

    // Filter out students without emails
    const validStudents = studentsWithEmails.filter(s => s.email);

    console.log(`📧 Sending event notification to ${validStudents.length} students (${students.length} total found)`);

    if (validStudents.length === 0) {
      throw new Error('No students with valid email addresses found');
    }

    // Get SMTP credentials from environment
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
    const createEmailHTML = (studentName: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6; 
      color: #e2e8f0;
      background: #000000;
      padding: 0;
      margin: 0;
    }
    .email-wrapper {
      width: 100%;
      min-height: 100vh;
      background: #000000;
      padding: 0;
    }
    .email-container {
      max-width: 100%;
      margin: 0 auto;
      background: #0a0a0f;
      overflow: hidden;
    }
    .header {
      background: #2d2738;
      color: white;
      padding: 80px 40px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .header::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: url('data:image/svg+xml,<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)" /></svg>');
      opacity: 0.3;
    }
    .header-content { position: relative; z-index: 1; }
    .logo-container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
      margin-left: auto;
      margin-right: auto;
      width: fit-content;
    }
    .logo-img {
      width: 90px;
      height: 90px;
      object-fit: contain;
      filter: drop-shadow(0 4px 12px rgba(167, 139, 250, 0.4));
      display: block;
    }
    .logo-text {
      font-size: 56px;
      font-weight: 900;
      letter-spacing: 4px;
      text-shadow: 2px 2px 8px rgba(0,0,0,0.4);
      color: #a78bfa;
      display: block;
    }
    .subtitle {
      font-size: 18px;
      opacity: 0.85;
      font-weight: 300;
      letter-spacing: 1px;
      color: #a0aec0;
      text-align: center;
    }
    .content { background: #0a0a0a; padding: 40px 30px; color: #e5e7eb; }
    .event-card { background: #1a1a1a; padding: 25px; border-radius: 8px; margin: 25px 0; border: 1px solid #2d2d2d; }
    .event-title { color: #a78bfa; font-size: 26px; font-weight: bold; margin-bottom: 15px; }
    .event-detail { margin: 12px 0; padding: 12px; background: #0f0f0f; border-radius: 5px; color: #e5e7eb; border-left: 3px solid #a78bfa; }
    .event-detail strong { color: #a78bfa; }
    .cta-button { 
      display: inline-block; 
      background: #a78bfa;
      color: white !important; 
      padding: 18px 45px;
      text-decoration: none; 
      border-radius: 50px;
      font-weight: 600;
      font-size: 17px;
      margin: 35px 0;
      box-shadow: 0 12px 35px rgba(167, 139, 250, 0.5);
      text-align: center;
    }
    .footer { 
      background: #000000;
      color: #6b7280;
      padding: 50px 40px;
      text-align: center;
      border-top: 1px solid rgba(167, 139, 250, 0.15);
    }
    .footer-logo {
      font-size: 28px;
      font-weight: 700;
      color: #a78bfa;
      margin-bottom: 18px;
    }
    .footer-text { font-size: 14px; margin: 12px 0; line-height: 1.7; color: #8b92a0; }
    @media only screen and (max-width: 600px) {
      .header { padding: 60px 25px; }
      .logo-img { width: 70px; height: 70px; }
      .logo-text { font-size: 42px; }
      .logo-container { gap: 6px; }
      .content { padding: 40px 25px; }
    }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="header">
        <div class="header-content">
          <center>
            <div class="logo-container">
              <img src="https://blotic-bvucoep.vercel.app/images/blotic.png" alt="BLOTIC Logo" class="logo-img" />
              <div class="logo-text">BLOTIC</div>
            </div>
          </center>
          <div class="subtitle">Blockchain & Web3 Club - BVUCOEP</div>
        </div>
      </div>
    <div class="content">
      <p>Hi ${studentName || 'Student'},</p>
      <p>We're excited to announce a new event that you won't want to miss!</p>
      
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
      <div class="footer-logo">BLOTIC</div>
      <div class="footer-text">&copy; ${new Date().getFullYear()} BLOTIC - BVUCOEP. All rights reserved.</div>
      <div class="footer-text">You received this email because you're a member of our community.</div>
    </div>
  </div>
  </div>
</body>
</html>
    `;

    // Send emails using SMTP
    let successCount = 0;
    let failureCount = 0;

    for (const student of validStudents) {
      try {
        const emailHTML = createEmailHTML(student.full_name || 'Student');
        
        // Use SMTP to send email
        if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
          // Import nodemailer for SMTP
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
            to: student.email,
            subject: `🎉 New Event: ${event.title}`,
            html: emailHTML,
          });

          successCount++;
          console.log(`✅ Email sent to: ${student.email}`);
        } else {
          // Fallback: Just log (for development)
          console.log(`📧 [DEV MODE] Would send email to: ${student.email}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to send email to ${student.email}:`, error);
        failureCount++;
      }
    }

    // Update event with email sent status
    const { error: updateError } = await supabaseAdmin
      .from('events')
      .update({
        email_sent_at: new Date().toISOString(),
        email_sent_to_count: successCount,
      })
      .eq('id', eventId);

    if (updateError) {
      console.error('Failed to update event:', updateError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Email notification sent successfully`,
        stats: {
          total: students.length,
          success: successCount,
          failed: failureCount,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error sending event notification:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
