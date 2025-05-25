// Function to generate a random number between min and max values
function generateRandomNumber(min, max) {
    return Math.random() * (max - min) + min;
}

// Function to animate the bubbles in the banner
function animateBubbleElements() {
    // Get all bubble elements
    const bubbles = document.querySelectorAll('.bubble');
    console.log('Found bubbles:', bubbles.length);
    
    // Apply animation to each bubble
    bubbles.forEach((bubble, index) => {
        // Set initial random position within the banner
        const startX = generateRandomNumber(0, window.innerWidth);
        const startY = generateRandomNumber(0, 234); // Banner height
        
        // Set random movement speed for each bubble
        const speedX = generateRandomNumber(-2, 2);
        const speedY = generateRandomNumber(-1, 1);
        
        // Set initial position
        bubble.style.left = `${startX}px`;
        bubble.style.top = `${startY}px`;
        
        // Function to animate individual bubble
        function moveBubbleElement() {
            // Get current position
            const currentX = parseFloat(bubble.style.left);
            const currentY = parseFloat(bubble.style.top);
            
            // Add some randomness to movement
            const randomX = generateRandomNumber(-0.5, 0.5);
            const randomY = generateRandomNumber(-0.5, 0.5);
            
            // Calculate new position with random variation
            let newX = currentX + speedX + randomX;
            let newY = currentY + speedY + randomY;
            
            // Bounce off edges of the banner
            if (newX < -50 || newX > window.innerWidth) {
                newX = generateRandomNumber(0, window.innerWidth);
            }
            if (newY < -50 || newY > 234) { // Banner height
                newY = generateRandomNumber(0, 234);
            }
            
            // Update bubble position
            bubble.style.left = `${newX}px`;
            bubble.style.top = `${newY}px`;
            
            // Continue animation
            requestAnimationFrame(moveBubbleElement);
        }
        
        // Start animation for this bubble
        moveBubbleElement();
    });
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing animations');
    animateBubbleElements();
});

// Reinitialize animations on window resize
window.addEventListener('resize', () => {
    console.log('Window resized, reinitializing animations');
    animateBubbleElements();
}); 
