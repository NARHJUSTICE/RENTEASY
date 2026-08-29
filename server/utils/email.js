// server/utils/email.js
const nodemailer = require('nodemailer');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Send email function
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'RentEasy <noreply@renteasy.com>',
      to,
      subject,
      html
    });
    console.log('📧 Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email error:', error);
    return { success: false, error: error.message };
  }
};

// ✅ Application Status Email
const sendApplicationStatusEmail = async (tenantEmail, tenantName, propertyTitle, status, notes = '') => {
  const statusMap = {
    'approved': '✅ Approved',
    'rejected': '❌ Rejected',
    'pending': '⏳ Pending Review',
    'probation': '⏳ On Probation'
  };

  const statusColor = {
    'approved': '#22c55e',
    'rejected': '#ef4444',
    'pending': '#eab308',
    'probation': '#8b5cf6'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1e40af; font-size: 28px; margin: 0;">🏠 RentEasy</h1>
        <p style="color: #6b7280; margin: 4px 0;">Application Status Update</p>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Hello ${tenantName},</h2>
        
        <p style="color: #374151;">Your application for <strong>${propertyTitle}</strong> has been <strong style="color: ${statusColor[status]};">${statusMap[status]}</strong>.</p>
        
        ${notes ? `<div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
          <p style="color: #374151; margin: 0;"><strong>Landlord's Notes:</strong></p>
          <p style="color: #1f2937; margin: 4px 0 0 0;">${notes}</p>
        </div>` : ''}
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/my-applications" 
           style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 8px;">
          View My Applications
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© 2026 RentEasy. All rights reserved.</p>
        <p style="margin: 4px 0;">This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;

  return await sendEmail(tenantEmail, `Application ${statusMap[status]} - ${propertyTitle}`, html);
};

// ✅ ID Verification Email
const sendIDVerificationEmail = async (tenantEmail, tenantName, status, notes = '') => {
  const statusMap = {
    'approved': '✅ Verified',
    'rejected': '❌ Rejected',
    'pending': '⏳ Pending Review',
    'probation': '⏳ On Probation'
  };

  const statusColor = {
    'approved': '#22c55e',
    'rejected': '#ef4444',
    'pending': '#eab308',
    'probation': '#8b5cf6'
  };

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1e40af; font-size: 28px; margin: 0;">🏠 RentEasy</h1>
        <p style="color: #6b7280; margin: 4px 0;">ID Verification Update</p>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Hello ${tenantName},</h2>
        
        <p style="color: #374151;">Your ID proof has been <strong style="color: ${statusColor[status]};">${statusMap[status]}</strong>.</p>
        
        ${notes ? `<div style="background: #f3f4f6; padding: 12px; border-radius: 6px; margin: 16px 0;">
          <p style="color: #374151; margin: 0;"><strong>Landlord's Notes:</strong></p>
          <p style="color: #1f2937; margin: 4px 0 0 0;">${notes}</p>
        </div>` : ''}
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/id-upload" 
           style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 8px;">
          Check ID Status
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© 2026 RentEasy. All rights reserved.</p>
        <p style="margin: 4px 0;">This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;

  return await sendEmail(tenantEmail, `ID Verification ${statusMap[status]}`, html);
};

// ✅ New Application Notification (for landlord)
const sendNewApplicationEmail = async (landlordEmail, landlordName, tenantName, propertyTitle) => {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
      <div style="text-align: center; padding: 20px 0;">
        <h1 style="color: #1e40af; font-size: 28px; margin: 0;">🏠 RentEasy</h1>
        <p style="color: #6b7280; margin: 4px 0;">New Application Received</p>
      </div>
      
      <div style="background: white; border-radius: 8px; padding: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <h2 style="color: #111827; font-size: 20px; margin-top: 0;">Hello ${landlordName},</h2>
        
        <p style="color: #374151;">You have received a new application for <strong>${propertyTitle}</strong>.</p>
        
        <div style="background: #eff6ff; padding: 12px; border-radius: 6px; margin: 16px 0; border-left: 4px solid #3b82f6;">
          <p style="color: #1e40af; margin: 0; font-size: 14px;">
            👤 <strong>Applicant:</strong> ${tenantName}<br>
            📋 <strong>Property:</strong> ${propertyTitle}
          </p>
        </div>
        
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/applications" 
           style="display: inline-block; background: #1e40af; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin-top: 8px;">
          View Applications
        </a>
      </div>
      
      <div style="text-align: center; padding: 20px 0; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">© 2026 RentEasy. All rights reserved.</p>
        <p style="margin: 4px 0;">This is an automated message, please do not reply.</p>
      </div>
    </div>
  `;

  return await sendEmail(landlordEmail, `New Application for ${propertyTitle}`, html);
};

module.exports = {
  sendEmail,
  sendApplicationStatusEmail,
  sendIDVerificationEmail,
  sendNewApplicationEmail
};