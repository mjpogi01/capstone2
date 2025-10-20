const emailService = require('../lib/emailService');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

async function testEmailService() {
  console.log('🧪 Testing Yohanns Email Service...\n');

  // Check if email is configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.log('❌ Email service not configured!');
    console.log('Please set EMAIL_USER and EMAIL_PASSWORD in your .env file');
    console.log('See EMAIL_SETUP_GUIDE.md for setup instructions\n');
    return;
  }

  console.log('✅ Email configuration found');
  console.log(`📧 From: ${process.env.EMAIL_USER}`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL || 'Not set'}\n`);

  // Test email (replace with your email address)
  const testEmail = 'mjmonday01@gmail.com'; // Test email address
  
  if (testEmail === 'test@example.com') {
    console.log('⚠️  Please update the testEmail variable with your actual email address');
    console.log('Edit server/scripts/test-email.js and change the testEmail variable\n');
    return;
  }

  try {
    console.log(`📤 Sending test email to: ${testEmail}`);
    const result = await emailService.sendTestEmail(testEmail);
    
    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log(`📧 Message ID: ${result.messageId}`);
    } else {
      console.log('❌ Test email failed:', result.error);
    }
  } catch (error) {
    console.log('❌ Test email error:', error.message);
  }

  console.log('\n🎯 Email service test completed!');
}

// Run the test
testEmailService().catch(console.error);
