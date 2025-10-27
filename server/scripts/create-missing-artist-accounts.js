const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Supabase connection configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createArtistAccounts() {
  try {
    console.log('🎨 Creating 18 Missing Artist Accounts...\n');
    
    const artistAccounts = [];
    
    // Generate 18 artist accounts (we already have 2)
    for (let i = 1; i <= 20; i++) {
      const email = `artist${i}@yohanns.com`;
      const artistName = `Artist ${i}`;
      
      // Skip if this is one of the existing accounts
      if (i === 1 || i === 2) {
        continue; // Skip artist1 and artist2 as they might already exist
      }
      
      artistAccounts.push({
        email,
        password: 'Artist123!',
        user_metadata: {
          role: 'artist',
          artist_name: artistName,
          full_name: artistName
        },
        email_confirm: true // Auto-confirm email
      });
    }
    
    console.log(`📝 Will create ${artistAccounts.length} artist accounts:`);
    artistAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.email} (${account.user_metadata.artist_name})`);
    });
    
    // Create accounts one by one
    let successCount = 0;
    let errorCount = 0;
    
    for (const account of artistAccounts) {
      try {
        const { data, error } = await supabase.auth.admin.createUser({
          email: account.email,
          password: account.password,
          user_metadata: account.user_metadata,
          email_confirm: account.email_confirm
        });
        
        if (error) {
          console.log(`❌ Failed to create ${account.email}:`, error.message);
          errorCount++;
        } else {
          console.log(`✅ Created ${account.email} (${account.user_metadata.artist_name})`);
          successCount++;
          
          // Wait a bit to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      } catch (err) {
        console.log(`❌ Error creating ${account.email}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`✅ Successfully created: ${successCount} accounts`);
    console.log(`❌ Failed to create: ${errorCount} accounts`);
    
    // Now check if profiles were created automatically
    console.log(`\n🔍 Checking if profiles were created automatically...`);
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for trigger
    
    const { data: allUsers, error: allUsersError } = await supabase.auth.admin.listUsers();
    
    if (!allUsersError) {
      const artistUsers = allUsers.users.filter(user => 
        user.user_metadata?.role === 'artist'
      );
      
      console.log(`👥 Total artist users: ${artistUsers.length}`);
      
      // Check profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('artist_profiles')
        .select('artist_name, user_id');
      
      if (!profilesError) {
        console.log(`📋 Total artist profiles: ${profiles.length}`);
        
        if (profiles.length < artistUsers.length) {
          console.log(`⚠️  Some profiles are missing. Creating them manually...`);
          
          const usersWithProfiles = profiles.map(p => p.user_id);
          const usersNeedingProfiles = artistUsers.filter(user => 
            !usersWithProfiles.includes(user.id)
          );
          
          for (const user of usersNeedingProfiles) {
            const artistName = user.user_metadata?.artist_name || `Artist ${user.email.split('@')[0]}`;
            
            const { error: profileError } = await supabase
              .from('artist_profiles')
              .insert({
                user_id: user.id,
                artist_name: artistName,
                bio: 'Professional design layout specialist',
                specialties: ['Layout Design', 'Custom Graphics', 'Team Jerseys'],
                commission_rate: 12.00,
                rating: 0.00,
                is_verified: false,
                is_active: true
              });
            
            if (profileError) {
              console.log(`❌ Failed to create profile for ${user.email}:`, profileError.message);
            } else {
              console.log(`✅ Created profile for ${user.email} (${artistName})`);
            }
          }
        }
      }
    }
    
    console.log(`\n🎉 Artist account creation complete!`);
    console.log(`📝 Login credentials:`);
    console.log(`   Email: artist1@yohanns.com through artist20@yohanns.com`);
    console.log(`   Password: Artist123!`);
    
  } catch (error) {
    console.error('❌ Error creating artist accounts:', error.message);
  }
}

if (require.main === module) {
  createArtistAccounts();
}

module.exports = createArtistAccounts;
