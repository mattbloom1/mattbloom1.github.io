const newQuoteButton = document.querySelector("#js-new-quote");

newQuoteButton.addEventListener("click", getQuote);

function getQuote() {
    console.log("Button clicked!");
    
    const apiEndpoint = "https://trivia.cyberwisp.com/getrandomchristmasquestion";

    fetch(apiEndpoint)
    .then(response => {
        if (response.ok) {
        return response.json();
        } else {
        console.error("Failed to fetch quote");
        throw new Error("Failed to fetch quote");
        }
    })
    .then(data => {
        displayQuote(data);
    })
    .catch(error => {
        console.error(error);
        alert("Failed to fetch quote");
    });
}

function displayQuote(quote) {
    document.getElementById("js-quote-text").innerText = quote.question;
}



const newAnswerButton = document.querySelector("#js-tweet");
newAnswerButton.addEventListener("click", getAnswer);

function getAnswer() {
    console.log("Button clicked!");
    
    const apiEndpoint = "https://trivia.cyberwisp.com/getrandomchristmasquestion";

    fetch(apiEndpoint)
    .then(response => {
        if (response.ok) {
        return response.json();
        } else {
        console.error("Failed to fetch answer");
        throw new Error("Failed to fetch answer");
        }
    })
    .then(data => {
        displayAnswer(data);
    })
    .catch(error => {
        console.error(error);
        alert("Failed to fetch answer");
    });
}

function displayAnswer(answer) {
    document.getElementById("js-quote-text").innerText = quote.answer;
}

getQuote();
