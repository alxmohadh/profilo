// Check if user is logged in
async function checkUserAuthentication() {
    const user = await window.getCurrentUser();
    console.log('Auth check, user:', user);
    // Only redirect if not already on user-profile.html
    if (user && !window.location.pathname.endsWith('user-profile.html')) {
        window.location.href = 'user-profile.html';
    }
}

// Handle registration
async function handleUserRegistration(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const name = formData.get('name');
    const region = formData.get('region');
    const jobTitle = formData.get('jobTitle');
    const projects = formData.get('projects');
    const profilePicture = formData.get('profilePicture');

    try {
        // First, SignUp the user
        const { data: authData, error: authError } = await window.supabaseClient.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    region,
                    job_title: jobTitle,
                    projects
                }
            }
        });

        if (authError) throw authError;

        // Wait a moment to ensure the user is created
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Handle profile picture upload
        let publicUrl = null;
        if (profilePicture && profilePicture.size > 0) {
            try {
                // Validate file type
                if (!profilePicture.type.startsWith('image/')) {
                    throw new Error('Please upload an image file');
                }

                // Validate file size (max 5MB)
                if (profilePicture.size > 5 * 1024 * 1024) {
                    throw new Error('Image size should be less than 5MB');
                }

                // Generate unique filename
                const fileExt = profilePicture.name.split('.').pop().toLowerCase();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                const filePath = `${authData.user.id}/${fileName}`;

                console.log('Uploading file:', fileName, 'Type:', profilePicture.type);

                // Upload the file
                const { data: uploadData, error: uploadError } = await window.supabaseClient.storage
                    .from('profile-pictures')
                    .upload(filePath, profilePicture, {
                        cacheControl: '3600',
                        contentType: profilePicture.type,
                        upsert: false
                    });

                if (uploadError) {
                    console.error('Upload error:', uploadError);
                    throw uploadError;
                }

                console.log('File uploaded successfully:', uploadData);

                // Get public URL
                const { data: urlData } = window.supabaseClient.storage
                    .from('profile-pictures')
                    .getPublicUrl(filePath);

                publicUrl = urlData.publicUrl;
                console.log('Public URL generated:', publicUrl);

            } catch (uploadError) {
                console.error('Error uploading profile picture:', uploadError);
                alert('Failed to upload profile picture: ' + uploadError.message);
                // Continue with registration but without profile picture
            }
        }

        // Store user profile data
        const { error: profileError } = await window.supabaseClient
            .from('profiles')
            .upsert([
                {
                    id: authData.user.id,
                    name,
                    region,
                    job_title: jobTitle,
                    projects: parseInt(projects) || 0,
                    profile_picture: publicUrl,
                    updated_at: new Date().toISOString()
                }
            ]);

        if (profileError) throw profileError;

        alert('SignUp successful! Please log in.');
        window.location.href = 'login.html';
    } catch (error) {
        console.error('Registration error:', error);
        alert(error.message);
    }
}

// Handle login
async function handleUserLogin(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const email = formData.get('email');
    const password = formData.get('password');

    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        // Redirect to profile page
        window.location.href = 'user-profile.html';
    } catch (error) {
        console.error('Login error:', error);
        alert(error.message);
    }
}

// Add event listeners
document.addEventListener('DOMContentLoaded', () => {
    const SignUpForm = document.getElementById('SignUpForm');
    const loginForm = document.getElementById('loginForm');

    if (SignUpForm) {
        SignUpForm.addEventListener('submit', handleUserRegistration);
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleUserLogin);
    }

    // Check if user is already logged in
    checkUserAuthentication();
}); 