// Supabase configuration
const supabaseUrl = 'https://hixboztobthttorbzxxw.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhpeGJvenRvYnRodHRvcmJ6eHh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNDA4OTgsImV4cCI6MjA2MzcxNjg5OH0.aVJmzA2OC7istIlB6QYtU18Gqs48IMAEYMPW8Jlc8qk'

let supabase = null;

async function initializeSupabase() {
    try {
        if (!window.supabase) {
            throw new Error('Supabase library not loaded');
        }

        supabase = window.supabase.createClient(supabaseUrl, supabaseKey, {
            auth: {
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
                storage: window.localStorage
            },
            db: { schema: 'public' },
            global: { headers: { 'Content-Type': 'application/json' } }
        });

        // Test the connection
        const { error } = await supabase.from('profiles').select('count').limit(1);
        if (error) throw error;

        window.supabaseClient = supabase; // Set only after successful init
        console.log('Supabase initialized successfully');
        return true;
    } catch (error) {
        console.error('Error initializing Supabase:', error);
        window.supabaseClient = null;
        return false;
    }
}

// Helper function to get the current session with error handling
async function getCurrentSession() {
    try {
        if (!window.supabaseClient) {
            const initialized = await initializeSupabase();
            if (!initialized) {
                throw new Error('Failed to initialize Supabase');
            }
        }
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        if (error) {
            console.error('Error getting session:', error.message);
            throw error;
        }
        return session;
    } catch (error) {
        console.error('Error in getCurrentSession:', error.message);
        return null;
    }
}

// Helper function to get the current user with error handling
async function getCurrentUser() {
    try {
        const session = await getCurrentSession();
        if (!session) {
            console.log('No active session found');
            return null;
        }
        return session.user;
    } catch (error) {
        console.error('Error in getCurrentUser:', error.message);
        return null;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await initializeSupabase();
});

// Export the helper functions (not the client directly)
window.getCurrentSession = getCurrentSession;
window.getCurrentUser = getCurrentUser;
window.initializeSupabase = initializeSupabase; 