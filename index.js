function sanitizeInput(input) {
    // This regular expression matches allowed characters including Hebrew, numbers, spaces, and specified punctuation
    const allowedCharactersRegExp = /[\u0590-\u05FF0-9\s.,״"()\-_\\|{}\/:–]/g;
    
    // Extract only the matches for the allowed characters
    let sanitizedInput = input.match(allowedCharactersRegExp)?.join('') || '';

    // Replace every " with ״
    sanitizedInput = sanitizedInput.replace(/"/g, '״');
    sanitizedInput = sanitizedInput.replace(/–/g, '-');
    
    // Swap ( with ) and ) with (
    // We use a function as the replacement argument to handle both replacements in one go
    sanitizedInput = sanitizedInput.replace(/[()]/g, char => char === '(' ? ')' : '(');

    return sanitizedInput;
}

function calculateWPM(startTime, wordCount) {
    const currentTime = new Date();
    const timeDifference = (currentTime - startTime) / 60000; // convert ms to minutes
    const wpm = Math.round(wordCount / timeDifference);
    return wpm;
}

function triggerConfetti(wpm) {
    confetti({
        particleCount: 1000,
        spread: 300,
        origin: { y: 0 },
        rotate: true,
        clock: 100,
    });

    // Show WPM with the confetti
    Toastify({
        text: `הקלדת במהירות של ${wpm} מילים בדקה!`,
        duration: 7500,
        gravity: "top",
        position: "center",
        className: "success",
    }).showToast();
}

function triggerToast(message) {
    Toastify({
        text: message,
        duration: 3000,
        destination: "https://github.com/apvarun/toastify-js",
        newWindow: true,
        close: true,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
        stopOnFocus: true, // Prevents dismissing of toast on hover
        onClick: function(){} // Callback after click
      }).showToast();
}

document.addEventListener('DOMContentLoaded', function() {
    let originalText = '';
    let currentIndex = 0;
    let currentWord = '';
    let startTime;
    let wordCount = 0;

    const typingContainer = document.getElementById('typing-container');
    const typedTextElement = document.getElementById('typed-text');
    const textInputContainer = document.getElementById('text-input-container');
    const untypedTextElement = document.getElementById('untyped-text');
    const userInput = document.getElementById('user-text-input');
    const startButton = document.getElementById('start-typing-button');
    const lastCharContainer = document.getElementById('last-char-container');
    const statsContainer = document.getElementById('word-stats');
    const restartButton = document.getElementById('restart-typing-button');

    function resetTyping() {
        // Reset all variables
        originalText = '';
        currentIndex = 0;
        currentWord = '';
        wordCount = 0;
        startTime = undefined;
        
        // Hide the typing container and stats
        typingContainer.style.display = 'none';
        textInputContainer.style.display = 'block';
        statsContainer.style.display = 'none';
        restartButton.style.display = 'none';
        
        // Reset the text areas
        userInput.value = '';
        typedTextElement.textContent = '';
        untypedTextElement.textContent = '';
        lastCharContainer.textContent = '';
        
        // Show the user text input and the start button
        userInput.style.display = 'block';
        startButton.style.display = 'inline';
        
        // Focus on the text input area
        userInput.focus();
    }

    restartButton.addEventListener('click', resetTyping);

    function updateWordStats() {
        // Assuming words are separated by spaces, calculate word stats
        const totalWords = originalText.trim().split(/\s+/).length;
        const wordsWritten = wordCount;
        const wordsLeft = totalWords - wordsWritten > 0 ? totalWords - wordsWritten : 0;

        // Update the stats in the HTML
        document.getElementById('total-words-count').textContent = totalWords;
        document.getElementById('words-written-count').textContent = wordsWritten;
        document.getElementById('words-left-count').textContent = wordsLeft;
    }

    function handleTyping(e) {
        // Start the timer on the first keypress that's not Enter (to skip starting on the Enter key to submit the textarea)
        if (!startTime && e.key !== 'Enter') {
            startTime = new Date();
        }

        if (currentIndex < originalText.length) {
            const nextChar = originalText[currentIndex];
            if (e.key === 'Enter' && nextChar === '\n') {
                currentIndex++;
                currentWord = '';
                e.preventDefault();
            } else if (e.key === nextChar) {
                // Set the last typed character
                if (e.key === ' ') {
                    currentWord = ''
                } else {
                    currentWord += e.key;
                }
                document.getElementById('last-char-container').textContent = currentWord;
                currentIndex++;
                
                // Count words when a space or Enter is pressed, or when typing is complete
                if (e.key === ' ' || e.key === 'Enter' || currentIndex === originalText.length - 1) {
                    wordCount++;
                    updateWordStats();
                }
            }
            updateTextDisplay();
        }
    }

    function updateTextDisplay() {
        typedTextElement.textContent = originalText.slice(0, currentIndex);
        untypedTextElement.textContent = originalText.slice(currentIndex);
        typingContainer.scrollTop = typingContainer.scrollHeight;

        if (currentIndex === originalText.length) {
            // Clear the last char container
            currentWord = '';
            document.getElementById('last-char-container').textContent = '';
            updateWordStats();
            const wpm = calculateWPM(startTime, wordCount);
            triggerConfetti(wpm);
        }
    }

    startButton.addEventListener('click', function() {
        if (userInput.value === '') {
            triggerToast('Please enter some text to start typing!')
            return;
        }
        // Sanitize the user input before setting it as the originalText
        originalText = sanitizeInput(userInput.value);
        currentIndex = 0;
        typedTextElement.textContent = '';
        untypedTextElement.textContent = originalText;
    
        // Hide the input area and button
        userInput.style.display = 'none';
        startButton.style.display = 'none';
        textInputContainer.style.display = 'none';
        typingContainer.style.display = 'block';
        statsContainer.style.display = 'flex';
        restartButton.style.display = 'block'; // Show the restart button

        document.getElementById('last-char-container').textContent = '';
        wordCount = 0;
        startTime = undefined;
        updateWordStats();

        // Focus on the typing container to start typing
        typingContainer.focus();
        typingContainer.addEventListener('keydown', handleTyping);

        userInput.focus();
    });    
    

    // Optionally, handle the Enter key to start typing
    userInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            startButton.click();
            e.preventDefault();
        }
    });
});

// Event listener for the "משפט רנדומלי" button
document.getElementById('random-sentence-button').addEventListener('click', function() {
    const numberOfSentences = prompt("כמה משפטים רנדומליים תרצה לקבל?")
    fetch('hebrew.txt')
        .then(response => response.text())
        .then(text => {
            // Get the number of sentences selected by the user
            const sentences = text.split('\n');
            let result = '';
            
            // Fetch the required number of random sentences
            for (let i = 0; i < numberOfSentences; i++) {
                let randomSentence;
                while (!randomSentence || randomSentence.trim() === '') {
                    const randomIndex = Math.floor(Math.random() * sentences.length);
                    randomSentence = sentences[randomIndex];
                }
                // Add only the first 10 words of the random sentence
                result += randomSentence.split(/\s+/).slice(0, 10).join(' ') + '\n';
            }
            // Set the textarea value to the sentences fetched
            document.getElementById('user-text-input').value = result.trim();
        })
        .catch(err => console.error('Error fetching the sentences:', err));
});
