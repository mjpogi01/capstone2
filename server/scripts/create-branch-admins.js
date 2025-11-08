const path = require('path');
const { createClient } = require('@supabase/supabase-js');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const branchAdminDefinitions = [
  {
    branchId: 1,
    branchName: 'SAN PASCUAL (MAIN BRANCH)',
    slug: 'sanpascual',
    email: 'admin.sanpascual@yohanns.com',
    firstName: 'San Pascual',
    lastName: 'Admin'
  },
  {
    branchId: 2,
    branchName: 'CALAPAN BRANCH',
    slug: 'calapan',
    email: 'admin.calapan@yohanns.com',
    firstName: 'Calapan',
    lastName: 'Admin'
  },
  {
    branchId: 3,
    branchName: 'MUZON BRANCH',
    slug: 'muzon',
    email: 'admin.muzon@yohanns.com',
    firstName: 'Muzon',
    lastName: 'Admin'
  },
  {
    branchId: 4,
    branchName: 'LEMERY BRANCH',
    slug: 'lemery',
    email: 'admin.lemery@yohanns.com',
    firstName: 'Lemery',
    lastName: 'Admin'
  },
  {
    branchId: 5,
    branchName: 'BATANGAS CITY BRANCH',
    slug: 'batangascity',
    email: 'admin.batangascity@yohanns.com',
    firstName: 'Batangas City',
    lastName: 'Admin'
  },
  {
    branchId: 6,
    branchName: 'BAUAN BRANCH',
    slug: 'bauan',
    email: 'admin.bauan@yohanns.com',
    firstName: 'Bauan',
    lastName: 'Admin'
  },
  {
    branchId: 7,
    branchName: 'CALACA BRANCH',
    slug: 'calaca',
    email: 'admin.calaca@yohanns.com',
    firstName: 'Calaca',
    lastName: 'Admin'
  },
  {
    branchId: 8,
    branchName: 'PINAMALAYAN BRANCH',
    slug: 'pinamalayan',
    email: 'admin.pinamalayan@yohanns.com',
    firstName: 'Pinamalayan',
    lastName: 'Admin'
  },
  {
    branchId: 9,
    branchName: 'ROSARIO BRANCH',
    slug: 'rosario',
    email: 'admin.rosario@yohanns.com',
    firstName: 'Rosario',
    lastName: 'Admin'
  }
];

function buildDefaultPassword(slug) {
  const cleaned = slug.replace(/[^a-zA-Z0-9]/g, '');
  const capitalized = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return `${capitalized}Admin123!`;
}

function buildMetadata(definition) {
  const fullName = `${definition.firstName} ${definition.lastName}`.trim();
  return {
    role: 'admin',
    branch_id: definition.branchId,
    branch_name: definition.branchName,
    first_name: definition.firstName,
    last_name: definition.lastName,
    full_name: fullName
  };
}

async function fetchAllUsers(perPage = 1000) {
  let page = 1;
  const allUsers = [];

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });

    if (error) {
      throw error;
    }

    allUsers.push(...(data.users || []));

    if (!data.users || data.users.length < perPage) {
      break;
    }

    page += 1;
  }

  return allUsers;
}

async function ensureBranchAdmin(definition, existingUser) {
  const metadata = buildMetadata(definition);
  const password = buildDefaultPassword(definition.slug);

  if (existingUser) {
    const currentMetadata = existingUser.user_metadata || {};

    const newMetadata = {
      ...currentMetadata,
      ...metadata
    };

    const metadataChanged = Object.keys(metadata).some((key) => {
      return currentMetadata[key] !== metadata[key];
    });

    if (!metadataChanged) {
      return { action: 'skipped', email: definition.email, userId: existingUser.id, message: 'Already configured' };
    }

    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      user_metadata: newMetadata
    });

    if (error) {
      throw new Error(`Failed to update user metadata for ${definition.email}: ${error.message}`);
    }

    return { action: 'updated', email: definition.email, userId: existingUser.id, message: 'Metadata updated' };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: definition.email,
    password,
    email_confirm: true,
    user_metadata: metadata
  });

  if (error) {
    throw new Error(`Failed to create admin ${definition.email}: ${error.message}`);
  }

  return {
    action: 'created',
    email: definition.email,
    userId: data.user.id,
    message: `Account created with default password ${password}`
  };
}

async function main() {
  try {
    console.log('🏢 Fetching branches from database...');
    const { data: branches, error: branchesError } = await supabase
      .from('branches')
      .select('id, name');

    if (branchesError) {
      throw new Error(`Failed to fetch branches: ${branchesError.message}`);
    }

    const branchMap = new Map(branches.map((branch) => [branch.id, branch.name]));

    console.log('👥 Fetching existing users...');
    const users = await fetchAllUsers();
    const userEmailMap = new Map(users.map((user) => [user.email.toLowerCase(), user]));

    const results = [];

    for (const definition of branchAdminDefinitions) {
      if (!branchMap.has(definition.branchId)) {
        results.push({
          action: 'skipped',
          email: definition.email,
          userId: null,
          message: `Branch ID ${definition.branchId} not found in database`
        });
        continue;
      }

      const existingUser = userEmailMap.get(definition.email.toLowerCase()) || null;

      try {
        const result = await ensureBranchAdmin(definition, existingUser);
        results.push(result);
      } catch (error) {
        results.push({
          action: 'error',
          email: definition.email,
          userId: existingUser?.id || null,
          message: error.message
        });
      }
    }

    console.log('\n📋 Branch admin creation summary:');
    results.forEach((result) => {
      console.log(`- ${result.email}: ${result.action.toUpperCase()}${result.message ? ` → ${result.message}` : ''}`);
    });

    console.log('\n✅ Process complete.');
  } catch (error) {
    console.error('❌ Failed to create branch admin accounts:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  main
};


