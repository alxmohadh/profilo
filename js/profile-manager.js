// Check if user is logged in
async function verifyUserAuthentication() {
    try {
        // Ensure Supabase is initialized
        if (!window.supabaseClient) {
            const initialized = await window.initializeSupabase();
            if (!initialized) {
                throw new Error('Failed to initialize Supabase');
            }
        }

        const user = await window.getCurrentUser();
        console.log('Profile check, user:', user);
        if (!user) {
            // Only redirect if not already on login.html
            if (!window.location.pathname.endsWith('login.html')) {
                window.location.href = 'login.html';
            }
            return null;
        }
        return user;
    } catch (error) {
        console.error('Error in verifyUserAuthentication:', error);
        if (!window.location.pathname.endsWith('login.html')) {
            window.location.href = 'login.html';
        }
        return null;
    }
}

// Load user profile data with retry logic
async function loadUserProfile(retryCount = 0) {
    try {
        const user = await verifyUserAuthentication();
        if (!user) {
            return;
        }

        // Ensure Supabase is initialized
        if (!window.supabaseClient) {
            const initialized = await window.initializeSupabase();
            if (!initialized) {
                throw new Error('Failed to initialize Supabase');
            }
        }

        // Get user profile data
        const { data: profile, error } = await window.supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            console.error('Error fetching profile:', error.message);
            // Retry logic for network errors
            if (retryCount < 3 && error.message.includes('Failed to fetch')) {
                console.log(`Retrying profile fetch (attempt ${retryCount + 1})`);
                await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
                return loadUserProfile(retryCount + 1);
            }
            throw new Error(`Failed to fetch profile: ${error.message}`);
        }

        if (!profile) {
            console.error('No profile data found for user');
            throw new Error('Profile data not found');
        }

        // Update profile elements with null checks
        const profileImage = document.getElementById('profileImage');
        const userName = document.getElementById('userName');
        const userRegion = document.getElementById('userRegion');
        const userJobTitle = document.getElementById('userJobTitle');
        const userProjects = document.getElementById('userProjects');

        if (!profileImage || !userName || !userRegion || !userJobTitle || !userProjects) {
            throw new Error('Required profile elements not found in the DOM');
        }

        // Handle profile picture with better error checking
        if (profile.profile_picture) {
            console.log('Profile picture URL:', profile.profile_picture);
            try {
                // Get fresh URL from storage if it's our uploaded file
                let imageUrl;
                if (profile.profile_picture.includes('profile-pictures')) {
                    // Extract filename from the URL
                    const urlParts = profile.profile_picture.split('/');
                    const fileName = urlParts[urlParts.length - 1];
                    
                    // Get fresh URL
                    const { data: urlData } = window.supabaseClient.storage
                        .from('profile-pictures')
                        .getPublicUrl(`avatars/${fileName}`);
                    
                    imageUrl = new URL(urlData.publicUrl);
                    console.log('Generated fresh URL:', imageUrl.href);
                } else {
                    imageUrl = new URL(profile.profile_picture);
                }
                
                console.log('Attempting to load image from URL:', imageUrl.href);
                
                // Create a new image object to test loading
                const img = new Image();
                
                // Set a timeout for the image loading
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Image load timeout')), 10000); // 10s timeout
                });

                // Try to load the image
                const loadPromise = new Promise((resolve, reject) => {
                    img.onload = () => {
                        console.log('Image loaded successfully');
                        resolve();
                    };
                    img.onerror = (error) => {
                        console.error('Image load error:', error);
                        reject(error);
                    };
                    // Add cache-busting parameter
                    img.src = `${imageUrl.href}?t=${Date.now()}`;
                });

                // Wait for either the image to load or timeout
                await Promise.race([loadPromise, timeoutPromise]);
                
                // If we get here, the image loaded successfully
                profileImage.style.backgroundImage = `url(${img.src})`;
                profileImage.style.backgroundSize = 'cover';
                profileImage.style.backgroundPosition = 'center';
                console.log('Profile image styles applied successfully');
                
            } catch (error) {
                console.error('Error loading profile picture:', error);
                // Try direct storage URL as fallback
                try {
                    console.log('Attempting fallback loading method...');
                    const { data: urlData } = window.supabaseClient.storage
                        .from('profile-pictures')
                        .getPublicUrl('avatars/1748147747959-rf8fnrl8nj');
                    const fallbackUrl = urlData.publicUrl;
                    console.log('Fallback URL:', fallbackUrl);
                    profileImage.style.backgroundImage = `url(${fallbackUrl}?t=${Date.now()})`;
                    profileImage.style.backgroundSize = 'cover';
                    profileImage.style.backgroundPosition = 'center';
                } catch (fallbackError) {
                    console.error('Fallback loading failed:', fallbackError);
                    setDefaultProfilePicture(profileImage);
                }
            }
        } else {
            console.log('No profile picture URL found, using default');
            setDefaultProfilePicture(profileImage);
        }
        
        // Update other profile elements with fallback values
        userName.textContent = profile.name || 'Name not set';
        userRegion.textContent = profile.region || 'Region not set';
        userJobTitle.textContent = profile.job_title || 'Job title not set';
        userProjects.textContent = profile.projects || '0';

    } catch (error) {
        console.error('Error loading profile:', error.message);
        // Show a more user-friendly error message
        alert(`Unable to load profile data: ${error.message}. Please try refreshing the page or contact support if the problem persists.`);
    }
}

// Helper function to set default profile picture
function setDefaultProfilePicture(profileImageElement) {
    // Use a data URL for the default profile picture (a simple user icon)
    const defaultImage = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDIxdi0yYTQgNCAwIDAgMC00LTRINGE0IDQgMCAwIDAtNCA0djIiPjwvcGF0aD48Y2lyY2xlIGN4PSIxMiIgY3k9IjciIHI9IjQiPjwvY2lyY2xlPjwvc3ZnPg==';
    profileImageElement.style.backgroundImage = `url(${defaultImage})`;
    profileImageElement.style.backgroundSize = 'cover';
    profileImageElement.style.backgroundPosition = 'center';
    profileImageElement.style.backgroundColor = '#f0f0f0';
}

// Handle logout
async function handleUserLogout() {
    try {
        if (!window.supabaseClient) {
            const initialized = await window.initializeSupabase();
            if (!initialized) {
                throw new Error('Failed to initialize Supabase');
            }
        }

        const { error } = await window.supabaseClient.auth.signOut();
        if (error) throw error;
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Error logging out:', error.message);
        alert('Error logging out. Please try again.');
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize Supabase first
    await window.initializeSupabase();
    
    // Load profile data
    loadUserProfile();

    // Add logout button listener
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleUserLogout);
    }
}); 